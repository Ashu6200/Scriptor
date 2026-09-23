import { createHandler, jsonBody } from "@http/createHandler";
import { ok } from "@http/responses";
import { RefundService, createRefundSchema } from "@modules/payment";

const refundService = new RefundService();

export const POST = createHandler<{ id: string }>(
  { auth: true, rateLimit: { limit: 10, windowSeconds: 60, byUser: true } },
  async (ctx) => {
    const rawBody = await jsonBody(ctx.req);
    const parsed = createRefundSchema.parse({
      ...(typeof rawBody === "object" && rawBody !== null ? rawBody : {}),
      paymentId: ctx.params.id,
    });

    const idempotencyKey =
      ctx.req.headers.get("idempotency-key") || ctx.req.headers.get("x-idempotency-key");
    const isAdmin = ctx.user.platformRole === "ADMIN";

    const result = await refundService.requestRefund(
      ctx.user.id,
      parsed,
      idempotencyKey || undefined,
      isAdmin
    );

    return ok(result, "Refund requested successfully", 200);
  }
);
