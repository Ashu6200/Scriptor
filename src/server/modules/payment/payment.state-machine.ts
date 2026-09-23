import { InvalidPaymentStateError } from "@core/errors";
import { PaymentOrderStatus, PaymentStatus, RefundStatus } from "@prisma/client";

const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, Set<PaymentStatus>> = {
  CREATED: new Set([
    PaymentStatus.AUTHORIZED,
    PaymentStatus.CAPTURED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ]),
  AUTHORIZED: new Set([PaymentStatus.CAPTURED, PaymentStatus.FAILED, PaymentStatus.CANCELLED]),
  CAPTURED: new Set([
    PaymentStatus.REFUND_PENDING,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ]),
  REFUND_PENDING: new Set([
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
    PaymentStatus.CAPTURED,
  ]),
  PARTIALLY_REFUNDED: new Set([
    PaymentStatus.REFUND_PENDING,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ]),
  REFUNDED: new Set(),
  FAILED: new Set(),
  CANCELLED: new Set(),
};

const VALID_ORDER_TRANSITIONS: Record<PaymentOrderStatus, Set<PaymentOrderStatus>> = {
  PENDING: new Set([
    PaymentOrderStatus.PAID,
    PaymentOrderStatus.FAILED,
    PaymentOrderStatus.CANCELLED,
  ]),
  PAID: new Set([PaymentOrderStatus.PARTIALLY_REFUNDED, PaymentOrderStatus.REFUNDED]),
  PARTIALLY_REFUNDED: new Set([PaymentOrderStatus.PARTIALLY_REFUNDED, PaymentOrderStatus.REFUNDED]),
  REFUNDED: new Set(),
  FAILED: new Set(),
  CANCELLED: new Set(),
};

const VALID_REFUND_TRANSITIONS: Record<RefundStatus, Set<RefundStatus>> = {
  REQUESTED: new Set([RefundStatus.PROCESSING, RefundStatus.PROCESSED, RefundStatus.FAILED]),
  PROCESSING: new Set([RefundStatus.PROCESSED, RefundStatus.FAILED]),
  PROCESSED: new Set(),
  FAILED: new Set(),
};

export function isValidPaymentTransition(current: PaymentStatus, next: PaymentStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_PAYMENT_TRANSITIONS[current];
  return allowed ? allowed.has(next) : false;
}

export function assertPaymentTransition(current: PaymentStatus, next: PaymentStatus): void {
  if (!isValidPaymentTransition(current, next)) {
    throw new InvalidPaymentStateError(
      current,
      next,
      `Cannot transition payment from ${current} to ${next}`
    );
  }
}

export function isValidOrderTransition(
  current: PaymentOrderStatus,
  next: PaymentOrderStatus
): boolean {
  if (current === next) return true;
  const allowed = VALID_ORDER_TRANSITIONS[current];
  return allowed ? allowed.has(next) : false;
}

export function assertOrderTransition(current: PaymentOrderStatus, next: PaymentOrderStatus): void {
  if (!isValidOrderTransition(current, next)) {
    throw new InvalidPaymentStateError(
      current,
      next,
      `Cannot transition order from ${current} to ${next}`
    );
  }
}

export function isValidRefundTransition(current: RefundStatus, next: RefundStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_REFUND_TRANSITIONS[current];
  return allowed ? allowed.has(next) : false;
}

export function assertRefundTransition(current: RefundStatus, next: RefundStatus): void {
  if (!isValidRefundTransition(current, next)) {
    throw new InvalidPaymentStateError(
      current,
      next,
      `Cannot transition refund from ${current} to ${next}`
    );
  }
}

export const PaymentStateMachine = {
  isValidPaymentTransition,
  assertPaymentTransition,
  isValidOrderTransition,
  assertOrderTransition,
  isValidRefundTransition,
  assertRefundTransition,
};
