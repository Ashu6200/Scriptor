import { createHandler, jsonBody } from "@http/createHandler";
import { ok } from "@http/responses";
import { ReconciliationService, reconcileSchema } from "@modules/payment";

const reconciliationService = new ReconciliationService();

export const POST = createHandler({ platformAdmin: true }, async (ctx) => {
  let input = {};
  if (ctx.req.headers.get("content-length") !== "0") {
    try {
      input = (await jsonBody(ctx.req)) as Record<string, unknown>;
    } catch {
      input = {};
    }
  }

  const parsed = reconcileSchema.parse(input);
  const report = await reconciliationService.reconcileStuckPayments(parsed);

  return ok(report, "Payment reconciliation completed");
});
