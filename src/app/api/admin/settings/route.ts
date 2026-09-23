import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AdminService, updateSettingSchema } from "@modules/admin";

const adminService = new AdminService();

export const GET = createHandler({ platformAdmin: true }, async () => {
  const settings = await adminService.getAllSettings();
  return ok(settings);
});

export const PATCH = createHandler({ platformAdmin: true }, async ({ req }) => {
  const { key, value } = updateSettingSchema.parse(await jsonBody(req));
  const result = await adminService.setSetting(key, value);
  return ok(result);
});
