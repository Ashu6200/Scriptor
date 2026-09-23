import { BaseService } from "@core/base.service";
import { NotFoundError, UnauthorizedError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { auditService } from "@modules/audit";

const log = logger.child("AuthService");

export class AuthService extends BaseService {
  async deactivateAccount(userId: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundError("User", userId);
      }

      if (user.deletedAt) {
        throw new UnauthorizedError("Account is already deactivated");
      }

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { deletedAt: new Date() },
        }),
        prisma.session.deleteMany({
          where: { userId },
        }),
      ]);

      void auditService.logAction({
        action: "DELETE",
        resourceType: "User",
        resourceId: userId,
        actorId: userId,
      });

      log.info(`Account deactivated: ${userId}`);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        deactivatedAt: updatedUser.deletedAt,
      };
    } catch (error) {
      this.handleError(error, "Failed to deactivate account");
    }
  }

  async getSessionInfo(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          subscriptionPlan: true,
          platformRole: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError("User", userId);
      }

      const activeSessions = await prisma.session.count({
        where: { userId, expiresAt: { gt: new Date() } },
      });

      return { user, activeSessions };
    } catch (error) {
      this.handleError(error, "Failed to get session info");
    }
  }
}
