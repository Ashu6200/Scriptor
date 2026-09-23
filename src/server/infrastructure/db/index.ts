import "server-only";
import { logger } from "@infra/logger";
import { PrismaClient } from "@prisma/client";

const log = logger.child("Prisma");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
  });
  if (process.env.NODE_ENV === "development") {
    (client as any).$on("query", (e: { duration: number; query: string }) => {
      if (e.duration > 100) {
        log.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }

  return client;
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
