import { BaseService } from "@core/base.service";
import { assertCanCreateDocument, getEntitlements } from "@core/entitlements";
import { NotFoundError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { redis } from "@infra/redis";
import { auditService } from "@modules/audit";
import type { Document, Prisma, SubscriptionPlan } from "@prisma/client";
import type {
  CreateDocumentInput,
  ListDocumentsQuery,
  UpdateDocumentInput,
} from "./document.schema";

const log = logger.child("DocumentService");
const CACHE_TTL = 3600;

const notDeleted: Prisma.DocumentWhereInput = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

const parentIsRoot: Prisma.DocumentWhereInput = {
  OR: [{ parentId: null }, { parentId: { isSet: false } }],
};

export class DocumentService extends BaseService {
  async getDocumentById(id: string, workspaceId?: string) {
    try {
      const cacheKey = `doc:${id}`;
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
        if (!workspaceId || workspaceId === "all" || parsed.workspaceId === workspaceId) {
          return parsed;
        }
      }

      const where: Prisma.DocumentWhereInput = { id, AND: [notDeleted] };
      if (workspaceId && workspaceId !== "all") {
        where.workspaceId = workspaceId;
      }

      const document = await prisma.document.findFirst({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          parent: {
            select: { id: true, title: true },
          },
          children: {
            where: notDeleted,
            select: { id: true, title: true, updatedAt: true, order: true },
            orderBy: { order: "asc" },
          },
          _count: {
            select: { versions: true, comments: true, children: true },
          },
        },
      });

      if (!document) {
        throw new NotFoundError("Document", id);
      }

      await redis.set(cacheKey, JSON.stringify(document), { ex: CACHE_TTL });
      return document;
    } catch (error) {
      this.handleError(error, "Failed to fetch document");
    }
  }

  async createDocument(data: CreateDocumentInput, authorId: string) {
    try {
      await assertCanCreateDocument(authorId, data.workspaceId);

      const parentId = data.parentId ?? null;
      const baseSlug =
        data.slug ||
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") ||
        `doc-${Date.now()}`;

      let slug = baseSlug;
      let count = 1;

      while (
        await prisma.document.findFirst({
          where: {
            workspaceId: data.workspaceId,
            ...(parentId === null
              ? { OR: [{ parentId: null }, { parentId: { isSet: false } }] }
              : { parentId }),
            slug,
          },
          select: { id: true },
        })
      ) {
        slug = `${baseSlug}-${count++}`;
      }

      const words = data.content ? data.content.split(/\s+/).length : 0;
      const readingTime = Math.max(1, Math.ceil(words / 200));

      let document: Document | null = null;
      while (!document) {
        try {
          document = await prisma.$transaction(async (tx) => {
            const doc = await tx.document.create({
              data: {
                ...data,
                parentId,
                slug,
                authorId,
                readingTime,
              },
            });

            await tx.documentVersion.create({
              data: {
                documentId: doc.id,
                title: doc.title,
                content: doc.content || "",
                createdBy: authorId,
                versionNumber: 1,
                changeSummary: "Initial creation",
              },
            });

            await tx.notification.create({
              data: {
                userId: authorId,
                workspaceId: data.workspaceId,
                type: "document_created",
                payload: { documentId: doc.id, title: doc.title, actorId: authorId },
              },
            });

            return doc;
          });
        } catch (err: unknown) {
          const isP2002 =
            typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
          if (isP2002 && count < 20) {
            slug = `${baseSlug}-${count++}`;
          } else {
            throw err;
          }
        }
      }

      void auditService.logAction({
        action: "CREATE",
        resourceType: "Document",
        resourceId: document.id,
        actorId: authorId,
        workspaceId: data.workspaceId,
      });

      log.info(`Document created: ${document.id} in workspace ${data.workspaceId}`);
      return document;
    } catch (error) {
      this.handleError(error, "Failed to create document");
    }
  }

  async updateDocument(id: string, data: UpdateDocumentInput, userId: string) {
    try {
      const { changeSummary, ...updateData } = data;

      const patch: Prisma.DocumentUpdateInput = { ...updateData };

      if (updateData.content) {
        const words = updateData.content.split(/\s+/).length;
        patch.readingTime = Math.max(1, Math.ceil(words / 200));
      }

      const document = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id },
          data: patch,
        });

        if (updateData.content || updateData.title) {
          const version = await tx.documentVersion.findFirst({
            where: { documentId: id },
            orderBy: { versionNumber: "desc" },
            select: { versionNumber: true },
          });
          const latestVersion = version ? version.versionNumber : 0;

          await tx.documentVersion.create({
            data: {
              documentId: id,
              title: doc.title,
              content: doc.content || "",
              createdBy: userId,
              versionNumber: latestVersion + 1,
              changeSummary,
            },
          });
        }

        return doc;
      });

      await redis.del(`doc:${id}`);

      void auditService.logAction({
        action: "UPDATE",
        resourceType: "Document",
        resourceId: id,
        details: { changes: Object.keys(patch) },
        actorId: userId,
        workspaceId: document.workspaceId,
      });

      log.info(`Document updated: ${id}`);
      return document;
    } catch (error) {
      this.handleError(error, "Failed to update document");
    }
  }

  async deleteDocument(id: string, userId: string) {
    try {
      const document = await prisma.document.findFirst({
        where: { id, AND: [notDeleted] },
      });
      if (!document) {
        throw new NotFoundError("Document", id);
      }

      const now = new Date();
      const [result] = await prisma.$transaction([
        prisma.document.update({
          where: { id },
          data: { deletedAt: now },
        }),
        prisma.document.updateMany({
          where: { parentId: id, AND: [notDeleted] },
          data: { deletedAt: now },
        }),
      ]);

      await redis.del(`doc:${id}`);

      void auditService.logAction({
        action: "DELETE",
        resourceType: "Document",
        resourceId: id,
        actorId: userId,
        workspaceId: document.workspaceId,
      });

      log.info(`Document soft-deleted: ${id}`);
      return result;
    } catch (error) {
      this.handleError(error, "Failed to delete document");
    }
  }

  async getDocumentTree(workspaceId: string, userId?: string) {
    try {
      const conditions: Prisma.DocumentWhereInput[] = [parentIsRoot, notDeleted];

      if (workspaceId && workspaceId !== "all") {
        conditions.push({ workspaceId });
      } else if (userId) {
        conditions.push({
          OR: [{ authorId: userId }, { workspace: { ownerId: userId } }],
        });
      }

      return await prisma.document.findMany({
        where: { AND: conditions },
        include: {
          children: {
            where: notDeleted,
            include: {
              children: {
                where: notDeleted,
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      });
    } catch (error) {
      this.handleError(error, "Failed to fetch document tree");
    }
  }

  async listDocuments(workspaceId: string | undefined, query: ListDocumentsQuery, userId?: string) {
    try {
      const conditions: Prisma.DocumentWhereInput[] = [notDeleted];

      if (query.authorId) {
        conditions.push({ authorId: query.authorId });
      } else if (workspaceId && workspaceId !== "all") {
        conditions.push({ workspaceId });
      } else if (userId) {
        conditions.push({
          OR: [{ authorId: userId }, { workspace: { ownerId: userId } }],
        });
      }

      if (query.visibility) {
        conditions.push({ visibility: query.visibility });
      }

      if (query.search) {
        conditions.push({
          OR: [
            { title: { contains: query.search, mode: "insensitive" as const } },
            { content: { contains: query.search, mode: "insensitive" as const } },
          ],
        });
      }

      if (query.tag) {
        conditions.push({ tags: { has: query.tag } });
      }

      return await this.paginate(
        prisma.document,
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
        {
          where: { AND: conditions },
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list documents");
    }
  }

  async getVersionHistory(
    documentId: string,
    user?: { subscriptionPlan?: SubscriptionPlan | string; platformRole?: string }
  ) {
    try {
      const document = await prisma.document.findFirst({
        where: { id: documentId, AND: [notDeleted] },
      });
      if (!document) {
        throw new NotFoundError("Document", documentId);
      }

      const isAdmin = user?.platformRole === "ADMIN";
      const plan = ((user?.subscriptionPlan as SubscriptionPlan) ?? "FREE") as SubscriptionPlan;
      const days = isAdmin ? Number.POSITIVE_INFINITY : getEntitlements(plan).versionHistoryDays;

      const cutoffDate =
        days !== Number.POSITIVE_INFINITY
          ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          : undefined;

      return await prisma.documentVersion.findMany({
        where: {
          documentId,
          ...(cutoffDate ? { createdAt: { gte: cutoffDate } } : {}),
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      });
    } catch (error) {
      this.handleError(error, "Failed to fetch version history");
    }
  }

  async listTrashDocuments(workspaceId?: string, userId?: string) {
    try {
      const conditions: Prisma.DocumentWhereInput[] = [{ deletedAt: { not: null } }];

      if (workspaceId && workspaceId !== "all") {
        conditions.push({ workspaceId });
      } else if (userId) {
        conditions.push({
          OR: [{ authorId: userId }, { workspace: { ownerId: userId } }],
        });
      }

      return await prisma.document.findMany({
        where: { AND: conditions },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          parent: {
            select: { id: true, title: true },
          },
          workspace: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { deletedAt: "desc" },
      });
    } catch (error) {
      this.handleError(error, "Failed to list trash documents");
    }
  }

  async restoreDocument(id: string, userId: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document || !document.deletedAt) {
        throw new NotFoundError("Document in trash", id);
      }

      // Check if parent is also deleted or missing. If so, reset parentId to null so it stays visible as root
      let parentId = document.parentId;
      if (parentId) {
        const parentDoc = await prisma.document.findFirst({
          where: { id: parentId, AND: [notDeleted] },
        });
        if (!parentDoc) {
          parentId = null;
        }
      }

      const [restored] = await prisma.$transaction([
        prisma.document.update({
          where: { id },
          data: {
            deletedAt: null,
            parentId,
          },
        }),
        prisma.document.updateMany({
          where: { parentId: id },
          data: { deletedAt: null },
        }),
      ]);

      await redis.del(`doc:${id}`);

      void auditService.logAction({
        action: "UPDATE",
        resourceType: "Document",
        resourceId: id,
        details: { action: "RESTORE" },
        actorId: userId,
        workspaceId: document.workspaceId,
      });

      log.info(`Document restored from trash: ${id}`);
      return restored;
    } catch (error) {
      this.handleError(error, "Failed to restore document");
    }
  }

  async permanentlyDeleteDocument(id: string, userId: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new NotFoundError("Document", id);
      }

      await prisma.$transaction(async (tx) => {
        await tx.comment.deleteMany({ where: { documentId: id } });
        await tx.documentVersion.deleteMany({ where: { documentId: id } });
        // Re-parent or delete immediate children
        await tx.document.updateMany({
          where: { parentId: id },
          data: { parentId: document.parentId ?? null },
        });
        await tx.document.delete({ where: { id } });
      });

      await redis.del(`doc:${id}`);

      void auditService.logAction({
        action: "DELETE",
        resourceType: "Document",
        resourceId: id,
        details: { action: "PERMANENT_DELETE" },
        actorId: userId,
        workspaceId: document.workspaceId,
      });

      log.info(`Document permanently purged: ${id}`);
      return { success: true, id };
    } catch (error) {
      this.handleError(error, "Failed to permanently delete document");
    }
  }

  async emptyTrash(workspaceId: string, userId: string) {
    try {
      const trashedDocs = await prisma.document.findMany({
        where: {
          workspaceId,
          deletedAt: { not: null },
        },
        select: { id: true },
      });

      const docIds = trashedDocs.map((d) => d.id);
      if (docIds.length === 0) {
        return { count: 0 };
      }

      await prisma.$transaction(async (tx) => {
        await tx.comment.deleteMany({ where: { documentId: { in: docIds } } });
        await tx.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
        await tx.document.deleteMany({ where: { id: { in: docIds } } });
      });

      for (const docId of docIds) {
        await redis.del(`doc:${docId}`);
      }

      void auditService.logAction({
        action: "DELETE",
        resourceType: "Document",
        resourceId: workspaceId,
        details: { action: "EMPTY_TRASH", count: docIds.length },
        actorId: userId,
        workspaceId,
      });

      log.info(`Trash emptied for workspace ${workspaceId}: ${docIds.length} items`);
      return { count: docIds.length };
    } catch (error) {
      this.handleError(error, "Failed to empty trash");
    }
  }

  async getPublicDocument(workspaceSlug: string, documentSlug: string) {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          suspendedAt: true,
        },
      });

      if (!workspace || workspace.suspendedAt) {
        throw new NotFoundError("Workspace", workspaceSlug);
      }

      const document = await prisma.document.findFirst({
        where: {
          workspaceId: workspace.id,
          slug: documentSlug,
          AND: [notDeleted],
          OR: [{ visibility: "PUBLIC" }, { isPublished: true }],
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          parent: {
            select: { id: true, title: true, slug: true },
          },
        },
      });

      if (!document) {
        throw new NotFoundError("Public Document", documentSlug);
      }

      const publicDocs = await prisma.document.findMany({
        where: {
          workspaceId: workspace.id,
          AND: [notDeleted],
          OR: [{ visibility: "PUBLIC" }, { isPublished: true }],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          parentId: true,
          order: true,
        },
        orderBy: { order: "asc" },
      });

      return {
        workspace,
        document,
        publishedDocuments: publicDocs,
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch public document");
    }
  }
}
