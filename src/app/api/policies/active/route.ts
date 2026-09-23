import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { dpdpService } from "@modules/dpdp";

export const GET = createHandler({ auth: true }, async () => {
  const result = await dpdpService.getActivePublishedPolicies();
  return ok(result);
});
