import { BaseService } from "@core/base.service";
import { AppError, NotFoundError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { redis } from "@infra/redis";
import type { Prisma, PaymentStatus, SubscriptionPlan } from "@prisma/client";
import type {
  AnalyticsQuery,
  ListTransactionsQuery,
  ListUsersQuery,
  ListWorkspacesQuery,
} from "./admin.schema";

const log = logger.child("AdminService");

export class AdminService extends BaseService {
  async getMetrics() {
    try {
      const notDeleted = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };

      const [
        totalUsers,
        totalWorkspaces,
        totalDocuments,
        activeUsers7d,
        newUsers7d,
        subscriptionBreakdown,
        failedPayments,
        capturedPaymentsAgg,
        failedPaymentsCount,
        refundsAgg,
      ] = await Promise.all([
        prisma.user.count({ where: notDeleted }),
        prisma.workspace.count(),
        prisma.document.count({ where: notDeleted }),
        prisma.session
          .groupBy({
            by: ["userId"],
            where: { updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          })
          .then((r) => r.length),
        prisma.user.count({
          where: {
            AND: [
              notDeleted,
              { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            ],
          },
        }),
        prisma.user.groupBy({
          by: ["subscriptionPlan"],
          _count: { id: true },
          where: notDeleted,
        }),
        prisma.user.count({
          where: { subscriptionStatus: "PAST_DUE", AND: [notDeleted] },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { status: "CAPTURED" },
        }),
        prisma.payment.count({
          where: { status: "FAILED" },
        }),
        prisma.refund.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { status: "PROCESSED" },
        }),
      ]);

      const planPricing: Record<string, number> = {
        PRO: 999,
        MAX: 4999,
      };
      const mrr = subscriptionBreakdown.reduce((sum, item) => {
        const price = planPricing[item.subscriptionPlan] || 0;
        return sum + price * item._count.id;
      }, 0);

      const planCounts: Record<string, number> = {};
      for (const item of subscriptionBreakdown) {
        planCounts[item.subscriptionPlan] = item._count.id;
      }

      const totalCapturedPaise = capturedPaymentsAgg._sum.amount ?? 0;
      const totalRefundedPaise = refundsAgg._sum.amount ?? 0;
      const netRevenuePaise = Math.max(0, totalCapturedPaise - totalRefundedPaise);

      return {
        totalUsers,
        totalWorkspaces,
        totalDocuments,
        activeUsers7d,
        newUsers7d,
        mrr,
        planCounts,
        failedPayments,
        paymentStats: {
          totalCapturedCount: capturedPaymentsAgg._count.id,
          totalCapturedPaise,
          totalRefundedCount: refundsAgg._count.id,
          totalRefundedPaise,
          netRevenuePaise,
          netRevenueINR: Math.round(netRevenuePaise / 100),
          failedPaymentsCount,
        },
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch platform metrics");
    }
  }

  async listUsers(query: ListUsersQuery) {
    try {
      const where: Prisma.UserWhereInput = {};

      if (query.search) {
        where.OR = [
          { email: { contains: query.search, mode: "insensitive" } },
          { name: { contains: query.search, mode: "insensitive" } },
        ];
      }
      if (query.role) {
        where.platformRole = query.role;
      }
      if (query.status === "active") {
        where.OR = [{ deletedAt: null }, { deletedAt: { isSet: false } }];
      } else if (query.status === "deactivated") {
        where.deletedAt = { not: null };
      }

      return await this.paginate(
        prisma.user,
        { page: query.page, limit: query.limit },
        {
          where,
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            platformRole: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            emailVerified: true,
            deletedAt: true,
            createdAt: true,
            _count: { select: { ownedWorkspaces: true } },
          },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list users");
    }
  }

  async togglePlatformRole(userId: string, role: "USER" | "ADMIN", callerId?: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User", userId);

      if (role === "USER" && user.platformRole === "ADMIN") {
        const notDeleted = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
        const activeAdminCount = await prisma.user.count({
          where: {
            platformRole: "ADMIN",
            AND: [notDeleted],
          },
        });

        if (activeAdminCount <= 1) {
          throw new AppError(
            "Cannot demote the last remaining platform administrator",
            400,
            "CANNOT_DEMOTE_LAST_ADMIN"
          );
        }

        if (callerId && callerId === userId) {
          throw new AppError(
            "Cannot demote your own account. Another administrator must perform this action.",
            400,
            "CANNOT_SELF_DEMOTE"
          );
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { platformRole: role },
        select: { id: true, email: true, name: true, platformRole: true },
      });

      const sessions = await prisma.session.findMany({
        where: { userId },
        select: { token: true },
      });
      for (const session of sessions) {
        await redis.del(`ba:session:${session.token}`).catch(() => {});
        await redis.del(`session:me:${session.token}`).catch(() => {});
      }

      log.info(`Platform role changed: ${userId} → ${role}`);
      return updated;
    } catch (error) {
      this.handleError(error, "Failed to toggle platform role");
    }
  }

  async deactivateUser(userId: string, callerId?: string) {
    try {
      if (callerId && callerId === userId) {
        throw new AppError(
          "Cannot deactivate your own administrator account",
          400,
          "CANNOT_SELF_DEACTIVATE"
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User", userId);
      if (user.deletedAt) {
        throw new AppError("User is already deactivated", 400);
      }

      if (user.platformRole === "ADMIN") {
        const notDeleted = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };
        const activeAdminCount = await prisma.user.count({
          where: {
            platformRole: "ADMIN",
            AND: [notDeleted],
          },
        });
        if (activeAdminCount <= 1) {
          throw new AppError(
            "Cannot deactivate the last remaining platform administrator",
            400,
            "CANNOT_DEACTIVATE_LAST_ADMIN"
          );
        }
      }

      const sessions = await prisma.session.findMany({
        where: { userId },
        select: { token: true },
      });
      for (const session of sessions) {
        await redis.del(`ba:session:${session.token}`).catch(() => {});
        await redis.del(`session:me:${session.token}`).catch(() => {});
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { deletedAt: new Date() },
        }),
        prisma.session.deleteMany({ where: { userId } }),
      ]);

      log.info(`User deactivated: ${userId}`);
      return { id: userId, deactivated: true };
    } catch (error) {
      this.handleError(error, "Failed to deactivate user");
    }
  }

  async reactivateUser(userId: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User", userId);
      if (!user.deletedAt) {
        throw new AppError("User is already active", 400);
      }

      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null },
      });

      log.info(`User reactivated: ${userId}`);
      return { id: userId, reactivated: true };
    } catch (error) {
      this.handleError(error, "Failed to reactivate user");
    }
  }

  async listAllWorkspaces(query: ListWorkspacesQuery) {
    try {
      const where: Prisma.WorkspaceWhereInput = {};

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { slug: { contains: query.search, mode: "insensitive" } },
        ];
      }
      if (query.plan) {
        where.owner = { subscriptionPlan: query.plan as SubscriptionPlan };
      }

      return await this.paginate(
        prisma.workspace,
        { page: query.page, limit: query.limit },
        {
          where,
          include: {
            owner: { select: { id: true, name: true, email: true, subscriptionPlan: true } },
            _count: { select: { documents: true } },
          },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list workspaces");
    }
  }

  async overridePlan(userId: string, plan: SubscriptionPlan) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User", userId);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: plan === "FREE" ? null : "ACTIVE",
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
        },
      });

      const sessions = await prisma.session.findMany({
        where: { userId },
        select: { token: true },
      });
      for (const session of sessions) {
        await redis.del(`session:me:${session.token}`).catch(() => {});
      }

      log.info(`Plan override: user ${userId} → ${plan}`);
      return updated;
    } catch (error) {
      this.handleError(error, "Failed to override plan");
    }
  }

  async suspendWorkspace(workspaceId: string) {
    try {
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) throw new NotFoundError("Workspace", workspaceId);
      if (workspace.suspendedAt) {
        throw new AppError("Workspace is already suspended", 400);
      }

      const updated = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { suspendedAt: new Date() },
      });

      await redis.del(`ws:${workspaceId}`).catch(() => {});
      await redis.del(`user:workspaces:${updated.ownerId}`).catch(() => {});

      log.info(`Workspace suspended: ${workspaceId}`);
      return updated;
    } catch (error) {
      this.handleError(error, "Failed to suspend workspace");
    }
  }

  async unsuspendWorkspace(workspaceId: string) {
    try {
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) throw new NotFoundError("Workspace", workspaceId);
      if (!workspace.suspendedAt) {
        throw new AppError("Workspace is not suspended", 400);
      }

      const updated = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { suspendedAt: null },
      });

      await redis.del(`ws:${workspaceId}`).catch(() => {});
      await redis.del(`user:workspaces:${updated.ownerId}`).catch(() => {});

      log.info(`Workspace unsuspended: ${workspaceId}`);
      return updated;
    } catch (error) {
      this.handleError(error, "Failed to unsuspend workspace");
    }
  }

  async getAllSettings() {
    try {
      const settings = await prisma.platformSetting.findMany();
      const result: Record<string, string> = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      return result;
    } catch (error) {
      this.handleError(error, "Failed to fetch platform settings");
    }
  }

  async setSetting(key: string, value: string) {
    try {
      const setting = await prisma.platformSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });

      log.info(`Platform setting updated: ${key}`);
      return setting;
    } catch (error) {
      this.handleError(error, "Failed to update platform setting");
    }
  }

  async getAnalytics(from: Date, to: Date) {
    try {
      const notDeleted = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] };

      const [capturedPayments, newUsers, subscriptionStatusData, paymentMethodData] =
        await Promise.all([
          prisma.payment.findMany({
            where: { status: "CAPTURED", capturedAt: { gte: from, lte: to } },
            select: { capturedAt: true, createdAt: true, amount: true },
          }),
          prisma.user.findMany({
            where: { AND: [notDeleted, { createdAt: { gte: from, lte: to } }] },
            select: { createdAt: true },
          }),
          prisma.user.groupBy({
            by: ["subscriptionStatus"],
            _count: { id: true },
            where: notDeleted,
          }),
          prisma.payment.groupBy({
            by: ["method"],
            _count: { id: true },
            _sum: { amount: true },
            where: { status: "CAPTURED" },
          }),
        ]);

      const fillDaySeries = (
        items: { date: Date; value: number }[],
        rangeFrom: Date,
        rangeTo: Date
      ) => {
        const map = new Map<string, number>();
        for (const item of items) {
          const key = item.date.toISOString().slice(0, 10);
          map.set(key, (map.get(key) ?? 0) + item.value);
        }
        const result: { date: string; value: number }[] = [];
        const cur = new Date(rangeFrom);
        cur.setUTCHours(0, 0, 0, 0);
        const end = new Date(rangeTo);
        end.setUTCHours(23, 59, 59, 999);
        while (cur <= end) {
          const key = cur.toISOString().slice(0, 10);
          result.push({ date: key, value: map.get(key) ?? 0 });
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
        return result;
      };

      const revenueSeries = fillDaySeries(
        capturedPayments.map((p) => ({
          date: p.capturedAt ?? p.createdAt,
          value: Math.round(p.amount / 100),
        })),
        from,
        to
      );

      const signupSeries = fillDaySeries(
        newUsers.map((u) => ({ date: u.createdAt, value: 1 })),
        from,
        to
      );

      const subscriptionStatus: Record<string, number> = {};
      for (const item of subscriptionStatusData) {
        subscriptionStatus[item.subscriptionStatus ?? "NONE"] = item._count.id;
      }

      const paymentMethods = paymentMethodData.map((item) => ({
        method: item.method,
        count: item._count.id,
        amountINR: Math.round((item._sum.amount ?? 0) / 100),
      }));

      return {
        revenueSeries,
        signupSeries,
        totalRevenueINR: revenueSeries.reduce((s, d) => s + d.value, 0),
        totalSignups: signupSeries.reduce((s, d) => s + d.value, 0),
        totalTransactions: capturedPayments.length,
        subscriptionStatus,
        paymentMethods,
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch analytics");
    }
  }

  async listTransactions(query: ListTransactionsQuery) {
    try {
      const where: Prisma.PaymentWhereInput = {};
      if (query.status) where.status = query.status as PaymentStatus;
      if (query.from || query.to) {
        where.createdAt = {};
        if (query.from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(query.from);
        if (query.to) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(query.to);
      }

      return await this.paginate(
        prisma.payment,
        { page: query.page, limit: query.limit },
        {
          where,
          include: {
            user: { select: { id: true, email: true, name: true } },
            order: { select: { id: true, orderNumber: true } },
          },
          orderBy: { createdAt: "desc" },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list transactions");
    }
  }
}
