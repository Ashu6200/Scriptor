import { createHandler, jsonBody } from "@http/createHandler";
import { ok } from "@http/responses";
import { IdempotencyService, PaymentOrderService, createOrderSchema } from "@modules/payment";

const paymentOrderService = new PaymentOrderService();
const idempotencyService = new IdempotencyService();

export const POST = createHandler(
  { auth: true, rateLimit: { limit: 20, windowSeconds: 60, byUser: true } },
  async (ctx) => {
    const rawBody = await jsonBody(ctx.req);
    const body = createOrderSchema.parse(rawBody);

    const idempotencyKey =
      ctx.req.headers.get("idempotency-key") || ctx.req.headers.get("x-idempotency-key");

    if (idempotencyKey) {
      const check = await idempotencyService.checkKey(
        idempotencyKey,
        ctx.req.nextUrl.pathname,
        body
      );
      if (check.isDuplicate && check.cachedResponse) {
        return ok(check.cachedResponse.body, check.cachedResponse.statusCode);
      }
    }

    const result = await paymentOrderService.createPaymentOrder(
      ctx.user.id,
      body,
      idempotencyKey || undefined
    );

    if (idempotencyKey && result) {
      await idempotencyService.saveResponse(
        idempotencyKey,
        ctx.req.nextUrl.pathname,
        body,
        201,
        result
      );
    }

    return ok(result, "Payment order created successfully", 201);
  }
);
