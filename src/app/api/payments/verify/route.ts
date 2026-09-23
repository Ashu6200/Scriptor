import { createHandler, jsonBody } from "@http/createHandler";
import { ok } from "@http/responses";
import { PaymentService, verifyPaymentSchema } from "@modules/payment";

const paymentService = new PaymentService();

export const POST = createHandler(
  { auth: true, rateLimit: { limit: 30, windowSeconds: 60, byUser: true } },
  async (ctx) => {
    const rawBody = await jsonBody(ctx.req);
    const body = verifyPaymentSchema.parse(rawBody);

    const result = await paymentService.verifyAndProcessPayment(ctx.user.id, body);

    return ok(result, "Payment verified successfully");
  }
);
