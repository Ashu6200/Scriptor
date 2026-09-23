import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService } from "@modules/admin";

const adminService = new AdminService();

export const POST = createHandler({ platformAdmin: true }, async ({ params }) => {
  const result = await adminService.reactivateUser(params.id);
  return ok(result);
});
