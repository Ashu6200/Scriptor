import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { UserService, updateUserSchema } from "@modules/user";

const userService = new UserService();

export const GET = createHandler({ auth: true }, async ({ user }) => {
  const profile = await userService.getProfile(user.id);
  return ok(profile);
});

export const PUT = createHandler({ auth: true }, async ({ req, user }) => {
  const data = updateUserSchema.parse(await jsonBody(req));
  const profile = await userService.updateProfile(user.id, data);
  return ok(profile);
});
