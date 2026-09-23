import crypto from "node:crypto";
import { BaseService } from "@core/base.service";
import { AppError, InvalidWebhookSignatureError } from "@core/errors";
import { config } from "@infra/config";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { PaymentStatus } from "@prisma/client";
import { PaymentService } from "./payment.service";
import { RefundService } from "./refund.service";

const log = logger.child("WebhookService");

export interface RazorpayEntityPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  error_code?: string;
  error_description?: string;
  created_at?: number;
}

export interface RazorpayEntityRefund {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id?: string;
  event: string;
  contains?: string[];
  payload: {
    payment?: { entity: RazorpayEntityPayment };
    refund?: { entity: RazorpayEntityRefund };
    order?: { entity: { id: string; amount: number; status: string } };
  };
  created_at: number;
}

export class WebhookService extends BaseService {
  private paymentService = new PaymentService();
  private refundService = new RefundService();

  public verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = config.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new AppError(
        "Razorpay webhook secret is not configured",
        500,
        "WEBHOOK_NOT_CONFIGURED"
      );
    }

    const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const a = Buffer.from(expectedSignature, "utf8");
    const b = Buffer.from(signature, "utf8");

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  async handleWebhook(rawBody: Buffer, signature: string, eventIdHeader?: string) {
    try {
      if (!this.verifyWebhookSignature(rawBody, signature)) {
        log.warn("Rejected Razorpay webhook with invalid signature");
        throw new InvalidWebhookSignatureError();
      }

      const payloadString = rawBody.toString("utf8");
      const eventData = JSON.parse(payloadString) as RazorpayWebhookPayload;

      const payloadHash = crypto.createHash("sha256").update(payloadString).digest("hex");
      const eventId = eventIdHeader || `evt_${payloadHash.substring(0, 32)}`;
      const eventType = eventData.event;

      log.info(`Received Razorpay webhook event: ${eventType} (ID: ${eventId})`);

      let webhookRecord: { id: string };
      try {
        webhookRecord = await prisma.razorpayWebhookEvent.create({
          data: {
            eventId,
            eventType,
            payloadHash,
            payload: eventData as unknown as object,
            processed: false,
          },
          select: { id: true },
        });
      } catch (createErr) {
        const existing = await prisma.razorpayWebhookEvent.findUnique({
          where: { eventId },
          select: { processed: true },
        });
        if (existing?.processed) {
          log.info(`Webhook event ${eventId} already processed. Skipping idempotently.`);
          return { processed: true, duplicate: true };
        }
        log.info(`Webhook event ${eventId} already claimed by another request. Skipping.`);
        return { processed: true, duplicate: true };
      }

      try {
        await this.processEvent(eventData);

        await prisma.razorpayWebhookEvent.update({
          where: { id: webhookRecord.id },
          data: {
            processed: true,
            processedAt: new Date(),
            processingError: null,
          },
        });

        log.info(`Successfully processed webhook event ${eventId}`);
        return { processed: true, duplicate: false };
      } catch (procErr) {
        const errorMsg = procErr instanceof Error ? procErr.message : String(procErr);
        log.error(`Failed to process webhook event ${eventId}:`, procErr);

        await prisma.razorpayWebhookEvent.update({
          where: { id: webhookRecord.id },
          data: {
            processed: false,
            processingError: errorMsg,
          },
        });

        throw procErr;
      }
    } catch (error) {
      this.handleError(error, "Webhook handling failed");
    }
  }

  private async processEvent(eventData: RazorpayWebhookPayload): Promise<void> {
    const { event, payload } = eventData;

    switch (event) {
      case "payment.captured":
      case "payment.authorized": {
        const p = payload.payment?.entity;
        if (!p) break;

        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: p.order_id },
        });

        if (!payment) {
          log.warn(`Webhook received for unknown razorpay_order_id: ${p.order_id}`);
          break;
        }

        await this.paymentService.executePaymentCaptureTransaction({
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          razorpayPaymentId: p.id,
          amount: payment.amount,
          currency: payment.currency,
          method: p.method || "unknown",
          capturedAt: new Date(),
        });
        break;
      }

      case "payment.failed": {
        const p = payload.payment?.entity;
        if (!p) break;

        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: p.order_id },
        });

        if (!payment) break;

        if (payment.status !== PaymentStatus.CAPTURED) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.FAILED,
                razorpayPaymentId: p.id,
                failureCode: p.error_code || "PAYMENT_FAILED",
                failureReason: p.error_description || "Payment failed at Razorpay",
              },
            }),
            prisma.paymentOrder.update({
              where: { id: payment.orderId },
              data: { status: "FAILED" },
            }),
          ]);
        }
        break;
      }

      case "refund.processed": {
        const ref = payload.refund?.entity;
        if (!ref) break;
        await this.refundService.processRefundWebhookSuccess(ref.id, ref.payment_id, ref.amount);
        break;
      }

      case "refund.failed": {
        const ref = payload.refund?.entity;
        if (!ref) break;
        await this.refundService.processRefundWebhookFailure(ref.id, "Refund failed at Razorpay");
        break;
      }

      default:
        log.info(`Ignoring unhandled Razorpay webhook event: ${event}`);
    }
  }
}
