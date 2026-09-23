import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { auth } from "@/server/infrastructure/auth";
import { headers } from "next/headers";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const POST = createHandler({ auth: true }, async ({ req }) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(await jsonBody(req));

  await auth.api.changePassword({
    headers: await headers(),
    body: { currentPassword, newPassword, revokeOtherSessions: false },
  });

  return ok({ success: true });
});
