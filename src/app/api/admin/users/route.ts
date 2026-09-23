import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { AdminService, listUsersSchema } from "@modules/admin";

const adminService = new AdminService();

export const GET = createHandler({ platformAdmin: true }, async ({ query }) => {
  const parsed = listUsersSchema.parse(query);
  const result = await adminService.listUsers(parsed);
  return paginated(result);
});
