import { BaseService } from "@core/base.service";
import { AppError, ConflictError, NotFoundError, ValidationError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import type { DpdpConsentStatus, DpdpPolicyStatus, Prisma } from "@prisma/client";
import type {
  CreatePolicyInput,
  CreatePolicyVersionInput,
  GrantConsentInput,
  ListAdminConsentsQuery,
  ListDpdpAuditLogsQuery,
  ListPoliciesQuery,
  ListUserConsentHistoryQuery,
  UpdatePolicyInput,
} from "./dpdp.schema";

const log = logger.child("DpdpService");

const VALID_POLICY_TRANSITIONS: Record<string, DpdpPolicyStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

export class DpdpService extends BaseService {
  private async logDpdpAudit(data: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    try {
      await prisma.dpdpAuditLog.create({ data });
    } catch (error) {
      log.error("Failed to write DPDP audit log:", error);
    }
  }

  async createPolicy(input: CreatePolicyInput, actorId: string, ipAddress?: string) {
    try {
      const existing = await prisma.dpdpPolicy.findUnique({ where: { key: input.key } });
      if (existing) {
        throw new ConflictError(`A policy with key "${input.key}" already exists`);
      }

      const policy = await prisma.dpdpPolicy.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description,
          status: "DRAFT",
          createdBy: actorId,
          versions: {
            create: {
              version: 1,
              purpose: input.purpose,
              dataCategories: input.dataCategories,
              processingDescription: input.processingDescription,
              retentionPeriod: input.retentionPeriod,
              consentRequired: input.consentRequired,
              content: input.content,
              status: "DRAFT",
              effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
              effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
              createdBy: actorId,
            },
          },
        },
        include: {
          versions: true,
        },
      });

      await this.logDpdpAudit({
        actorId,
        action: "POLICY_CREATED",
        entityType: "DpdpPolicy",
        entityId: policy.id,
        metadata: { key: input.key, name: input.name },
        ipAddress,
      });

      return policy;
    } catch (error) {
      this.handleError(error, "Failed to create policy");
    }
  }

  async getPolicy(id: string) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", id);
      }

      return policy;
    } catch (error) {
      this.handleError(error, "Failed to get policy");
    }
  }

  async listPolicies(query: ListPoliciesQuery) {
    try {
      const where: Prisma.DpdpPolicyWhereInput = {
        AND: [
          {
            OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
          },
        ],
      };

      if (query.status) {
        where.status = query.status as DpdpPolicyStatus;
      }

      if (query.search) {
        (where.AND as Prisma.DpdpPolicyWhereInput[]).push({
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { key: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        });
      }

      return await this.paginate(
        prisma.dpdpPolicy,
        { page: query.page, limit: query.limit },
        {
          where,
          include: {
            versions: {
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list policies");
    }
  }

  async updatePolicy(id: string, input: UpdatePolicyInput, actorId: string, ipAddress?: string) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({ where: { id } });
      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", id);
      }

      const updated = await prisma.dpdpPolicy.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      await this.logDpdpAudit({
        actorId,
        action: "POLICY_UPDATED",
        entityType: "DpdpPolicy",
        entityId: id,
        metadata: { changes: input },
        ipAddress,
      });

      return updated;
    } catch (error) {
      this.handleError(error, "Failed to update policy");
    }
  }

  async createVersion(
    policyId: string,
    input: CreatePolicyVersionInput,
    actorId: string,
    ipAddress?: string
  ) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({
        where: { id: policyId },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", policyId);
      }

      const latestVersion = policy.versions[0];
      if (latestVersion && latestVersion.status === "DRAFT") {
        throw new ConflictError(
          "Cannot create a new version while the latest version is still in DRAFT. Publish or delete the current draft first."
        );
      }

      const nextVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

      const version = await prisma.dpdpPolicyVersion.create({
        data: {
          policyId,
          version: nextVersionNumber,
          purpose: input.purpose,
          dataCategories: input.dataCategories,
          processingDescription: input.processingDescription,
          retentionPeriod: input.retentionPeriod,
          consentRequired: input.consentRequired,
          content: input.content,
          status: "DRAFT",
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
          effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
          createdBy: actorId,
        },
      });

      await prisma.dpdpPolicy.update({
        where: { id: policyId },
        data: { status: "DRAFT" },
      });

      await this.logDpdpAudit({
        actorId,
        action: "POLICY_VERSION_CREATED",
        entityType: "DpdpPolicyVersion",
        entityId: version.id,
        metadata: { policyId, version: nextVersionNumber },
        ipAddress,
      });

      return version;
    } catch (error) {
      this.handleError(error, "Failed to create policy version");
    }
  }

  async publishVersion(policyId: string, actorId: string, ipAddress?: string) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({
        where: { id: policyId },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", policyId);
      }

      const latestVersion = policy.versions[0];
      if (!latestVersion) {
        throw new AppError("No versions exist for this policy", 400, "NO_VERSION");
      }

      if (latestVersion.status !== "DRAFT") {
        throw new AppError(
          `Cannot publish: version ${latestVersion.version} is in ${latestVersion.status} state. Only DRAFT versions can be published.`,
          400,
          "INVALID_STATE_TRANSITION"
        );
      }

      const now = new Date();

      await prisma.dpdpPolicyVersion.updateMany({
        where: {
          policyId,
          status: "PUBLISHED",
          id: { not: latestVersion.id },
        },
        data: { status: "ARCHIVED" },
      });

      const published = await prisma.dpdpPolicyVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: "PUBLISHED",
          publishedAt: now,
          effectiveFrom: latestVersion.effectiveFrom ?? now,
        },
      });

      await prisma.dpdpPolicy.update({
        where: { id: policyId },
        data: { status: "PUBLISHED" },
      });

      await this.logDpdpAudit({
        actorId,
        action: "POLICY_PUBLISHED",
        entityType: "DpdpPolicyVersion",
        entityId: published.id,
        metadata: { policyId, version: published.version },
        ipAddress,
      });

      return published;
    } catch (error) {
      this.handleError(error, "Failed to publish policy version");
    }
  }

  async archivePolicy(policyId: string, actorId: string, ipAddress?: string) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({ where: { id: policyId } });
      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", policyId);
      }

      if (policy.status === "ARCHIVED") {
        throw new AppError("Policy is already archived", 400, "ALREADY_ARCHIVED");
      }

      if (policy.status === "DRAFT") {
        throw new AppError(
          "Cannot archive a DRAFT policy. Publish it first or delete it.",
          400,
          "INVALID_STATE_TRANSITION"
        );
      }

      await prisma.dpdpPolicyVersion.updateMany({
        where: { policyId, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });

      const archived = await prisma.dpdpPolicy.update({
        where: { id: policyId },
        data: { status: "ARCHIVED" },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      await this.logDpdpAudit({
        actorId,
        action: "POLICY_ARCHIVED",
        entityType: "DpdpPolicy",
        entityId: policyId,
        metadata: { name: policy.name },
        ipAddress,
      });

      return archived;
    } catch (error) {
      this.handleError(error, "Failed to archive policy");
    }
  }

  async deletePolicy(policyId: string, actorId: string, ipAddress?: string) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({ where: { id: policyId } });
      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", policyId);
      }

      const consentCount = await prisma.dpdpConsentEvent.count({
        where: { policyId },
      });

      if (consentCount > 0) {
        throw new AppError(
          `Cannot delete policy: ${consentCount} consent record(s) reference this policy. Archive it instead to preserve audit history.`,
          400,
          "CONSENT_REFERENCES_EXIST"
        );
      }

      const deleted = await prisma.dpdpPolicy.update({
        where: { id: policyId },
        data: { deletedAt: new Date() },
      });

      await this.logDpdpAudit({
        actorId,
        action: "POLICY_DELETED",
        entityType: "DpdpPolicy",
        entityId: policyId,
        metadata: { name: policy.name, key: policy.key },
        ipAddress,
      });

      return deleted;
    } catch (error) {
      this.handleError(error, "Failed to delete policy");
    }
  }

  async getPolicyVersions(policyId: string) {
    try {
      const policy = await prisma.dpdpPolicy.findUnique({
        where: { id: policyId },
        include: { versions: { orderBy: { version: "desc" } } },
      });
      if (!policy || policy.deletedAt) {
        throw new NotFoundError("Policy", policyId);
      }

      const { versions, ...policyData } = policy;
      return { policy: policyData, versions };
    } catch (error) {
      this.handleError(error, "Failed to get policy versions");
    }
  }

  async getActivePublishedPolicies() {
    try {
      const policies = await prisma.dpdpPolicy.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        },
        include: {
          versions: {
            where: { status: "PUBLISHED" },
            orderBy: { version: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      });

      return policies.filter((p) => p.versions.length > 0);
    } catch (error) {
      this.handleError(error, "Failed to get active policies");
    }
  }

  async grantOrRejectConsent(
    userId: string,
    input: GrantConsentInput,
    meta: { ipAddress?: string; userAgent?: string }
  ) {
    try {
      const policyVersion = await prisma.dpdpPolicyVersion.findUnique({
        where: { id: input.policyVersionId },
        include: { policy: true },
      });

      if (!policyVersion) {
        throw new NotFoundError("Policy version", input.policyVersionId);
      }

      if (policyVersion.policyId !== input.policyId) {
        throw new ValidationError("Policy version does not belong to the specified policy");
      }

      if (policyVersion.status !== "PUBLISHED") {
        throw new AppError(
          "Cannot consent to an unpublished policy version",
          400,
          "VERSION_NOT_PUBLISHED"
        );
      }

      if (!policyVersion.consentRequired && input.status === "REJECTED") {
        throw new AppError(
          "This processing is required for essential service operation and cannot be rejected",
          400,
          "ESSENTIAL_PROCESSING"
        );
      }

      const event = await prisma.dpdpConsentEvent.create({
        data: {
          userId,
          policyId: input.policyId,
          policyVersionId: input.policyVersionId,
          purpose: policyVersion.purpose,
          status: input.status as DpdpConsentStatus,
          consentMethod: input.consentMethod,
          source: input.source,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      await this.logDpdpAudit({
        actorId: userId,
        action: input.status === "GRANTED" ? "CONSENT_GRANTED" : "CONSENT_REJECTED",
        entityType: "DpdpConsentEvent",
        entityId: event.id,
        metadata: {
          policyId: input.policyId,
          policyKey: policyVersion.policy.key,
          policyVersion: policyVersion.version,
          status: input.status,
        },
        ipAddress: meta.ipAddress,
      });

      return event;
    } catch (error) {
      this.handleError(error, "Failed to record consent");
    }
  }

  async withdrawConsent(
    userId: string,
    policyId: string,
    meta: { ipAddress?: string; userAgent?: string }
  ) {
    try {
      const latestEvent = await prisma.dpdpConsentEvent.findFirst({
        where: { userId, policyId },
        orderBy: { createdAt: "desc" },
        include: {
          policyVersion: { include: { policy: true } },
        },
      });

      if (!latestEvent) {
        throw new NotFoundError("Consent record");
      }

      if (latestEvent.status === "WITHDRAWN") {
        throw new AppError("Consent has already been withdrawn", 400, "ALREADY_WITHDRAWN");
      }

      if (latestEvent.status === "REJECTED") {
        throw new AppError("Cannot withdraw a rejected consent", 400, "NOT_GRANTED");
      }

      if (latestEvent.status === "PENDING") {
        throw new AppError("No active consent to withdraw", 400, "NO_ACTIVE_CONSENT");
      }

      if (!latestEvent.policyVersion.consentRequired) {
        throw new AppError(
          "Cannot withdraw consent for essential service processing",
          400,
          "ESSENTIAL_PROCESSING"
        );
      }

      const event = await prisma.dpdpConsentEvent.create({
        data: {
          userId,
          policyId,
          policyVersionId: latestEvent.policyVersionId,
          purpose: latestEvent.purpose,
          status: "WITHDRAWN",
          consentMethod: "web_form",
          source: "consent_center",
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      await this.logDpdpAudit({
        actorId: userId,
        action: "CONSENT_WITHDRAWN",
        entityType: "DpdpConsentEvent",
        entityId: event.id,
        metadata: {
          policyId,
          policyKey: latestEvent.policyVersion.policy.key,
          policyVersion: latestEvent.policyVersion.version,
        },
        ipAddress: meta.ipAddress,
      });

      return event;
    } catch (error) {
      this.handleError(error, "Failed to withdraw consent");
    }
  }

  async getUserCurrentConsents(userId: string) {
    try {
      const [policies, consentEvents] = await Promise.all([
        prisma.dpdpPolicy.findMany({
          where: {
            AND: [
              { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
              { OR: [{ status: "PUBLISHED" }, { consentEvents: { some: { userId } } }] },
            ],
          },
          include: {
            versions: {
              where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        }),
        prisma.dpdpConsentEvent.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const latestConsentByPolicy = new Map<string, (typeof consentEvents)[0]>();
      for (const event of consentEvents) {
        if (!latestConsentByPolicy.has(event.policyId)) {
          latestConsentByPolicy.set(event.policyId, event);
        }
      }

      const result: Record<
        string,
        {
          policyId: string;
          policyName: string;
          policyKey: string;
          status: string;
          policyVersion: number | null;
          consentRequired: boolean;
          consentedAt: string | null;
          withdrawnAt: string | null;
          purpose: string | null;
        }
      > = {};

      for (const policy of policies) {
        const latestVersion = policy.versions[0];
        const consentEvent = latestConsentByPolicy.get(policy.id);

        result[policy.key] = {
          policyId: policy.id,
          policyName: policy.name,
          policyKey: policy.key,
          status: consentEvent?.status ?? "PENDING",
          policyVersion: latestVersion?.version ?? null,
          consentRequired: latestVersion ? !latestVersion.consentRequired : false,
          consentedAt:
            consentEvent?.status === "GRANTED" ? consentEvent.createdAt.toISOString() : null,
          withdrawnAt:
            consentEvent?.status === "WITHDRAWN" ? consentEvent.createdAt.toISOString() : null,
          purpose: latestVersion?.purpose ?? null,
        };
      }

      return result;
    } catch (error) {
      this.handleError(error, "Failed to get user consents");
    }
  }

  async getUserConsentHistory(userId: string, query: ListUserConsentHistoryQuery) {
    try {
      const where: Prisma.DpdpConsentEventWhereInput = { userId };

      if (query.status) where.status = query.status as DpdpConsentStatus;
      if (query.from || query.to) {
        where.createdAt = {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        };
      }
      if (query.search) {
        where.policy = {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { key: { contains: query.search, mode: "insensitive" } },
          ],
        };
      }

      return await this.paginate(
        prisma.dpdpConsentEvent,
        { page: query.page, limit: query.limit },
        {
          where,
          include: {
            policy: { select: { id: true, key: true, name: true } },
            policyVersion: { select: { id: true, version: true, purpose: true } },
          },
          orderBy: { createdAt: "desc" },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to get consent history");
    }
  }

  async getAdminConsentsByUser(userId: string) {
    try {
      const [user, events] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true },
        }),
        prisma.dpdpConsentEvent.findMany({
          where: { userId },
          include: {
            policy: { select: { id: true, key: true, name: true } },
            policyVersion: { select: { id: true, version: true, purpose: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      if (!user) {
        throw new NotFoundError("User", userId);
      }

      return { user, events };
    } catch (error) {
      this.handleError(error, "Failed to get admin consents for user");
    }
  }

  async searchAdminConsents(query: ListAdminConsentsQuery) {
    try {
      const where: Prisma.DpdpConsentEventWhereInput = {};

      if (query.userId) where.userId = query.userId;
      if (query.policyId) where.policyId = query.policyId;
      if (query.status) where.status = query.status as DpdpConsentStatus;

      if (query.from || query.to) {
        where.createdAt = {};
        if (query.from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(query.from);
        if (query.to) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(query.to);
      }

      if (query.search) {
        where.user = {
          OR: [
            { email: { contains: query.search, mode: "insensitive" } },
            { name: { contains: query.search, mode: "insensitive" } },
          ],
        };
      }

      return await this.paginate(
        prisma.dpdpConsentEvent,
        { page: query.page, limit: query.limit },
        {
          where,
          include: {
            user: { select: { id: true, email: true, name: true } },
            policy: { select: { id: true, key: true, name: true } },
            policyVersion: { select: { id: true, version: true, purpose: true } },
          },
          orderBy: { createdAt: "desc" },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to search consent events");
    }
  }

  async listDpdpAuditLogs(query: ListDpdpAuditLogsQuery) {
    try {
      const where: Prisma.DpdpAuditLogWhereInput = {};

      if (query.action) where.action = query.action;
      if (query.entityType) where.entityType = query.entityType;
      if (query.entityId) where.entityId = query.entityId;
      if (query.actorId) where.actorId = query.actorId;

      return await this.paginate(
        prisma.dpdpAuditLog,
        { page: query.page, limit: query.limit },
        {
          where,
          orderBy: { createdAt: "desc" },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list DPDP audit logs");
    }
  }
}

export const dpdpService = new DpdpService();
