import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { DashboardService } from "@modules/dashboard";

const dashboardService = new DashboardService();

export const GET = createHandler({ auth: true }, async ({ user }) => {
  const stats = await dashboardService.getDashboardStats(user.id);
  return ok(stats);
});
