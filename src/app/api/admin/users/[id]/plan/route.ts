import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService, overridePlanSchema } from "@modules/admin";
import type { SubscriptionPlan } from "@prisma/client";

const adminService = new AdminService();

export const PATCH = createHandler({ platformAdmin: true }, async ({ req, params }) => {
  const { plan } = overridePlanSchema.parse(await jsonBody(req));
  const result = await adminService.overridePlan(params.id, plan as SubscriptionPlan);
  return ok(result);
});
