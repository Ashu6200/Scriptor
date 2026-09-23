import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService } from "@modules/admin";

const adminService = new AdminService();

export const GET = createHandler({ platformAdmin: true }, async () => {
  const metrics = await adminService.getMetrics();
  return ok(metrics);
});
