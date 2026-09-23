import { BaseService } from "@core/base.service";
import { AppError } from "@core/errors";
import { config } from "@infra/config";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { razorpay } from "@infra/razorpay";
import { PaymentOrderStatus, PaymentStatus } from "@prisma/client";
import type { CreateOrderInput } from "./payment.schema";

const log = logger.child("PaymentOrderService");

export const PRODUCT_CATALOG: Record<
  string,
  { name: string; pricePaise: number; currency: string }
> = {
  "pro-plan-monthly": {
    name: "Scriptor Pro Plan (Monthly)",
    pricePaise: 49900,
    currency: "INR",
  },
  "pro-plan-yearly": {
    name: "Scriptor Pro Plan (Yearly)",
    pricePaise: 499000,
    currency: "INR",
  },
  "max-plan-monthly": {
    name: "Scriptor Max Plan (Monthly)",
    pricePaise: 99900,
    currency: "INR",
  },
  "max-plan-yearly": {
    name: "Scriptor Max Plan (Yearly)",
    pricePaise: 999000,
    currency: "INR",
  },
};

export class PaymentOrderService extends BaseService {
  private calculateOrderAmount(items: CreateOrderInput["items"]): {
    totalAmountPaise: number;
    description: string;
  } {
    let totalAmount = 0;
    const itemDescriptions: string[] = [];

    for (const item of items) {
      const product = PRODUCT_CATALOG[item.productId];
      if (!product) {
        throw new AppError(`Invalid product ID: '${item.productId}'`, 400, "INVALID_PRODUCT_ID");
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        throw new AppError(
          "Item quantity must be a whole number between 1 and 10",
          400,
          "INVALID_QUANTITY"
        );
      }
      const itemTotal = product.pricePaise * item.quantity;
      totalAmount += itemTotal;
      itemDescriptions.push(`${item.quantity}x ${product.name}`);
    }

    if (totalAmount <= 0) {
      throw new AppError("Order total must be greater than zero", 400, "INVALID_ORDER_AMOUNT");
    }

    return {
      totalAmountPaise: totalAmount,
      description: itemDescriptions.join(", "),
    };
  }

  async createPaymentOrder(userId: string, input: CreateOrderInput, idempotencyKey?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const { totalAmountPaise, description } = this.calculateOrderAmount(input.items);
      const currency = input.currency || "INR";

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      log.info(`Creating Razorpay order for user ${userId}, amount ${totalAmountPaise} paise`);
      const rzpOrder = await razorpay.orders.create({
        amount: totalAmountPaise,
        currency,
        receipt: orderNumber,
        notes: {
          userId,
          orderNumber,
          description: input.description || description,
        },
      });

      if (!rzpOrder || !rzpOrder.id) {
        throw new AppError("Failed to create order with Razorpay", 500, "RAZORPAY_API_ERROR");
      }

      const [order, payment] = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.paymentOrder.create({
          data: {
            orderNumber,
            userId,
            amount: totalAmountPaise,
            currency,
            status: PaymentOrderStatus.PENDING,
            description: input.description || description,
            metadata: {
              items: input.items,
              razorpayOrderId: rzpOrder.id,
            },
          },
        });

        const createdPayment = await tx.payment.create({
          data: {
            userId,
            orderId: createdOrder.id,
            razorpayOrderId: rzpOrder.id,
            amount: totalAmountPaise,
            currency,
            status: PaymentStatus.CREATED,
            idempotencyKey: idempotencyKey || null,
            metadata: {
              orderNumber,
            },
          },
        });

        return [createdOrder, createdPayment];
      });

      log.info(
        `Created PaymentOrder ${order.id} and Payment ${payment.id} for Razorpay order ${rzpOrder.id}`
      );

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        razorpayOrderId: rzpOrder.id,
        amount: totalAmountPaise,
        currency,
        keyId: config.RAZORPAY_KEY_ID || "",
      };
    } catch (error) {
      this.handleError(error, "Failed to create payment order");
    }
  }

  async getOrder(userId: string, orderId: string) {
    try {
      const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          ledger: true,
          refunds: true,
        },
      });

      if (!order) {
        throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      if (order.userId !== userId) {
        throw new AppError("You are not authorized to view this order", 403, "FORBIDDEN");
      }

      return order;
    } catch (error) {
      this.handleError(error, "Failed to fetch order details");
    }
  }
}
