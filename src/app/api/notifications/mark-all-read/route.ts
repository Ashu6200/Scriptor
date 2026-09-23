import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { NotificationService } from "@modules/notification";

const notificationService = new NotificationService();

export const POST = createHandler({ auth: true }, async ({ user, query }) =>
  ok(await notificationService.markAllAsRead(user.id, query.workspaceId))
);
