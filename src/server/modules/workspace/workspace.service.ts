import { BaseService } from "@core/base.service";
import { assertCanCreateWorkspace } from "@core/entitlements";
import { ConflictError, ForbiddenError, NotFoundError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { redis } from "@infra/redis";
import type { Prisma } from "@prisma/client";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspace.schema";

const log = logger.child("WorkspaceService");

export class WorkspaceService extends BaseService {
  async createWorkspace(data: CreateWorkspaceInput, ownerId: string) {
    try {
      await assertCanCreateWorkspace(ownerId);

      const baseSlug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") ||
        `ws-${Date.now()}`;
      let finalSlug = baseSlug;
      const existing = await prisma.workspace.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        if (data.slug) {
          throw new ConflictError(`Workspace slug '${data.slug}' is already taken`);
        }
        finalSlug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
      }

      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          slug: finalSlug,
          type: "PERSONAL",
          logoUrl: data.logoUrl,
          settings: (data.settings as Prisma.InputJsonValue) ?? null,
          ownerId,
        },
      });

      await redis.del(`user:workspaces:${ownerId}`).catch(() => {});

      log.info(`Workspace created: ${workspace.id} (${workspace.slug})`);
      return workspace;
    } catch (error) {
      this.handleError(error, "Failed to create workspace");
    }
  }

  async getWorkspaceById(id: string) {
    try {
      const cacheKey = `ws:${id}`;
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          _count: {
            select: { documents: true },
          },
        },
      });
      if (!workspace) {
        throw new NotFoundError("Workspace", id);
      }

      await redis.set(cacheKey, JSON.stringify(workspace), { ex: 3600 });
      return workspace;
    } catch (error) {
      this.handleError(error, "Failed to fetch workspace");
    }
  }

  async getWorkspaceBySlug(slug: string) {
    try {
      const cacheKey = `ws:slug:${slug}`;
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const workspace = await prisma.workspace.findUnique({ where: { slug } });
      if (!workspace) {
        throw new NotFoundError("Workspace");
      }

      await redis.set(cacheKey, JSON.stringify(workspace), { ex: 3600 });
      return workspace;
    } catch (error) {
      this.handleError(error, "Failed to fetch workspace");
    }
  }

  async getUserWorkspaces(userId: string) {
    try {
      const cacheKey = `user:workspaces:${userId}`;
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }

      const [workspaces, user] = await Promise.all([
        prisma.workspace.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { pinnedWorkspaceIds: true },
        }),
      ]);

      const pinnedIds = new Set(user?.pinnedWorkspaceIds ?? []);
      const enriched = workspaces.map((ws) => ({
        ...ws,
        isPinned: pinnedIds.has(ws.id),
      }));

      await redis.set(cacheKey, JSON.stringify(enriched), { ex: 1800 });
      return enriched;
    } catch (error) {
      this.handleError(error, "Failed to fetch user workspaces");
    }
  }

  async updateWorkspace(id: string, data: UpdateWorkspaceInput) {
    try {
      if (data.slug) {
        const existing = await prisma.workspace.findUnique({ where: { slug: data.slug } });
        if (existing && existing.id !== id) {
          throw new ConflictError(`Workspace slug '${data.slug}' is already taken`);
        }
      }

      const current = await prisma.workspace.findUnique({
        where: { id },
        select: { slug: true },
      });

      const { settings, ...rest } = data;

      const workspace = await prisma.workspace.update({
        where: { id },
        data: {
          ...rest,
          ...(settings === undefined
            ? {}
            : {
                settings: (settings as Prisma.InputJsonValue) ?? null,
              }),
        },
      });

      log.info(`Workspace updated: ${workspace.id}`);

      await Promise.all([
        redis.del(`ws:${id}`).catch(() => {}),
        current?.slug ? redis.del(`ws:slug:${current.slug}`).catch(() => {}) : Promise.resolve(),
        workspace.slug ? redis.del(`ws:slug:${workspace.slug}`).catch(() => {}) : Promise.resolve(),
        redis.del(`user:workspaces:${workspace.ownerId}`).catch(() => {}),
      ]);

      return workspace;
    } catch (error) {
      this.handleError(error, "Failed to update workspace");
    }
  }

  async getPinnedWorkspaces(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pinnedWorkspaceIds: true },
      });

      const pinnedIds = user?.pinnedWorkspaceIds ?? [];
      if (pinnedIds.length === 0) return [];

      const workspaces = await prisma.workspace.findMany({
        where: { id: { in: pinnedIds } },
      });

      const wsMap = new Map(workspaces.map((w) => [w.id, w]));
      return pinnedIds
        .map((id) => wsMap.get(id))
        .filter((w): w is NonNullable<typeof w> => Boolean(w));
    } catch (error) {
      this.handleError(error, "Failed to fetch pinned workspaces");
    }
  }

  async togglePinWorkspace(workspaceId: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pinnedWorkspaceIds: true },
      });

      let pinnedIds = user?.pinnedWorkspaceIds ?? [];
      const isPinned = pinnedIds.includes(workspaceId);

      if (isPinned) {
        pinnedIds = pinnedIds.filter((id) => id !== workspaceId);
      } else {
        pinnedIds = [...pinnedIds, workspaceId];
      }

      await prisma.user.update({
        where: { id: userId },
        data: { pinnedWorkspaceIds: pinnedIds },
      });

      await redis.del(`user:workspaces:${userId}`);
      log.info(`Workspace pin toggled: ${workspaceId} by ${userId} (pinned=${!isPinned})`);

      return { workspaceId, isPinned: !isPinned, pinnedWorkspaceIds: pinnedIds };
    } catch (error) {
      this.handleError(error, "Failed to toggle workspace pin");
    }
  }

  async unpinWorkspace(workspaceId: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pinnedWorkspaceIds: true },
      });

      const pinnedIds = (user?.pinnedWorkspaceIds ?? []).filter((id) => id !== workspaceId);

      await prisma.user.update({
        where: { id: userId },
        data: { pinnedWorkspaceIds: pinnedIds },
      });

      await redis.del(`user:workspaces:${userId}`).catch(() => {});
      log.info(`Workspace unpinned: ${workspaceId} by ${userId}`);

      return { workspaceId, isPinned: false, pinnedWorkspaceIds: pinnedIds };
    } catch (error) {
      this.handleError(error, "Failed to unpin workspace");
    }
  }

  async reorderPinnedWorkspaces(workspaceIds: string[], userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { pinnedWorkspaceIds: workspaceIds },
      });

      await redis.del(`user:workspaces:${userId}`);
      log.info(`Pinned workspaces reordered for user ${userId}`);

      return this.getPinnedWorkspaces(userId);
    } catch (error) {
      this.handleError(error, "Failed to reorder pinned workspaces");
    }
  }

  async deleteWorkspace(id: string, actorId: string) {
    try {
      const workspace = await prisma.workspace.findUnique({ where: { id } });
      if (!workspace) {
        throw new NotFoundError("Workspace", id);
      }

      if (workspace.ownerId !== actorId) {
        throw new ForbiddenError("Only the workspace owner can delete it");
      }

      let deletedDocIds: string[] = [];

      await prisma.$transaction(async (tx) => {
        await tx.document.updateMany({
          where: { workspaceId: id },
          data: { parentId: null },
        });

        const docs = await tx.document.findMany({
          where: { workspaceId: id },
          select: { id: true },
        });
        deletedDocIds = docs.map((d) => d.id);

        if (deletedDocIds.length > 0) {
          await tx.comment.updateMany({
            where: { documentId: { in: deletedDocIds } },
            data: { parentId: null },
          });
          await tx.comment.deleteMany({
            where: { documentId: { in: deletedDocIds } },
          });

          await tx.documentVersion.deleteMany({
            where: { documentId: { in: deletedDocIds } },
          });

          await tx.document.deleteMany({
            where: { workspaceId: id },
          });
        }

        await tx.notification.deleteMany({
          where: { workspaceId: id },
        });

        const user = await tx.user.findUnique({
          where: { id: actorId },
          select: { pinnedWorkspaceIds: true },
        });
        if (user?.pinnedWorkspaceIds?.includes(id)) {
          await tx.user.update({
            where: { id: actorId },
            data: {
              pinnedWorkspaceIds: user.pinnedWorkspaceIds.filter((wsId) => wsId !== id),
            },
          });
        }

        await tx.workspace.delete({ where: { id } });
      });

      await Promise.all([
        ...deletedDocIds.map((docId) => redis.del(`doc:${docId}`).catch(() => {})),
        redis.del(`ws:${id}`).catch(() => {}),
        workspace.slug ? redis.del(`ws:slug:${workspace.slug}`).catch(() => {}) : Promise.resolve(),
        redis.del(`user:workspaces:${actorId}`).catch(() => {}),
        redis.del(`tree:${id}`).catch(() => {}),
      ]);

      log.info(`Workspace deleted: ${id}`);

      return { id, deleted: true };
    } catch (error) {
      this.handleError(error, "Failed to delete workspace");
    }
  }
}
