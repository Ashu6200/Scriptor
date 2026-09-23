import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { prisma } from "@infra/db";
import { redis } from "@infra/redis";
import { headers } from "next/headers";
import { z } from "zod";

export const GET = createHandler({ auth: true }, async ({ user }) => {
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      token: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
      expiresAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get current session token from cookie to mark it
  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  const match = cookieHeader.match(/scriptor_cookies=([^;]+)/);
  const currentToken = match ? decodeURIComponent(match[1]) : null;

  return ok(sessions.map((s) => ({ ...s, isCurrent: s.token === currentToken })));
});

const revokeSchema = z.object({ token: z.string() });

export const DELETE = createHandler({ auth: true }, async ({ req, user }) => {
  const { token } = revokeSchema.parse(await jsonBody(req));

  await prisma.session.deleteMany({ where: { token, userId: user.id } });
  await redis.del(`ba:${token}`).catch(() => {});
  await redis.del(`session:me:${token}`).catch(() => {});

  return ok({ revoked: true });
});
