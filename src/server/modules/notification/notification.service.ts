import { BaseService } from "@core/base.service";
import { prisma } from "@infra/db";
import type { Prisma } from "@prisma/client";
import type { ListNotificationsQuery } from "./notification.schema";

export class NotificationService extends BaseService {
  async listNotifications(userId: string, query: ListNotificationsQuery) {
    try {
      const isRead = query.isRead === "true" ? true : query.isRead === "false" ? false : undefined;
      const where: Prisma.NotificationWhereInput = { userId };
      if (isRead !== undefined) where.isRead = isRead;
      if (query.workspaceId) where.workspaceId = query.workspaceId;

      return await this.paginate(
        prisma.notification,
        { page: query.page, limit: query.limit },
        { where }
      );
    } catch (error) {
      this.handleError(error, "Failed to list notifications");
    }
  }

  async markAsRead(ids: string[], userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { isRead: true, readAt: new Date() },
      });
    } catch (error) {
      this.handleError(error, "Failed to mark notifications as read");
    }
  }

  async markAllAsRead(userId: string, workspaceId?: string) {
    try {
      const where: Prisma.NotificationWhereInput = { userId, isRead: false };
      if (workspaceId) where.workspaceId = workspaceId;

      return await prisma.notification.updateMany({
        where,
        data: { isRead: true, readAt: new Date() },
      });
    } catch (error) {
      this.handleError(error, "Failed to mark all as read");
    }
  }

  async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({ where: { userId, isRead: false } });
    } catch (error) {
      this.handleError(error, "Failed to get unread count");
    }
  }
}
