import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { AuditService, listAuditLogsSchema } from "@modules/audit";

const auditService = new AuditService();

export const GET = createHandler(
  { workspace: true, requireEntitlement: "hasAuditLogs" },
  async ({ workspaceId, query }) => {
    const parsed = listAuditLogsSchema.parse(query);
    const result = await auditService.listLogs(workspaceId, parsed);
    return paginated(result!);
  }
);
