import { createHandler, jsonBody } from "@/server/http/createHandler";
import { ok } from "@/server/http/responses";
import { NotificationService, markReadSchema } from "@modules/notification";

const notificationService = new NotificationService();

export const POST = createHandler({ auth: true }, async ({ req, user }) => {
  const { ids } = markReadSchema.parse(await jsonBody(req));
  return ok(await notificationService.markAsRead(ids, user.id));
});
