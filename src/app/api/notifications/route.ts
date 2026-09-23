import { createHandler } from "@/server/http/createHandler";
import { paginated } from "@/server/http/responses";
import { NotificationService, listNotificationsSchema } from "@modules/notification";

const notificationService = new NotificationService();

export const GET = createHandler({ auth: true }, async ({ user, query }) => {
  const parsed = listNotificationsSchema.parse(query);
  const result = await notificationService.listNotifications(user.id, parsed);
  return paginated(result!);
});
