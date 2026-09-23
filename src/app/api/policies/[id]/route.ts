import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService, updatePolicySchema } from "@modules/dpdp";

export const GET = createHandler(
  { platformAdmin: true },
  async ({ params }) => {
    const result = await dpdpService.getPolicy(params.id);
    return ok(result);
  }
);

export const PATCH = createHandler(
  { platformAdmin: true },
  async ({ req, params, user }) => {
    const body = await jsonBody(req);
    const parsed = updatePolicySchema.parse(body);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await dpdpService.updatePolicy(params.id, parsed, user.id, ip);
    return ok(result, "Policy updated successfully");
  }
);

export const DELETE = createHandler(
  { platformAdmin: true },
  async ({ req, params, user }) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await dpdpService.deletePolicy(params.id, user.id, ip);
    return ok(result, "Policy deleted successfully");
  }
);
