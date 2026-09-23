import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { dpdpService, listAdminConsentsSchema } from "@modules/dpdp";

export const GET = createHandler({ platformAdmin: true }, async ({ query }) => {
  const parsed = listAdminConsentsSchema.parse(query);
  const result = await dpdpService.searchAdminConsents(parsed);
  return paginated(result);
});
