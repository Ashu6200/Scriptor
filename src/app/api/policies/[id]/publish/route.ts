import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService } from "@modules/dpdp";

export const POST = createHandler(
  {
    platformAdmin: true,
    rateLimit: { limit: 10, windowSeconds: 60, byUser: true, keyPrefix: "dpdp:publish" },
  },
  async ({ req, params, user }) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await dpdpService.publishVersion(params.id, user.id, ip);
    return ok(result, "Policy published successfully");
  }
);
