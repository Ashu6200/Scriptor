import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { dpdpService, listDpdpAuditLogsSchema } from "@modules/dpdp";

export const GET = createHandler({ platformAdmin: true }, async ({ query }) => {
  const parsed = listDpdpAuditLogsSchema.parse(query);
  const result = await dpdpService.listDpdpAuditLogs(parsed);
  return paginated(result);
});
