import { BaseService } from "@core/base.service";
import { NotFoundError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import type { Prisma } from "@prisma/client";

const log = logger.child("DashboardService");

const notDeleted: Prisma.DocumentWhereInput = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

export class DashboardService extends BaseService {
  async getDashboardStats(userId: string) {
    try {
      const [totalWorkspaces, totalDocs, user] = await Promise.all([
        prisma.workspace.count({
          where: { ownerId: userId },
        }),
        prisma.document.count({
          where: {
            AND: [
              notDeleted,
              {
                OR: [{ authorId: userId }, { workspace: { ownerId: userId } }],
              },
            ],
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            subscriptionPlan: true,
            platformRole: true,
          },
        }),
      ]);

      if (!user) {
        throw new NotFoundError("User", userId);
      }

      return {
        totalDocs,
        totalWorkspaces,
        subscriptionPlan: user.subscriptionPlan,
        platformRole: user.platformRole,
      };
    } catch (error) {
      this.handleError(error, "Failed to get dashboard stats");
    }
  }
}
