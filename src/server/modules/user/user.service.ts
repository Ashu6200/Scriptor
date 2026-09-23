import { BaseService } from "@core/base.service";
import { NotFoundError } from "@core/errors";
import { prisma } from "@infra/db";
import type { UpdateUserInput } from "./user.schema";

export class UserService extends BaseService {
  async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          platformRole: true,
          subscriptionPlan: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { ownedWorkspaces: true },
          },
        },
      });
      if (!user) throw new NotFoundError("User", userId);
      return user;
    } catch (error) {
      this.handleError(error, "Failed to get user profile");
    }
  }

  async updateProfile(userId: string, data: UpdateUserInput) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User", userId);
      return await prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      this.handleError(error, "Failed to update user profile");
    }
  }
}
