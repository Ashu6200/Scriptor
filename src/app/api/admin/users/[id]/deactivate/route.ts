import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService } from "@modules/admin";

const adminService = new AdminService();

export const POST = createHandler({ platformAdmin: true }, async ({ params, user }) => {
  const result = await adminService.deactivateUser(params.id, user.id);
  return ok(result);
});
