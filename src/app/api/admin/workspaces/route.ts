import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { AdminService, listWorkspacesSchema } from "@modules/admin";

const adminService = new AdminService();

export const GET = createHandler({ platformAdmin: true }, async ({ query }) => {
  const parsed = listWorkspacesSchema.parse(query);
  const result = await adminService.listAllWorkspaces(parsed);
  return paginated(result);
});
