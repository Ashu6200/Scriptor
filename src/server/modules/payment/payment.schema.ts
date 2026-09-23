import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  currency: z.string().default("INR"),
  description: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required"),
});

export const createRefundSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  amount: z.number().int().positive("Refund amount must be a positive integer in paise"),
  reason: z.string().optional(),
});

export const reconcileSchema = z.object({
  paymentId: z.string().optional(),
  olderThanMinutes: z.number().int().positive().default(30),
  limit: z.number().int().positive().default(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type ReconcileInput = z.infer<typeof reconcileSchema>;
