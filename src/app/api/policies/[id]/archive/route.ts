import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService } from "@modules/dpdp";

export const POST = createHandler(
  { platformAdmin: true },
  async ({ req, params, user }) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await dpdpService.archivePolicy(params.id, user.id, ip);
    return ok(result, "Policy archived successfully");
  }
);
