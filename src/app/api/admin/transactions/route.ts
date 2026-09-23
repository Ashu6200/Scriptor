import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService, listTransactionsSchema } from "@modules/admin";

const adminService = new AdminService();

export const GET = createHandler({ platformAdmin: true }, async (ctx) => {
  const parsed = listTransactionsSchema.parse(ctx.query);
  const data = await adminService.listTransactions(parsed);
  return ok(data);
});
