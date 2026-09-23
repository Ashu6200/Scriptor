import { createHandler } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { NotificationService } from "@modules/notification";

const notificationService = new NotificationService();

export const GET = createHandler({ auth: true }, async ({ user }) =>
  ok(await notificationService.getUnreadCount(user.id))
);
