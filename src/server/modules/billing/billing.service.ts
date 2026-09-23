import crypto from "node:crypto";
import { BaseService } from "@core/base.service";
import { AppError } from "@core/errors";
import { config } from "@infra/config";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { razorpay } from "@infra/razorpay";
import {
  type CancelSubscriptionInput,
  type CreateSubscriptionInput,
  type ListBillingHistoryQuery,
  type VerifyPaymentInput,
  getRazorpayPlanIds,
} from "./billing.schema";

const log = logger.child("BillingService");

interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_end?: number;
  current_start?: number;
}

interface RazorpayPaymentEntity {
  id: string;
  amount: number;
  currency: string;
  subscription_id?: string;
}

export interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: { entity: RazorpayPaymentEntity };
  };
}

export class BillingService extends BaseService {
  async getSubscriptionStatus(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionPeriodEnd: true,
          razorpayCustomerId: true,
          razorpaySubscriptionId: true,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to get subscription status");
    }
  }

  async listHistory(userId: string, query: ListBillingHistoryQuery) {
    try {
      return await this.paginate(
        prisma.billingTransaction,
        {
          page: query.page,
          limit: query.limit,
        },
        {
          where: { userId },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list billing history");
    }
  }

  async createSubscription(userId: string, input: CreateSubscriptionInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const planId = getRazorpayPlanIds()[input.plan];
      if (!planId) {
        throw new AppError(`Razorpay plan ID not configured for plan: ${input.plan}`, 500);
      }

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 12,
        quantity: 1,
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          razorpaySubscriptionId: subscription.id,
          subscriptionStatus: "INCOMPLETE",
        },
      });

      log.info(`Razorpay subscription created for user ${userId}: ${subscription.id}`);

      return {
        subscriptionId: subscription.id,
        keyId: config.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      this.handleError(error, "Failed to create subscription");
    }
  }

  async verifyPayment(userId: string, input: VerifyPaymentInput) {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = input;

      const razorpaySecret = config.RAZORPAY_KEY_SECRET;
      if (!razorpaySecret) {
        throw new AppError("Payment gateway is not configured", 503, "PAYMENT_NOT_CONFIGURED");
      }

      const expectedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        throw new AppError("Invalid payment signature", 400);
      }

      const rzpSubscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);

      const plan = Object.entries(getRazorpayPlanIds()).find(
        ([, id]) => id === rzpSubscription.plan_id
      )?.[0] as "PRO" | "MAX" | undefined;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: plan ?? "FREE",
            subscriptionStatus: "ACTIVE",
            subscriptionPeriodEnd: rzpSubscription.current_end
              ? new Date((rzpSubscription.current_end as number) * 1000)
              : null,
          },
        }),
        prisma.billingTransaction.create({
          data: {
            userId,
            amount: rzpPayment.amount as number,
            currency: rzpPayment.currency as string,
            description: `Subscription payment - ${plan ?? "UNKNOWN"}`,
            status: "paid",
            razorpayPaymentId: razorpay_payment_id,
            planSnapshot: plan,
          },
        }),
      ]);

      log.info(`Payment verified for user ${userId}: ${razorpay_payment_id}`);
      return { verified: true };
    } catch (error) {
      this.handleError(error, "Failed to verify payment");
    }
  }

  async cancelSubscription(userId: string, input: CancelSubscriptionInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { razorpaySubscriptionId: true },
      });

      if (!user?.razorpaySubscriptionId) {
        throw new AppError("No active subscription found", 404);
      }

      await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, input.cancelAtPeriodEnd);

      if (!input.cancelAtPeriodEnd) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "CANCELED",
            subscriptionPlan: "FREE",
            razorpaySubscriptionId: null,
          },
        });
      }

      log.info(`Subscription cancellation requested for user ${userId}`);
      return { cancelled: true, cancelAtPeriodEnd: input.cancelAtPeriodEnd };
    } catch (error) {
      this.handleError(error, "Failed to cancel subscription");
    }
  }

  async handleRazorpayWebhook(event: RazorpayWebhookEvent) {
    try {
      log.info(`Processing Razorpay event: ${event.event}`);

      switch (event.event) {
        case "subscription.activated": {
          const sub = event.payload.subscription?.entity;
          if (!sub) break;
          const user = await prisma.user.findFirst({
            where: { razorpaySubscriptionId: sub.id },
          });
          if (!user) break;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
            },
          });
          break;
        }

        case "subscription.charged": {
          const payment = event.payload.payment?.entity;
          const sub = event.payload.subscription?.entity;
          if (!payment || !sub) break;
          const user = await prisma.user.findFirst({
            where: { razorpaySubscriptionId: sub.id },
          });
          if (!user) break;
          await prisma.$transaction([
            prisma.billingTransaction.create({
              data: {
                userId: user.id,
                amount: payment.amount,
                currency: payment.currency,
                description: "Recurring subscription payment",
                status: "paid",
                razorpayPaymentId: payment.id,
                planSnapshot: user.subscriptionPlan,
              },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: "ACTIVE",
                subscriptionPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
              },
            }),
          ]);
          break;
        }

        case "subscription.updated": {
          const sub = event.payload.subscription?.entity;
          if (!sub) break;
          const user = await prisma.user.findFirst({
            where: { razorpaySubscriptionId: sub.id },
          });
          if (!user) break;
          const status = sub.status === "active" ? "ACTIVE" : "PAST_DUE";
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: status,
              subscriptionPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
            },
          });
          break;
        }

        case "subscription.completed":
        case "subscription.cancelled": {
          const sub = event.payload.subscription?.entity;
          if (!sub) break;
          const user = await prisma.user.findFirst({
            where: { razorpaySubscriptionId: sub.id },
          });
          if (!user) break;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "CANCELED",
              subscriptionPlan: "FREE",
              razorpaySubscriptionId: null,
            },
          });
          break;
        }

        case "payment.failed": {
          const payment = event.payload.payment?.entity;
          if (!payment?.subscription_id) break;
          const user = await prisma.user.findFirst({
            where: { razorpaySubscriptionId: payment.subscription_id },
          });
          if (!user) break;
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "PAST_DUE" },
          });
          break;
        }

        default:
          log.debug(`Unhandled Razorpay event: ${event.event}`);
      }
    } catch (error) {
      log.error("Razorpay webhook processing error:", error);
      throw error;
    }
  }
}
