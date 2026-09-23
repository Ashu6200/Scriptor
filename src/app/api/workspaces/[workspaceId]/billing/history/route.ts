import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { BillingService, listBillingHistorySchema } from "@modules/billing";

const billingService = new BillingService();

export const GET = createHandler({ workspace: true }, async ({ user, query }) => {
  const parsed = listBillingHistorySchema.parse(query);
  const result = await billingService.listHistory(user.id, parsed);
  return paginated(result!);
});
