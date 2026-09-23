import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService } from "@modules/dpdp";

export const POST = createHandler(
  {
    auth: true,
    rateLimit: { limit: 10, windowSeconds: 60, byUser: true, keyPrefix: "dpdp:withdraw" },
  },
  async ({ req, params, user }) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const result = await dpdpService.withdrawConsent(user.id, params.policyId, {
      ipAddress: ip,
      userAgent,
    });
    return ok(result, "Consent withdrawn successfully");
  }
);
