import crypto from "node:crypto";
import { BaseService } from "@core/base.service";
import { IdempotencyConflictError } from "@core/errors";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import type { Prisma } from "@prisma/client";

const log = logger.child("IdempotencyService");

export interface IdempotencyCheckResult<T = unknown> {
  isDuplicate: boolean;
  cachedResponse?: {
    statusCode: number;
    body: T;
  };
}

export class IdempotencyService extends BaseService {
  private generateRequestHash(path: string, body: unknown): string {
    const raw = JSON.stringify({ path, body });
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  async checkKey<T>(key: string, path: string, body: unknown): Promise<IdempotencyCheckResult<T>> {
    try {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { key },
      });

      if (!existing) {
        return { isDuplicate: false };
      }

      if (existing.expiresAt < new Date()) {
        await prisma.idempotencyRecord.delete({ where: { key } }).catch(() => {});
        return { isDuplicate: false };
      }

      const currentHash = this.generateRequestHash(path, body);
      if (existing.requestHash !== currentHash) {
        log.warn(`Idempotency key payload mismatch for key: ${key}`);
        throw new IdempotencyConflictError(key);
      }

      log.info(`Returning cached idempotent response for key: ${key}`);
      return {
        isDuplicate: true,
        cachedResponse: {
          statusCode: existing.responseCode,
          body: existing.responseBody as T,
        },
      };
    } catch (error) {
      this.handleError(error, "Failed to check idempotency key");
    }
  }

  async saveResponse(
    key: string,
    path: string,
    body: unknown,
    statusCode: number,
    responseBody: unknown,
    ttlHours = 24
  ): Promise<void> {
    try {
      const requestHash = this.generateRequestHash(path, body);
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

      await prisma.idempotencyRecord.upsert({
        where: { key },
        create: {
          key,
          path,
          requestHash,
          responseCode: statusCode,
          responseBody: responseBody as Prisma.InputJsonValue,
          expiresAt,
        },
        update: {
          responseCode: statusCode,
          responseBody: responseBody as Prisma.InputJsonValue,
          expiresAt,
        },
      });

      log.info(`Saved idempotency record for key: ${key}`);
    } catch (error) {
      log.error(`Failed to save idempotency record for key ${key}:`, error);
    }
  }
}
