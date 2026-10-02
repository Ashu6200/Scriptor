import "server-only";
import { logger } from "@infra/logger";
import { PrismaClient } from "@prisma/client";

const log = logger.child("Prisma");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Operations that are safe to retry (read-only)
const RETRYABLE_OPERATIONS = new Set([
  "findUnique",
  "findFirst",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "findUniqueOrThrow",
  "findFirstOrThrow",
]);

// Prisma error codes that indicate transient/retryable failures
const TRANSIENT_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timeout
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
  "P2024", // Connection pool timeout
]);

function isTransientError(error: unknown): boolean {
  const prismaError = error as { code?: string; message?: string };
  if (prismaError.code && TRANSIENT_ERROR_CODES.has(prismaError.code)) {
    return true;
  }
  const msg = prismaError.message ?? "";
  return (
    msg.includes("timed out") ||
    msg.includes("Connection pool") ||
    msg.includes("I/O error") ||
    msg.includes("Server closed the connection")
  );
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
    transactionOptions: {
      maxWait: 15000,
      timeout: 30000,
    },
  });

  if (process.env.NODE_ENV === "development") {
    (client as any).$on("query", (e: { duration: number; query: string }) => {
      if (e.duration > 100) {
        log.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500;

  const clientWithRetry = client.$extends({
    query: {
      async $allOperations({
        args,
        query,
        operation,
      }: {
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
        operation: string;
      }) {
        // Only retry read operations — mutations are not idempotent
        if (!RETRYABLE_OPERATIONS.has(operation)) {
          return query(args);
        }

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            return await query(args);
          } catch (error: unknown) {
            if (isTransientError(error) && attempt < MAX_RETRIES) {
              const delay = RETRY_DELAY_MS * attempt;
              log.warn(
                `Transient DB error on ${operation} (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw error;
          }
        }
        throw new Error("Max retries reached");
      },
    },
  });

  // Eagerly connect to avoid cold-start penalty on first query
  void client.$connect().catch((err) => {
    log.error("Eager DB connect failed (will lazy-connect on first query):", err);
  });

  return clientWithRetry as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectWithRetry(maxRetries = 3, retryDelayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.info(`Connecting to DB (attempt ${attempt}/${maxRetries})...`);
      await prisma.$connect();
      log.info(`✅ Prisma connected successfully (attempt ${attempt}/${maxRetries})`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(`DB connection attempt ${attempt}/${maxRetries} failed:`, message);

      if (attempt === maxRetries) {
        throw err;
      }

      log.info(`⏳ Retrying in ${retryDelayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}
