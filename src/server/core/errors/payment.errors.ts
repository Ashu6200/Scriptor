import { AppError } from "./app.error";

export class PaymentNotFoundError extends AppError {
  constructor(identifier?: string) {
    const msg = identifier ? `Payment '${identifier}' not found` : "Payment not found";
    super(msg, 404, "PAYMENT_NOT_FOUND");
  }
}

export class OrderNotFoundError extends AppError {
  constructor(identifier?: string) {
    const msg = identifier ? `Order '${identifier}' not found` : "Order not found";
    super(msg, 404, "ORDER_NOT_FOUND");
  }
}

export class InvalidPaymentStateError extends AppError {
  constructor(currentState: string, attemptedState: string, details?: string) {
    const msg = `Invalid payment state transition from ${currentState} to ${attemptedState}${
      details ? `: ${details}` : ""
    }`;
    super(msg, 400, "INVALID_PAYMENT_STATE_TRANSITION");
  }
}

export class InvalidWebhookSignatureError extends AppError {
  constructor(message = "Invalid Razorpay webhook signature") {
    super(message, 401, "INVALID_WEBHOOK_SIGNATURE");
  }
}

export class DuplicateWebhookError extends AppError {
  constructor(eventId: string) {
    super(`Webhook event '${eventId}' has already been processed`, 200, "DUPLICATE_WEBHOOK_EVENT");
  }
}

export class AmountMismatchError extends AppError {
  constructor(expected: number, actual: number) {
    super(
      `Amount mismatch: expected ${expected} paise, got ${actual} paise`,
      400,
      "PAYMENT_AMOUNT_MISMATCH"
    );
  }
}

export class UnauthorizedPaymentAccessError extends AppError {
  constructor(message = "You are not authorized to access this payment resource") {
    super(message, 403, "UNAUTHORIZED_PAYMENT_ACCESS");
  }
}

export class RefundExceedsPaymentError extends AppError {
  constructor(requested: number, available: number) {
    super(
      `Refund amount (${requested} paise) exceeds available captured amount (${available} paise)`,
      400,
      "REFUND_EXCEEDS_PAYMENT"
    );
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(key: string) {
    super(
      `A concurrent or prior request with idempotency key '${key}' is in progress`,
      409,
      "IDEMPOTENCY_CONFLICT"
    );
  }
}
