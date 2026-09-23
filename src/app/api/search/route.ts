import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import type { Prisma } from "@prisma/client";
import { prisma } from "@infra/db";

const notDeleted: Prisma.DocumentWhereInput = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

export const GET = createHandler({ auth: true }, async ({ query, user }) => {
  const q = (query.q ?? "").trim();
  if (q.length < 2) {
    return ok({ documents: [] });
  }

  const documents = await prisma.document.findMany({
    where: {
      AND: [notDeleted, { authorId: user.id }, { title: { contains: q, mode: "insensitive" } }],
    },
    select: {
      id: true,
      title: true,
      workspaceId: true,
      workspace: { select: { name: true } },
      updatedAt: true,
    },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });

  return ok({ documents });
});
