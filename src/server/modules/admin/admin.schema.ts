import { z } from "zod";

export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["active", "deactivated"]).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersSchema>;

export const listWorkspacesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  plan: z.enum(["FREE", "PRO", "MAX"]).optional(),
});
export type ListWorkspacesQuery = z.infer<typeof listWorkspacesSchema>;

export const toggleRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});
export type ToggleRoleInput = z.infer<typeof toggleRoleSchema>;

export const overridePlanSchema = z.object({
  plan: z.enum(["FREE", "PRO", "MAX"]),
});
export type OverridePlanInput = z.infer<typeof overridePlanSchema>;

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

export const analyticsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});
export type AnalyticsQuery = z.infer<typeof analyticsSchema>;

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "CANCELLED"])
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;
