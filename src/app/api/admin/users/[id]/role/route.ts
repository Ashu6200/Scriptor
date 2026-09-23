import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService, toggleRoleSchema } from "@modules/admin";

const adminService = new AdminService();

export const PATCH = createHandler({ platformAdmin: true }, async ({ req, params, user }) => {
  const { role } = toggleRoleSchema.parse(await jsonBody(req));
  const result = await adminService.togglePlatformRole(params.id, role, user.id);
  return ok(result);
});
