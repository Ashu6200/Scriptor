import { BaseService } from "@core/base.service";
import {
  AppError,
  PaymentNotFoundError,
  RefundExceedsPaymentError,
  UnauthorizedPaymentAccessError,
} from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { razorpay } from "@infra/razorpay";
import { redis } from "@infra/redis";
import {
  LedgerTransactionStatus,
  LedgerTransactionType,
  PaymentOrderStatus,
  PaymentStatus,
  RefundStatus,
} from "@prisma/client";
import type { CreateRefundInput } from "./payment.schema";
import { PaymentStateMachine } from "./payment.state-machine";

const log = logger.child("RefundService");

export class RefundService extends BaseService {
  async requestRefund(
    userId: string,
    input: CreateRefundInput,
    idempotencyKey?: string,
    isAdmin = false
  ) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: {
          order: true,
          refunds: true,
        },
      });

      if (!payment) {
        throw new PaymentNotFoundError(input.paymentId);
      }

      if (payment.userId !== userId && !isAdmin) {
        throw new UnauthorizedPaymentAccessError(
          "You can only request refunds for your own payments"
        );
      }

      if (
        payment.status !== PaymentStatus.CAPTURED &&
        payment.status !== PaymentStatus.PARTIALLY_REFUNDED
      ) {
        throw new AppError(
          `Refunds can only be requested for CAPTURED or PARTIALLY_REFUNDED payments. Current status: ${payment.status}`,
          400,
          "INVALID_REFUND_STATE"
        );
      }

      if (!payment.razorpayPaymentId) {
        throw new AppError("Razorpay Payment ID is missing for this transaction", 400);
      }

      const processedRefunds = payment.refunds.filter(
        (r) =>
          r.status === RefundStatus.PROCESSED ||
          r.status === RefundStatus.PROCESSING ||
          r.status === RefundStatus.REQUESTED
      );
      const totalAlreadyRefunded = processedRefunds.reduce((sum, r) => sum + r.amount, 0);
      const remainingAvailable = payment.amount - totalAlreadyRefunded;

      if (input.amount > remainingAvailable) {
        log.warn(
          `Refund attempt exceeded limit: requested=${input.amount}, totalRefunded=${totalAlreadyRefunded}, captured=${payment.amount}`
        );
        throw new RefundExceedsPaymentError(input.amount, remainingAvailable);
      }

      const refundRecord = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: input.amount,
          currency: payment.currency,
          reason: input.reason || "Customer requested refund",
          status: RefundStatus.REQUESTED,
          idempotencyKey: idempotencyKey || null,
        },
      });

      log.info(
        `Calling Razorpay refund API for payment ${payment.razorpayPaymentId}, amount ${input.amount} paise`
      );

      let rzpRefund: { id: string; status?: string };
      try {
        rzpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: input.amount,
          notes: {
            refundId: refundRecord.id,
            reason: input.reason || "Customer refund",
          },
        });
      } catch (rzpErr) {
        log.error("Razorpay refund API error:", rzpErr);
        await prisma.refund.update({
          where: { id: refundRecord.id },
          data: {
            status: RefundStatus.FAILED,
            failureReason: rzpErr instanceof Error ? rzpErr.message : "Razorpay API refund failure",
          },
        });
        throw new AppError("Razorpay refund processing failed", 502, "RAZORPAY_REFUND_FAILED");
      }

      const isFullRefund = totalAlreadyRefunded + input.amount === payment.amount;
      const targetPaymentStatus = isFullRefund
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED;
      const targetOrderStatus = isFullRefund
        ? PaymentOrderStatus.REFUNDED
        : PaymentOrderStatus.PARTIALLY_REFUNDED;

      const [updatedRefund] = await prisma.$transaction(async (tx) => {
        const ref = await tx.refund.update({
          where: { id: refundRecord.id },
          data: {
            razorpayRefundId: rzpRefund.id,
            status: RefundStatus.PROCESSED,
          },
        });

        PaymentStateMachine.assertPaymentTransition(payment.status, targetPaymentStatus);
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: targetPaymentStatus },
        });

        await tx.paymentOrder.update({
          where: { id: payment.orderId },
          data: { status: targetOrderStatus },
        });

        if (isFullRefund) {
          const orderMetadata = payment.order.metadata as {
            items?: Array<{ productId: string }>;
          } | null;
          const items = orderMetadata?.items || [];
          const hasPlan = items.some(
            (it) => it.productId.startsWith("pro-plan") || it.productId.startsWith("max-plan")
          );

          if (hasPlan) {
            await tx.user.update({
              where: { id: payment.userId },
              data: {
                subscriptionPlan: "FREE",
                subscriptionStatus: "CANCELED",
              },
            });
            log.info(
              `Revoked subscription to FREE for user ${payment.userId} following full refund`
            );
          }
        }

        try {
          await tx.ledgerEntry.create({
            data: {
              userId: payment.userId,
              orderId: payment.orderId,
              paymentId: payment.id,
              razorpayPaymentId: rzpRefund.id,
              type: LedgerTransactionType.REFUND,
              amount: input.amount,
              currency: payment.currency,
              status: LedgerTransactionStatus.SUCCESS,
              metadata: {
                refundId: ref.id,
                reason: input.reason,
              },
            },
          });
        } catch (err) {
          log.warn(`Ledger entry for refund ${rzpRefund.id} already exists:`, err);
        }

        return [ref];
      });

      if (isFullRefund) {
        try {
          const sessions = await prisma.session.findMany({
            where: { userId: payment.userId },
            select: { token: true },
          });
          for (const session of sessions) {
            await redis.del(`session:me:${session.token}`).catch(() => {});
          }
        } catch (e) {
          log.warn(`Failed to clear session cache on refund for user ${payment.userId}:`, e);
        }
      }

      log.info(
        `Refund ${updatedRefund.id} processed successfully for amount ${input.amount} paise`
      );

      return {
        success: true,
        refundId: updatedRefund.id,
        razorpayRefundId: updatedRefund.razorpayRefundId,
        amount: updatedRefund.amount,
        status: updatedRefund.status,
      };
    } catch (error) {
      this.handleError(error, "Failed to request refund");
    }
  }

  async processRefundWebhookSuccess(
    razorpayRefundId: string,
    razorpayPaymentId: string,
    amount: number
  ) {
    try {
      const refund = await prisma.refund.findFirst({
        where: {
          OR: [{ razorpayRefundId }, { payment: { razorpayPaymentId } }],
        },
        include: { payment: true },
      });

      if (!refund) {
        log.warn(`Refund webhook received for unknown refund ID: ${razorpayRefundId}`);
        return;
      }

      if (refund.status === RefundStatus.PROCESSED) {
        return;
      }

      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          razorpayRefundId,
          status: RefundStatus.PROCESSED,
        },
      });

      log.info(`Refund webhook marked PROCESSED for refund ${refund.id}`);
    } catch (error) {
      log.error(`Failed to process refund webhook success for ${razorpayRefundId}:`, error);
    }
  }

  async processRefundWebhookFailure(razorpayRefundId: string, reason: string) {
    try {
      const refund = await prisma.refund.findUnique({
        where: { razorpayRefundId },
      });

      if (!refund) return;

      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.FAILED,
          failureReason: reason,
        },
      });

      log.info(`Refund webhook marked FAILED for refund ${refund.id}`);
    } catch (error) {
      log.error(`Failed to process refund webhook failure for ${razorpayRefundId}:`, error);
    }
  }
}
