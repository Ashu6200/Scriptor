import { sendEmail } from "@/lib/email";
import { resetPasswordEmail, verificationEmail } from "@/lib/email-templates";
import { config } from "@infra/config";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { redis } from "@infra/redis";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";

const log = logger.child("Auth");

function getTrustedOrigins(): string[] {
  if (config.CORS_ORIGIN) {
    return config.CORS_ORIGIN.split(",")
      .map((o: string) => o.replace(/\/$/, "").trim())
      .filter((o: string) => o.length > 0);
  }
  return ["http://localhost:3000", "http://localhost:5173"];
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mongodb" }),

  user: {
    additionalFields: {
      platformRole: {
        type: "string",
        defaultValue: "USER",
        input: false,
      },
      agreedToTermsAt: {
        type: "date",
        defaultValue: null,
        input: false,
      },
    },
  },
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL.split(",")[0].trim().replace(/\/$/, ""),
  basePath: "/api/auth",
  trustedOrigins: Array.from(
    new Set([
      ...getTrustedOrigins(),
      ...config.BETTER_AUTH_URL.split(",")
        .map((o: string) => o.trim().replace(/\/$/, ""))
        .filter((o: string) => o.length > 0),
    ])
  ),

  account: {
    fields: {
      accountId: "providerAccountId",
    },
  },

  secondaryStorage: {
    get: async (key: string) => {
      try {
        return await redis.get(`ba:${key}`);
      } catch (err) {
        log.warn(
          "Redis secondaryStorage get failed, bypassing cache:",
          err instanceof Error ? err.message : String(err)
        );
        return null;
      }
    },
    set: async (key: string, value: string, ttl?: number) => {
      try {
        if (ttl) {
          await redis.set(`ba:${key}`, value, { ex: ttl });
        } else {
          await redis.set(`ba:${key}`, value);
        }
      } catch (err) {
        log.warn(
          "Redis secondaryStorage set failed, bypassing cache:",
          err instanceof Error ? err.message : String(err)
        );
      }
    },
    delete: async (key: string) => {
      try {
        await redis.del(`ba:${key}`);
      } catch (err) {
        log.warn(
          "Redis secondaryStorage delete failed:",
          err instanceof Error ? err.message : String(err)
        );
      }
    },
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: config.REQUIRE_EMAIL_VERIFICATION === "true",
    autoSignIn: false,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Scriptor password",
        html: resetPasswordEmail(url),
      });
    },
    password: {
      hash: async (password: string) => {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(password, salt);
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        return bcrypt.compare(password, hash);
      },
    },
  },

  emailVerification: {
    sendOnSignUp: config.REQUIRE_EMAIL_VERIFICATION === "true",
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Scriptor email",
        html: verificationEmail(url),
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 86400,
    cookieCache: {
      enabled: true,
      maxAge: 3600,
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async () => {
          throw new APIError("FORBIDDEN", {
            message: "User registration is currently disabled.",
          });
        },
        after: async (user: { id: string }) => {
          await prisma.user.update({
            where: { id: user.id },
            data: { agreedToTermsAt: new Date() } as any,
          });

          // Record DPDP consent event for Terms of Service acceptance
          const tosPolicy = await prisma.dpdpPolicy.findUnique({
            where: { key: "terms-of-service" },
            include: {
              versions: {
                where: { status: "PUBLISHED" },
                orderBy: { version: "desc" },
                take: 1,
              },
            },
          });
          const tosVersion = tosPolicy?.versions[0];
          if (tosPolicy && tosVersion) {
            await prisma.dpdpConsentEvent.create({
              data: {
                userId: user.id,
                policyId: tosPolicy.id,
                policyVersionId: tosVersion.id,
                purpose: tosVersion.purpose,
                status: "GRANTED",
                consentMethod: "web_form",
                source: "signup",
              },
            });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session: { userId: string }) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { deletedAt: true },
          });

          if (user?.deletedAt) {
            throw new Error("Account has been deactivated");
          }
        },
      },
      delete: {
        before: async (session: { token: string }) => {
          try {
            await redis.del(`session:me:${session.token}`);
          } catch (err) {
            log.warn(
              "Failed to invalidate session cache:",
              err instanceof Error ? err.message : String(err)
            );
          }
        },
      },
    },
  },

  rateLimit:
    config.NODE_ENV === "production"
      ? {
          enabled: true,
          window: 60,
          max: 100,
          storage: "secondary-storage" as const,
          customRules: {
            "/sign-in/email": { window: 60, max: 10 },
            "/sign-up/email": { window: 300, max: 5 },
            "/forget-password": { window: 300, max: 3 },
          },
        }
      : { enabled: false },

  socialProviders: {},

  advanced: {
    useSecureCookies: config.NODE_ENV === "production",
    cookies: {
      sessionToken: {
        name: "scriptor_cookies",
      },
    },
    defaultCookieAttributes: {
      sameSite: config.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },
  },

  logger: {
    level: config.NODE_ENV === "production" ? "error" : "debug",
    log: (level: string, message: string, ...args: unknown[]) => {
      const prefix = `[BetterAuth] ${message}`;
      if (level === "error") log.error(prefix, ...args);
      else if (level === "warn") log.warn(prefix, ...args);
      else if (level === "debug") log.debug(prefix, ...args);
      else log.info(prefix, ...args);
    },
  },
});
