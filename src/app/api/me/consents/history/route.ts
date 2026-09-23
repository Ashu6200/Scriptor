import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { dpdpService, listUserConsentHistorySchema } from "@modules/dpdp";

export const GET = createHandler({ auth: true }, async ({ query, user }) => {
  const parsed = listUserConsentHistorySchema.parse(query);
  const result = await dpdpService.getUserConsentHistory(user.id, parsed);
  return paginated(result);
});
