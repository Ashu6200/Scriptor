import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService, grantConsentSchema } from "@modules/dpdp";

export const GET = createHandler({ auth: true }, async ({ user }) => {
  const result = await dpdpService.getUserCurrentConsents(user.id);
  return ok(result);
});

export const POST = createHandler(
  {
    auth: true,
    rateLimit: { limit: 30, windowSeconds: 60, byUser: true, keyPrefix: "dpdp:consent" },
  },
  async ({ req, user }) => {
    const body = await jsonBody(req);
    const parsed = grantConsentSchema.parse(body);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const result = await dpdpService.grantOrRejectConsent(user.id, parsed, { ipAddress: ip, userAgent });
    return ok(result, "Consent recorded successfully", 201);
  }
);
