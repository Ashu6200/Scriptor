import crypto from "node:crypto";
import { BaseService } from "@core/base.service";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import type { AuditAction, Prisma } from "@prisma/client";
import type { ListAuditLogsQuery } from "./audit.schema";

const log = logger.child("AuditService");

export const GENESIS_PREVIOUS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

export interface AuditBlockIntegrity {
  algorithm: "SHA-256-CHAIN";
  sequence: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  payloadChecksum: string;
}

export interface VerificationResult {
  valid: boolean;
  totalLogs: number;
  verifiedCount: number;
  latestHash?: string;
  genesisHash?: string;
  compromisedAtId?: string;
  compromisedSequence?: number;
  error?: string;
}

export function computeBlockChecksum(details: unknown): string {
  if (!details) return "EMPTY_PAYLOAD";
  let cleanDetails: unknown = details;
  if (typeof details === "object" && details !== null && "_integrity" in details) {
    const { _integrity, ...rest } = details as Record<string, unknown>;
    cleanDetails = rest;
  }
  return crypto.createHash("sha256").update(JSON.stringify(cleanDetails)).digest("hex");
}

export function computeBlockHash(params: {
  sequence: number;
  previousHash: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  workspaceId: string;
  payloadChecksum: string;
}): string {
  const serialized = [
    params.sequence,
    params.previousHash,
    params.timestamp,
    params.action,
    params.resourceType,
    params.resourceId,
    params.actorId,
    params.workspaceId,
    params.payloadChecksum,
  ].join("::");
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export class AuditService extends BaseService {
  async listLogs(workspaceId: string, query: ListAuditLogsQuery) {
    try {
      const where: Prisma.AuditLogWhereInput = { workspaceId };
      if (query.action) where.action = query.action as AuditAction;
      if (query.actorId) where.actorId = query.actorId;
      if (query.resourceType) where.resourceType = query.resourceType;
      if (query.resourceId) where.resourceId = query.resourceId;

      return await this.paginate(
        prisma.auditLog,
        { page: query.page, limit: query.limit },
        {
          where,
          include: {
            actor: { select: { id: true, name: true, email: true } },
          },
        }
      );
    } catch (error) {
      this.handleError(error, "Failed to list audit logs");
    }
  }

  async logAction(data: {
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    details?: Prisma.InputJsonValue;
    actorId: string;
    workspaceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const lastLog = await prisma.auditLog.findFirst({
        where: data.workspaceId ? { workspaceId: data.workspaceId } : {},
        orderBy: { createdAt: "desc" },
        select: { details: true, id: true },
      });

      const lastIntegrity = (lastLog?.details as { _integrity?: AuditBlockIntegrity } | null)
        ?._integrity;
      const sequence = (lastIntegrity?.sequence ?? 0) + 1;
      const previousHash = lastIntegrity?.hash ?? GENESIS_PREVIOUS_HASH;
      const timestamp = new Date().toISOString();
      const payloadChecksum = computeBlockChecksum(data.details);

      const hash = computeBlockHash({
        sequence,
        previousHash,
        timestamp,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || "",
        actorId: data.actorId,
        workspaceId: data.workspaceId || "",
        payloadChecksum,
      });

      const integrity: AuditBlockIntegrity = {
        algorithm: "SHA-256-CHAIN",
        sequence,
        hash,
        previousHash,
        timestamp,
        payloadChecksum,
      };

      const userDetails =
        typeof data.details === "object" && data.details !== null
          ? (data.details as Record<string, unknown>)
          : data.details !== undefined
            ? { value: data.details }
            : {};

      const detailsWithIntegrity: Prisma.InputJsonValue = {
        ...userDetails,
        _integrity: integrity as unknown as Prisma.InputJsonValue,
      };

      return await prisma.auditLog.create({
        data: {
          ...data,
          details: detailsWithIntegrity,
        },
      });
    } catch (error) {
      log.error("Failed to log audit action:", error);
    }
  }

  async verifyChain(workspaceId: string): Promise<VerificationResult> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          actorId: true,
          workspaceId: true,
          details: true,
        },
      });

      if (logs.length === 0) {
        return {
          valid: true,
          totalLogs: 0,
          verifiedCount: 0,
        };
      }

      let expectedPreviousHash = GENESIS_PREVIOUS_HASH;
      let verifiedCount = 0;
      let genesisHash = "";

      for (const record of logs) {
        const integrity = (record.details as { _integrity?: AuditBlockIntegrity } | null)
          ?._integrity;

        if (!integrity) {
          continue;
        }

        if (!genesisHash) {
          genesisHash = integrity.hash;
        }

        // 1. Verify cryptographic hash chain link
        if (integrity.previousHash !== expectedPreviousHash) {
          return {
            valid: false,
            totalLogs: logs.length,
            verifiedCount,
            compromisedAtId: record.id,
            compromisedSequence: integrity.sequence,
            error: `Chain broken at block #${integrity.sequence}. Expected previous hash "${expectedPreviousHash}" but found "${integrity.previousHash}".`,
          };
        }

        // 2. Verify payload checksum
        const actualChecksum = computeBlockChecksum(record.details as Prisma.InputJsonValue);
        if (actualChecksum !== integrity.payloadChecksum) {
          return {
            valid: false,
            totalLogs: logs.length,
            verifiedCount,
            compromisedAtId: record.id,
            compromisedSequence: integrity.sequence,
            error: `Payload tamper detected at block #${integrity.sequence}. Checksum mismatch.`,
          };
        }

        // 3. Recompute block hash
        const recomputedHash = computeBlockHash({
          sequence: integrity.sequence,
          previousHash: integrity.previousHash,
          timestamp: integrity.timestamp,
          action: record.action,
          resourceType: record.resourceType,
          resourceId: record.resourceId || "",
          actorId: record.actorId,
          workspaceId: record.workspaceId || "",
          payloadChecksum: integrity.payloadChecksum,
        });

        if (recomputedHash !== integrity.hash) {
          return {
            valid: false,
            totalLogs: logs.length,
            verifiedCount,
            compromisedAtId: record.id,
            compromisedSequence: integrity.sequence,
            error: `Cryptographic hash mismatch at block #${integrity.sequence}. Block contents have been altered.`,
          };
        }

        expectedPreviousHash = integrity.hash;
        verifiedCount++;
      }

      return {
        valid: true,
        totalLogs: logs.length,
        verifiedCount,
        genesisHash,
        latestHash: expectedPreviousHash,
      };
    } catch (error) {
      log.error("Audit chain verification failed:", error);
      return {
        valid: false,
        totalLogs: 0,
        verifiedCount: 0,
        error: "Verification failed due to internal error.",
      };
    }
  }
}

export const auditService = new AuditService();
