import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { BillingService, cancelSubscriptionSchema } from "@modules/billing";

const billingService = new BillingService();

export const POST = createHandler({ workspace: true }, async ({ req, user }) => {
  const input = cancelSubscriptionSchema.parse(await jsonBody(req));
  return ok(await billingService.cancelSubscription(user.id, input));
});
