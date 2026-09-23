export interface PlanEntitlements {
  maxWorkspaces: number;
  maxDocuments: number;
  versionHistoryDays: number;
  hasAuditLogs: boolean;
  hasTrash: boolean;
  hasMermaid: boolean;
  hasAi: boolean;
}

export const CLIENT_PLAN_LIMITS: Record<string, PlanEntitlements> = {
  FREE: {
    maxWorkspaces: 1,
    maxDocuments: 30,
    versionHistoryDays: 7,
    hasAuditLogs: false,
    hasTrash: false,
    hasMermaid: false,
    hasAi: false,
  },
  PRO: {
    maxWorkspaces: 5,
    maxDocuments: Number.POSITIVE_INFINITY,
    versionHistoryDays: 90,
    hasAuditLogs: true,
    hasTrash: true,
    hasMermaid: true,
    hasAi: false,
  },
  MAX: {
    maxWorkspaces: Number.POSITIVE_INFINITY,
    maxDocuments: Number.POSITIVE_INFINITY,
    versionHistoryDays: 365,
    hasAuditLogs: true,
    hasTrash: true,
    hasMermaid: true,
    hasAi: true,
  },
};

const ADMIN_ENTITLEMENTS: PlanEntitlements = {
  maxWorkspaces: Number.POSITIVE_INFINITY,
  maxDocuments: Number.POSITIVE_INFINITY,
  versionHistoryDays: Number.POSITIVE_INFINITY,
  hasAuditLogs: true,
  hasTrash: true,
  hasMermaid: true,
  hasAi: true,
};

export function getPlanEntitlements(plan?: string | null, isAdmin?: boolean): PlanEntitlements {
  if (isAdmin) return ADMIN_ENTITLEMENTS;
  const normalized = (plan || "FREE").toUpperCase();
  return CLIENT_PLAN_LIMITS[normalized] ?? CLIENT_PLAN_LIMITS.FREE;
}
