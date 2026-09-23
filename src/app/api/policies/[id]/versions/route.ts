import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { createPolicyVersionSchema, dpdpService } from "@modules/dpdp";

export const GET = createHandler(
  { platformAdmin: true },
  async ({ params }) => {
    const result = await dpdpService.getPolicyVersions(params.id);
    return ok(result);
  }
);

export const POST = createHandler(
  {
    platformAdmin: true,
    rateLimit: { limit: 10, windowSeconds: 60, byUser: true, keyPrefix: "dpdp:create-version" },
  },
  async ({ req, params, user }) => {
    const body = await jsonBody(req);
    const parsed = createPolicyVersionSchema.parse(body);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await dpdpService.createVersion(params.id, parsed, user.id, ip);
    return ok(result, "Policy version created successfully", 201);
  }
);
