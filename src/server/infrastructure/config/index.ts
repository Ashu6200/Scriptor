import "server-only";
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  UPSTASH_REDIS_REST_URL: z.string().min(1, "UPSTASH_REDIS_REST_URL is required"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  RAZORPAY_PLAN_ID_PRO: z.string().optional(),
  RAZORPAY_PLAN_ID_MAX: z.string().optional(),
  REQUIRE_EMAIL_VERIFICATION: z.string().optional(),
  RATE_LIMIT_BYPASS_IPS: z.string().optional(),
  ENABLE_FILE_LOGGING: z.string().optional(),
  LOG_TO_FILE: z.string().optional(),
  ENABLE_LOGGING: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  REDIS_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  REDIS_RETRY_DELAY_MS: z.coerce.number().int().min(10).max(10000).default(50),
  REDIS_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(5000),
});

export type AppConfig = z.infer<typeof configSchema>;

let cached: AppConfig | null = null;

function loadConfig(): AppConfig {
  if (cached) return cached;

  const parsed = configSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  cached = parsed.data;
  return cached;
}

export const config = new Proxy({} as AppConfig, {
  get(_target, prop: string) {
    return loadConfig()[prop as keyof AppConfig];
  },
  has(_target, prop: string) {
    return prop in loadConfig();
  },
  ownKeys() {
    return Reflect.ownKeys(loadConfig());
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return Object.getOwnPropertyDescriptor(loadConfig(), prop);
  },
});
