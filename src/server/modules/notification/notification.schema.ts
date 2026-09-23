import { z } from "zod";

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  isRead: z.enum(["true", "false"]).optional(),
  workspaceId: z.string().optional(),
});

export const markReadSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
