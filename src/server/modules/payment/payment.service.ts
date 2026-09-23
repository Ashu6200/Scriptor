import crypto from "node:crypto";
import { BaseService } from "@core/base.service";
import {
  AmountMismatchError,
  AppError,
  InvalidWebhookSignatureError,
  PaymentNotFoundError,
  UnauthorizedPaymentAccessError,
} from "@core/errors";
import { config } from "@infra/config";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { razorpay } from "@infra/razorpay";
import { redis } from "@infra/redis";
import {
  LedgerTransactionStatus,
  LedgerTransactionType,
  PaymentOrderStatus,
  PaymentStatus,
} from "@prisma/client";
import type { VerifyPaymentInput } from "./payment.schema";
import { PaymentStateMachine } from "./payment.state-machine";

const log = logger.child("PaymentService");

export class PaymentService extends BaseService {
  public verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ): boolean {
    const secret = config.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new AppError("Razorpay key secret is not configured", 500, "RAZORPAY_NOT_CONFIGURED");
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  async verifyAndProcessPayment(userId: string, input: VerifyPaymentInput) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

      const valid = this.verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      if (!valid) {
        log.warn(`Invalid checkout signature for razorpay_order_id: ${razorpay_order_id}`);
        throw new InvalidWebhookSignatureError("Invalid Razorpay payment signature");
      }

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
        include: { order: true },
      });

      if (!payment) {
        throw new PaymentNotFoundError(razorpay_order_id);
      }

      if (payment.userId !== userId) {
        throw new UnauthorizedPaymentAccessError();
      }

      if (payment.status === PaymentStatus.CAPTURED) {
        log.info(`Payment ${payment.id} is already CAPTURED. Returning current state.`);
        return {
          success: true,
          status: payment.status,
          paymentId: payment.id,
          orderId: payment.orderId,
        };
      }

      PaymentStateMachine.assertPaymentTransition(payment.status, PaymentStatus.CAPTURED);

      const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
      if (!rzpPayment) {
        throw new AppError("Razorpay payment details not found", 404);
      }

      const rzpAmount = Number(rzpPayment.amount);
      if (rzpAmount !== payment.amount) {
        log.error(
          `Amount mismatch for payment ${payment.id}: DB=${payment.amount}, RZP=${rzpAmount}`
        );
        throw new AmountMismatchError(payment.amount, rzpAmount);
      }

      const capturedAt = rzpPayment.captured ? new Date() : null;
      const method = (rzpPayment.method as string) || "unknown";

      const updatedPayment = await this.executePaymentCaptureTransaction({
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        razorpayPaymentId: razorpay_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        method,
        capturedAt,
      });

      log.info(`Payment ${payment.id} successfully captured for order ${payment.orderId}`);

      return {
        success: true,
        status: updatedPayment.status,
        paymentId: updatedPayment.id,
        orderId: updatedPayment.orderId,
      };
    } catch (error) {
      this.handleError(error, "Failed to verify and process payment");
    }
  }

  public async executePaymentCaptureTransaction(data: {
    paymentId: string;
    orderId: string;
    userId: string;
    razorpayPaymentId: string;
    amount: number;
    currency: string;
    method: string;
    capturedAt: Date | null;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id: data.paymentId },
      });

      if (!current) {
        throw new PaymentNotFoundError(data.paymentId);
      }

      if (current.status === PaymentStatus.CAPTURED) {
        return current;
      }

      PaymentStateMachine.assertPaymentTransition(current.status, PaymentStatus.CAPTURED);

      const updatedPayment = await tx.payment.update({
        where: { id: data.paymentId },
        data: {
          status: PaymentStatus.CAPTURED,
          razorpayPaymentId: data.razorpayPaymentId,
          method: data.method,
          capturedAt: data.capturedAt || new Date(),
        },
      });

      const order = await tx.paymentOrder.update({
        where: { id: data.orderId },
        data: {
          status: PaymentOrderStatus.PAID,
        },
      });

      const orderMetadata = order?.metadata as { items?: Array<{ productId: string }> } | null;
      const items = orderMetadata?.items || [];
      let resolvedPlan: "PRO" | "MAX" | null = null;
      let durationDays = 30;

      for (const item of items) {
        if (item.productId.startsWith("pro-plan")) {
          resolvedPlan = "PRO";
          if (item.productId.includes("yearly")) durationDays = 365;
          break;
        }
        if (item.productId.startsWith("max-plan")) {
          resolvedPlan = "MAX";
          if (item.productId.includes("yearly")) durationDays = 365;
          break;
        }
      }

      if (resolvedPlan) {
        const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        await tx.user.update({
          where: { id: data.userId },
          data: {
            subscriptionPlan: resolvedPlan,
            subscriptionStatus: "ACTIVE",
            subscriptionPeriodEnd: periodEnd,
          },
        });
        log.info(
          `Fulfilled subscription plan ${resolvedPlan} for user ${data.userId} until ${periodEnd.toISOString()}`
        );
      }

      try {
        await tx.ledgerEntry.create({
          data: {
            userId: data.userId,
            orderId: data.orderId,
            paymentId: data.paymentId,
            razorpayPaymentId: data.razorpayPaymentId,
            type: LedgerTransactionType.PAYMENT,
            amount: data.amount,
            currency: data.currency,
            status: LedgerTransactionStatus.SUCCESS,
            metadata: {
              method: data.method,
              capturedAt: data.capturedAt?.toISOString(),
            },
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.warn(
          `Ledger entry already exists for razorpayPaymentId ${data.razorpayPaymentId}: ${message}`
        );
      }

      return updatedPayment;
    });

    try {
      const sessions = await prisma.session.findMany({
        where: { userId: data.userId },
        select: { token: true },
      });
      for (const session of sessions) {
        await redis.del(`session:me:${session.token}`).catch(() => {});
      }
    } catch (e) {
      log.warn(`Failed to clear session cache for user ${data.userId}:`, e);
    }

    return result;
  }

  async getPayment(userId: string, paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: true,
          ledger: true,
          refunds: true,
        },
      });

      if (!payment) {
        throw new PaymentNotFoundError(paymentId);
      }

      if (payment.userId !== userId) {
        throw new UnauthorizedPaymentAccessError();
      }

      return payment;
    } catch (error) {
      this.handleError(error, "Failed to get payment details");
    }
  }
}
