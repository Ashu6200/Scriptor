import "server-only";
import { prisma } from "@infra/db";
import type { SubscriptionPlan } from "@prisma/client";
import { AppError } from "./errors";

export interface PlanEntitlements {
  maxWorkSpace: number;
  maxDocuments: number;
  versionHistoryDays: number;
  hasAuditLogs: boolean;
  hasTrash: boolean;
  hasMermaid: boolean;
  hasAi: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanEntitlements> = {
  FREE: {
    maxWorkSpace: 1,
    maxDocuments: 30,
    versionHistoryDays: 7,
    hasAuditLogs: false,
    hasTrash: false,
    hasMermaid: false,
    hasAi: false,
  },
  PRO: {
    maxWorkSpace: 5,
    maxDocuments: Number.POSITIVE_INFINITY,
    versionHistoryDays: 90,
    hasAuditLogs: true,
    hasTrash: true,
    hasMermaid: true,
    hasAi: false,
  },
  MAX: {
    maxWorkSpace: Number.POSITIVE_INFINITY,
    maxDocuments: Number.POSITIVE_INFINITY,
    versionHistoryDays: 365,
    hasAuditLogs: true,
    hasTrash: true,
    hasMermaid: true,
    hasAi: true,
  },
};

export function getEntitlements(plan: SubscriptionPlan): PlanEntitlements {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function assertEntitlement(
  plan: SubscriptionPlan,
  key: keyof PlanEntitlements,
  featureLabel?: string,
  isAdmin?: boolean
): void {
  if (isAdmin) return;

  const limits = getEntitlements(plan);
  const value = limits[key];

  if (typeof value === "boolean" && !value) {
    const label = featureLabel ?? key.replace(/^has/, "");
    throw new AppError(
      `${label} is not available on the ${plan} plan. Please upgrade to unlock this feature.`,
      402,
      "PLAN_LIMIT_EXCEEDED"
    );
  }
}

export async function assertCanCreateDocument(userId: string, workspaceId?: string): Promise<void> {
  let targetOwnerId = userId;
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });
    if (ws?.ownerId) {
      targetOwnerId = ws.ownerId;
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: targetOwnerId },
    select: { subscriptionPlan: true, platformRole: true },
  });

  if (!user) return;
  if (user.platformRole === "ADMIN") return;

  const limits = getEntitlements(user.subscriptionPlan);

  if (limits.maxDocuments === Number.POSITIVE_INFINITY) return;

  const currentDocs = await prisma.document.count({
    where: {
      workspace: { ownerId: targetOwnerId },
      OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
    },
  });

  if (currentDocs >= limits.maxDocuments) {
    throw new AppError(
      `You have reached the ${limits.maxDocuments} document limit on the ${user.subscriptionPlan} plan. Please upgrade to Pro for unlimited documents.`,
      402,
      "PLAN_LIMIT_EXCEEDED"
    );
  }
}

export async function assertCanCreateWorkspace(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true, platformRole: true },
  });

  if (!user) return;
  if (user.platformRole === "ADMIN") return;

  const limits = getEntitlements(user.subscriptionPlan);

  if (limits.maxWorkSpace === Number.POSITIVE_INFINITY) return;

  const currentWorkspaces = await prisma.workspace.count({
    where: { ownerId: userId },
  });

  if (currentWorkspaces >= limits.maxWorkSpace) {
    throw new AppError(
      `You have reached the ${limits.maxWorkSpace} workspace limit on the ${user.subscriptionPlan} plan. Please upgrade to create more workspaces.`,
      402,
      "PLAN_LIMIT_EXCEEDED"
    );
  }
}
