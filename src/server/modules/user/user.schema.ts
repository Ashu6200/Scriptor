import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional().nullable(),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
