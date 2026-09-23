import { config } from "@infra/config";
import { z } from "zod";

export const listBillingHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListBillingHistoryQuery = z.infer<typeof listBillingHistorySchema>;

export const createSubscriptionSchema = z.object({
  plan: z.enum(["PRO", "MAX"]),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
});

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export function getRazorpayPlanIds(): Record<"PRO" | "MAX", string> {
  return {
    PRO: config.RAZORPAY_PLAN_ID_PRO ?? "",
    MAX: config.RAZORPAY_PLAN_ID_MAX ?? "",
  };
}
