import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { auditService } from "@modules/audit";

export const GET = createHandler(
  { workspace: true, requireEntitlement: "hasAuditLogs" },
  async ({ workspaceId }) => {
    const result = await auditService.verifyChain(workspaceId);
    return ok(result);
  }
);
