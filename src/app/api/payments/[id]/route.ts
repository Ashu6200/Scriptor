import { createHandler } from "@http/createHandler";
import { ok } from "@http/responses";
import { PaymentService } from "@modules/payment";

const paymentService = new PaymentService();

export const GET = createHandler<{ id: string }>({ auth: true }, async (ctx) => {
  const paymentId = ctx.params.id;
  const payment = await paymentService.getPayment(ctx.user.id, paymentId);

  return ok(payment, "Payment details retrieved successfully");
});
