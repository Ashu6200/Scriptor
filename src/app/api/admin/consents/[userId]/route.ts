import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService } from "@modules/dpdp";

export const GET = createHandler(
  { platformAdmin: true },
  async ({ params }) => {
    const result = await dpdpService.getAdminConsentsByUser(params.userId);
    return ok(result);
  }
);
