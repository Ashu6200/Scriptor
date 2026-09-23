import "server-only";
import { randomUUID } from "node:crypto";
import { assertEntitlement } from "@core/entitlements";
import type { PlanEntitlements } from "@core/entitlements";
import { AppError, ForbiddenError, UnauthorizedError } from "@core/errors";
import { auth } from "@infra/auth";
import { config } from "@infra/config";
import { prisma } from "@infra/db";
import { logger } from "@infra/logger";
import { rateLimit } from "@infra/redis";
import type { SubscriptionPlan } from "@prisma/client";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "./errors";

const log = logger.child("Http");

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  platformRole?: string;
  subscriptionPlan?: string;
}

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  byUser?: boolean;
  keyPrefix?: string;
}

export interface HandlerOptions {
  auth?: boolean;
  workspace?: boolean;
  rateLimit?: RateLimitOptions;
  platformAdmin?: boolean;
  requireEntitlement?: keyof PlanEntitlements;
}

export interface HandlerContext<P extends Record<string, string> = Record<string, string>> {
  req: NextRequest;
  params: P;
  searchParams: URLSearchParams;
  query: Record<string, string>;
  requestId: string;
  user: SessionUser;
  workspaceId: string;
}

type Handler<P extends Record<string, string>> = (
  ctx: HandlerContext<P>
) => Promise<NextResponse> | NextResponse;

interface RouteArgs<P> {
  params: Promise<P>;
}

async function enforceRateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
  userId: string | undefined,
  pathname: string
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const bypass = (config.RATE_LIMIT_BYPASS_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (bypass.includes(ip)) return null;

  const identifier = opts.byUser && userId ? userId : ip;
  const key = `rl:${opts.keyPrefix || pathname}:${identifier}`;

  const result = await rateLimit({
    key,
    limit: opts.limit,
    windowSeconds: opts.windowSeconds,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later.",
        data: null,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
          "Retry-After": String(result.retryAfter > 0 ? result.retryAfter : opts.windowSeconds),
        },
      }
    );
  }

  return null;
}

async function requireAuth(): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new UnauthorizedError("Please log in to continue");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletedAt: true, platformRole: true, subscriptionPlan: true },
  });

  if (user?.deletedAt) {
    throw new UnauthorizedError("Account has been deactivated");
  }

  return {
    ...(session.user as SessionUser),
    platformRole: user?.platformRole ?? "USER",
    subscriptionPlan: ((user as Record<string, unknown>)?.subscriptionPlan as string) ?? "FREE",
  };
}

function requirePlatformAdmin(user: SessionUser): void {
  if (user.platformRole !== "ADMIN") {
    throw new ForbiddenError("Requires Platform Administrator privileges");
  }
}

async function resolveWorkspace(
  user: SessionUser,
  workspaceId: string | undefined
): Promise<string> {
  if (!workspaceId) {
    throw new ForbiddenError("Workspace context is required");
  }

  if (workspaceId === "all") {
    return "all";
  }

  let workspace = await prisma.workspace.findFirst({
    where: {
      OR: [{ id: workspaceId }, { slug: workspaceId }],
    },
    select: { id: true, ownerId: true, suspendedAt: true },
  });

  if (!workspace) {
    workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id },
      select: { id: true, ownerId: true, suspendedAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!workspace) {
    const firstName = user.name ? user.name.split(" ")[0] : "Personal";
    const baseSlug = `ws-${user.id.slice(-6)}-${Date.now().toString(36)}`;
    workspace = await prisma.workspace.create({
      data: {
        name: `${firstName}'s Workspace`,
        slug: baseSlug,
        type: "PERSONAL",
        ownerId: user.id,
      },
      select: { id: true, ownerId: true, suspendedAt: true },
    });
  }

  if (workspace.suspendedAt) {
    throw new ForbiddenError(
      "This workspace has been suspended by a platform administrator. Please contact support."
    );
  }

  if (workspace.ownerId !== user.id && user.platformRole !== "ADMIN") {
    throw new ForbiddenError("You do not have access to this workspace");
  }

  return workspace.id;
}

export function createHandler<P extends Record<string, string> = Record<string, string>>(
  options: HandlerOptions,
  handler: Handler<P>
) {
  return async (req: NextRequest, args: RouteArgs<P>): Promise<NextResponse> => {
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    const startedAt = Date.now();
    const pathname = req.nextUrl.pathname;

    try {
      const params = ((await args?.params) ?? {}) as P;

      const needsWorkspace = !!options.workspace;
      const needsAuth =
        options.auth || needsWorkspace || !!options.platformAdmin || !!options.requireEntitlement;

      let user: SessionUser | undefined;
      if (needsAuth) {
        user = await requireAuth();
      }

      if (options.platformAdmin) {
        requirePlatformAdmin(user!);
      }

      if (options.rateLimit) {
        const limited = await enforceRateLimit(req, options.rateLimit, user?.id, pathname);
        if (limited) return limited;
      }

      let workspaceId = "";

      if (needsWorkspace) {
        workspaceId = await resolveWorkspace(user!, params.workspaceId);
      }

      if (options.requireEntitlement && user) {
        assertEntitlement(
          (user.subscriptionPlan ?? "FREE") as SubscriptionPlan,
          options.requireEntitlement,
          undefined,
          user.platformRole === "ADMIN"
        );
      }

      const searchParams = req.nextUrl.searchParams;

      const response = await handler({
        req,
        params,
        searchParams,
        query: Object.fromEntries(searchParams.entries()),
        requestId,
        user: user as SessionUser,
        workspaceId,
      });

      response.headers.set("X-Request-Id", requestId);

      log.info(`${req.method} ${pathname} ${response.status} - ${Date.now() - startedAt}ms`);

      return response;
    } catch (error) {
      const response = toErrorResponse(error, {
        method: req.method,
        url: pathname,
        requestId,
      });
      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}

export async function jsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("Invalid JSON body", 400, "INVALID_JSON");
  }
}
