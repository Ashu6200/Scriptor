import { BaseService } from "@core/base.service";
import { ForbiddenError, NotFoundError } from "@core/errors";
import { prisma } from "@infra/db";
import type { Prisma } from "@prisma/client";
import type { CreateCommentInput, UpdateCommentInput } from "./comment.schema";

const notDeleted: Prisma.CommentWhereInput = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

const parentIsRoot: Prisma.CommentWhereInput = {
  OR: [{ parentId: null }, { parentId: { isSet: false } }],
};

export class CommentService extends BaseService {
  async getDocumentComments(documentId: string) {
    try {
      return await prisma.comment.findMany({
        where: {
          documentId,
          AND: [parentIsRoot, notDeleted],
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
          resolvedBy: { select: { id: true, name: true } },
          replies: {
            where: notDeleted,
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      this.handleError(error, "Failed to fetch comments");
    }
  }

  async createComment(documentId: string, data: CreateCommentInput, authorId: string) {
    try {
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          parentId: data.parentId ?? null,
          selectionRange: (data.selectionRange as Prisma.InputJsonValue) ?? null,
          documentId,
          authorId,
        },
      });

      return comment;
    } catch (error) {
      this.handleError(error, "Failed to create comment");
    }
  }

  async updateComment(id: string, data: UpdateCommentInput, userId: string) {
    try {
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) throw new NotFoundError("Comment", id);
      if (comment.authorId !== userId)
        throw new ForbiddenError("You can only edit your own comments");

      return await prisma.comment.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleError(error, "Failed to update comment");
    }
  }

  async resolveComment(id: string, userId: string) {
    try {
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) throw new NotFoundError("Comment", id);

      const updated = await prisma.comment.update({
        where: { id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedById: userId,
        },
      });

      return updated;
    } catch (error) {
      this.handleError(error, "Failed to resolve comment");
    }
  }

  async deleteComment(id: string) {
    try {
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) throw new NotFoundError("Comment", id);

      const now = new Date();
      const [updated] = await prisma.$transaction([
        prisma.comment.update({
          where: { id },
          data: { deletedAt: now },
        }),
        prisma.comment.updateMany({
          where: { parentId: id, AND: [notDeleted] },
          data: { deletedAt: now },
        }),
      ]);

      return updated;
    } catch (error) {
      this.handleError(error, "Failed to delete comment");
    }
  }
}
