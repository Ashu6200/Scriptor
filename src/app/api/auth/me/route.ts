import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { AuthService } from "@modules/auth";

const authService = new AuthService();

export const GET = createHandler({ auth: true }, async ({ user }) => {
  const info = await authService.getSessionInfo(user.id);
  return ok(info);
});
