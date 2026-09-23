import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { BillingService } from "@modules/billing";

const billingService = new BillingService();

export const GET = createHandler({ workspace: true }, async ({ user }) =>
  ok(await billingService.getSubscriptionStatus(user.id))
);
