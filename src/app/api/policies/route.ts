import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok, paginated } from "@/server/http/responses";
import { createPolicySchema, dpdpService, listPoliciesSchema } from "@modules/dpdp";

export const GET = createHandler({ platformAdmin: true }, async ({ query }) => {
  const parsed = listPoliciesSchema.parse(query);
  const result = await dpdpService.listPolicies(parsed);
  return paginated(result);
});

export const POST = createHandler(
  {
    platformAdmin: true,
    rateLimit: { limit: 20, windowSeconds: 60, byUser: true, keyPrefix: "dpdp:create-policy" },
  },
  async ({ req, user }) => {
    const body = await jsonBody(req);
    const parsed = createPolicySchema.parse(body);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await dpdpService.createPolicy(parsed, user.id, ip);
    return ok(result, "Policy created successfully", 201);
  }
);
