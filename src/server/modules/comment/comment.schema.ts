import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000),
  parentId: z.string().optional().nullable(),
  selectionRange: z.object({ from: z.number(), to: z.number() }).optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
});

export const resolveCommentSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
