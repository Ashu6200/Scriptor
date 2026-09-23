import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  content: z.string().optional().nullable(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  parentId: z.string().optional().nullable(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
  icon: z.string().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional().nullable(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
  isPublished: z.boolean().optional(),
  icon: z.string().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
  changeSummary: z.string().max(500).optional(),
});

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "order"]).default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  tag: z.string().optional(),
  authorId: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
