import { BaseService } from "@core/base.service";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { razorpay } from "@infra/razorpay";
import { PaymentOrderStatus, PaymentStatus } from "@prisma/client";
import type { ReconcileInput } from "./payment.schema";
import { PaymentService } from "./payment.service";

const log = logger.child("ReconciliationService");

export interface ReconciliationReport {
  scannedCount: number;
  reconciledCapturedCount: number;
  reconciledFailedCount: number;
  mismatchCount: number;
  details: Array<{
    paymentId: string;
    razorpayOrderId: string;
    actionTaken: string;
    previousStatus: string;
    newStatus: string;
  }>;
}

export class ReconciliationService extends BaseService {
  private paymentService = new PaymentService();

  async reconcileStuckPayments(input: ReconcileInput): Promise<ReconciliationReport> {
    try {
      const olderThanMs = (input.olderThanMinutes || 30) * 60 * 1000;
      const cutoffDate = new Date(Date.now() - olderThanMs);

      log.info(
        `Starting payment reconciliation job for payments created before ${cutoffDate.toISOString()}`
      );

      const whereCondition = input.paymentId
        ? { id: input.paymentId }
        : {
            status: { in: [PaymentStatus.CREATED, PaymentStatus.AUTHORIZED] },
            createdAt: { lte: cutoffDate },
          };

      const stuckPayments = await prisma.payment.findMany({
        where: whereCondition,
        take: input.limit || 50,
        include: { order: true },
      });

      log.info(`Found ${stuckPayments.length} payments requiring reconciliation check`);

      const report: ReconciliationReport = {
        scannedCount: stuckPayments.length,
        reconciledCapturedCount: 0,
        reconciledFailedCount: 0,
        mismatchCount: 0,
        details: [],
      };

      for (const payment of stuckPayments) {
        try {
          const rzpPayments = await razorpay.orders.fetchPayments(payment.razorpayOrderId);
          const attempts =
            (
              rzpPayments as unknown as {
                items: Array<{ id: string; status: string; amount: number; method: string }>;
              }
            ).items || [];

          if (!attempts || attempts.length === 0) {
            log.info(
              `Reconciliation: No Razorpay payment attempt found for order ${payment.razorpayOrderId}`
            );
            continue;
          }

          const capturedAttempt = attempts.find((a) => a.status === "captured");

          if (capturedAttempt) {
            log.warn(
              `Reconciliation Mismatch Detected! Payment ${payment.id} is ${payment.status} locally but CAPTURED on Razorpay (${capturedAttempt.id})`
            );

            await this.paymentService.executePaymentCaptureTransaction({
              paymentId: payment.id,
              orderId: payment.orderId,
              userId: payment.userId,
              razorpayPaymentId: capturedAttempt.id,
              amount: payment.amount,
              currency: payment.currency,
              method: capturedAttempt.method || "unknown",
              capturedAt: new Date(),
            });

            report.reconciledCapturedCount++;
            report.mismatchCount++;
            report.details.push({
              paymentId: payment.id,
              razorpayOrderId: payment.razorpayOrderId,
              actionTaken: "RECONCILED_TO_CAPTURED",
              previousStatus: payment.status,
              newStatus: PaymentStatus.CAPTURED,
            });

            continue;
          }

          const allFailed = attempts.every((a) => a.status === "failed");
          if (allFailed && attempts.length > 0) {
            await prisma.$transaction([
              prisma.payment.update({
                where: { id: payment.id },
                data: {
                  status: PaymentStatus.FAILED,
                  failureReason: "Reconciliation: All Razorpay payment attempts failed",
                },
              }),
              prisma.paymentOrder.update({
                where: { id: payment.orderId },
                data: { status: PaymentOrderStatus.FAILED },
              }),
            ]);

            report.reconciledFailedCount++;
            report.details.push({
              paymentId: payment.id,
              razorpayOrderId: payment.razorpayOrderId,
              actionTaken: "RECONCILED_TO_FAILED",
              previousStatus: payment.status,
              newStatus: PaymentStatus.FAILED,
            });
          }
        } catch (itemErr) {
          log.error(`Reconciliation error for payment ${payment.id}:`, itemErr);
        }
      }

      log.info(
        `Reconciliation completed: scanned=${report.scannedCount}, captured=${report.reconciledCapturedCount}, failed=${report.reconciledFailedCount}`
      );

      return report;
    } catch (error) {
      this.handleError(error, "Reconciliation process failed");
    }
  }
}
