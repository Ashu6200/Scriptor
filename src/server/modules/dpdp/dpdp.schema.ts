import { z } from "zod";

// ─── Policy Schemas ──────────────────────────────────────────────────────

export const createPolicySchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_-]*$/, "Key must be lowercase alphanumeric with hyphens/underscores"),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  purpose: z.string().min(5).max(1000),
  dataCategories: z.array(z.string().min(1).max(100)).min(1).max(20),
  processingDescription: z.string().min(10).max(5000),
  retentionPeriod: z.string().max(200).optional(),
  consentRequired: z.boolean().default(true),
  content: z.string().max(50000).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
});
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

export const updatePolicySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
});
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

export const createPolicyVersionSchema = z.object({
  purpose: z.string().min(5).max(1000),
  dataCategories: z.array(z.string().min(1).max(100)).min(1).max(20),
  processingDescription: z.string().min(10).max(5000),
  retentionPeriod: z.string().max(200).optional(),
  consentRequired: z.boolean().default(true),
  content: z.string().max(50000).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
});
export type CreatePolicyVersionInput = z.infer<typeof createPolicyVersionSchema>;

export const listPoliciesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  search: z.string().optional(),
});
export type ListPoliciesQuery = z.infer<typeof listPoliciesSchema>;

// ─── Consent Schemas ─────────────────────────────────────────────────────

export const grantConsentSchema = z.object({
  policyId: z.string().min(1),
  policyVersionId: z.string().min(1),
  status: z.enum(["GRANTED", "REJECTED"]),
  consentMethod: z.string().max(50).default("web_form"),
  source: z.string().max(100).default("consent_center"),
});
export type GrantConsentInput = z.infer<typeof grantConsentSchema>;

export const listUserConsentHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListUserConsentHistoryQuery = z.infer<typeof listUserConsentHistorySchema>;

// ─── Admin Consent Schemas ───────────────────────────────────────────────

export const listAdminConsentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().optional(),
  policyId: z.string().optional(),
  status: z.enum(["GRANTED", "REJECTED", "WITHDRAWN", "PENDING"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
});
export type ListAdminConsentsQuery = z.infer<typeof listAdminConsentsSchema>;

// ─── DPDP Audit Schemas ─────────────────────────────────────────────────

export const listDpdpAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
});
export type ListDpdpAuditLogsQuery = z.infer<typeof listDpdpAuditLogsSchema>;
