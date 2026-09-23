import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService, analyticsSchema } from "@modules/admin";

const adminService = new AdminService();

export const GET = createHandler({ platformAdmin: true }, async (ctx) => {
  const parsed = analyticsSchema.parse(ctx.query);
  const data = await adminService.getAnalytics(new Date(parsed.from), new Date(parsed.to));
  return ok(data);
});
