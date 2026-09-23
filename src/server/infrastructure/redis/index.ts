import "server-only";
import { config } from "@infra/config";
import { logger } from "@infra/logger";
import { Redis } from "@upstash/redis";

const log = logger.child("Redis");
const REDIS_KEY = Symbol.for("app.redis.client");

function buildRedis(): Redis {
  const maxRetries = config.REDIS_MAX_RETRIES ?? 3;
  const baseDelay = config.REDIS_RETRY_DELAY_MS ?? 50;
  const timeoutMs = config.REDIS_TIMEOUT_MS ?? 5000;
  const maxDelayLimit = 2000;

  log.info(
    `Initializing Upstash Redis client (retries=${maxRetries}, baseDelay=${baseDelay}ms, timeout=${timeoutMs}ms)`
  );

  return new Redis({
    url: config.UPSTASH_REDIS_REST_URL,
    token: config.UPSTASH_REDIS_REST_TOKEN,
    automaticDeserialization: false,
    retry: {
      retries: maxRetries,
      backoff: (retryCount: number) => {
        const exp = Math.min(maxDelayLimit, baseDelay * 2 ** retryCount);
        const jitter = Math.floor(Math.random() * 50);
        return exp + jitter;
      },
    },
    signal: () => {
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(timeoutMs);
      }
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort(new Error(`Redis request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      timer.unref?.();
      return controller.signal;
    },
  });
}

function getRedis(): Redis {
  const g = globalThis as unknown as Record<symbol, Redis | undefined>;
  if (!g[REDIS_KEY]) {
    g[REDIS_KEY] = buildRedis();
  }
  return g[REDIS_KEY]!;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  operationName?: string;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Execute an arbitrary Redis operation with exponential backoff retry logic and limits.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? config.REDIS_MAX_RETRIES ?? 3;
  const initialDelay = options.initialDelayMs ?? config.REDIS_RETRY_DELAY_MS ?? 50;
  const maxDelay = options.maxDelayMs ?? 2000;
  const opName = options.operationName ?? "Redis operation";

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries) {
        break;
      }
      if (options.shouldRetry && !options.shouldRetry(err)) {
        throw err;
      }
      const delay =
        Math.min(maxDelay, initialDelay * 2 ** attempt) + Math.floor(Math.random() * 50);
      log.warn(
        `⚠️ ${opName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
        err
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Ping Redis with retry logic, mirroring database connection verification.
 */
export async function pingWithRetry(
  maxRetries = config.REDIS_MAX_RETRIES ?? 3,
  retryDelayMs = 1000
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.info(`Connecting to Redis (attempt ${attempt}/${maxRetries})...`);
      await redis.ping();
      log.info(`✅ Redis connected successfully (attempt ${attempt}/${maxRetries})`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(`Redis connection attempt ${attempt}/${maxRetries} failed:`, message);

      if (attempt === maxRetries) {
        throw err;
      }

      log.info(`⏳ Retrying in ${retryDelayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

/**
 * Production-grade atomic rate limiter with TTL enforcement, retry logic, and fail-open resilience.
 */
export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitConfig): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const resetAt = Math.ceil((now + windowMs) / 1000);

  try {
    return await withRetry(
      async () => {
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, windowSeconds, "NX");
        pipeline.ttl(key);

        const results = await pipeline.exec<[number, 0 | 1, number]>();
        const count = typeof results[0] === "number" ? results[0] : Number(results[0]) || 1;
        const ttl = typeof results[2] === "number" && results[2] > 0 ? results[2] : windowSeconds;

        if (typeof results[2] === "number" && results[2] < 0) {
          await redis.expire(key, windowSeconds).catch(() => {});
        }

        const remaining = Math.max(0, limit - count);
        const success = count <= limit;
        const retryAfter = success ? 0 : ttl;

        return {
          success,
          limit,
          remaining,
          reset: Math.ceil(now / 1000) + ttl,
          retryAfter,
        };
      },
      {
        maxRetries: 2,
        operationName: `Rate limit check (${key})`,
      }
    );
  } catch (error) {
    log.warn("Rate limit check failed after retries, allowing request as fallback:", error);
    return {
      success: true,
      limit,
      remaining: 1,
      reset: resetAt,
      retryAfter: 0,
    };
  }
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis();
    if (prop === "set") {
      return (key: string, value: unknown, ...args: unknown[]) => {
        if (args.length >= 2 && typeof args[0] === "string" && args[0].toUpperCase() === "EX") {
          return client.set(key, value, { ex: Number(args[1]) });
        }
        if (args.length >= 2 && typeof args[0] === "string" && args[0].toUpperCase() === "PX") {
          return client.set(key, value, { px: Number(args[1]) });
        }
        return (client.set as (...params: unknown[]) => unknown)(key, value, ...args);
      };
    }
    const value = client[prop as keyof Redis];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
