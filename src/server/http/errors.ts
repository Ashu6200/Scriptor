import "server-only";
import { AppError } from "@core/errors";
import { logger } from "@infra/logger";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

const log = logger.child("ErrorHandler");

interface ErrorContext {
  method: string;
  url: string;
  requestId?: string;
}

function mapPrismaStatus(code: string): number {
  switch (code) {
    case "P2002":
      return 409;
    case "P2025":
      return 404;
    case "P2003":
      return 400;
    default:
      return 400;
  }
}

function mapPrismaMessage(err: { code?: string; meta?: { target?: string[] | string } }): string {
  switch (err.code) {
    case "P2002": {
      const target = err.meta?.target;
      const fieldStr = Array.isArray(target)
        ? target.join(", ")
        : typeof target === "string"
          ? target
          : "value";
      return `A record with that ${fieldStr} already exists`;
    }
    case "P2025":
      return "Record not found";
    case "P2003":
      return "Related record not found";
    default:
      return "Database error";
  }
}

export function toErrorResponse(error: unknown, ctx: ErrorContext): NextResponse {
  const err = error as {
    name?: string;
    message?: string;
    stack?: string;
    code?: string;
    status?: number;
    statusCode?: number;
    meta?: { target?: string[] | string };
    errors?: unknown;
  };

  const isAppError = error instanceof AppError;
  const isBetterAuthError = err?.name === "BetterAuthError" || err?.name === "APIError";
  const isZodError = error instanceof ZodError;
  const isPrismaError = typeof err?.code === "string" && err.code.startsWith("P");

  let statusCode = 500;
  if (isAppError) statusCode = error.statusCode;
  else if (isBetterAuthError) statusCode = err.status || err.statusCode || 400;
  else if (isZodError) statusCode = 400;
  else if (isPrismaError) statusCode = mapPrismaStatus(err.code!);
  else if (err?.statusCode) statusCode = err.statusCode;

  const logLevel = statusCode >= 500 ? "error" : "warn";
  log[logLevel]("Error caught", {
    message: err?.message,
    name: err?.name,
    statusCode,
    method: ctx.method,
    url: ctx.url,
    requestId: ctx.requestId,
    ...(statusCode >= 500 ? { stack: err?.stack } : {}),
    ...(isAppError && error.code ? { errorCode: error.code } : {}),
    ...(isBetterAuthError && err.code ? { authCode: err.code } : {}),
  });

  const isProd = process.env.NODE_ENV === "production";
  const mainMessage =
    statusCode >= 500
      ? "We are having a temporary issue. Please try again in a moment."
      : (err?.message ?? "Unexpected error");

  const response: Record<string, unknown> = {
    success: false,
    statusCode,
    message: mainMessage,
    data: null,
  };
  const details: Record<string, unknown> = {};

  if (isAppError && error.errors) {
    details.errors = error.errors;
  }

  if (isBetterAuthError) {
    details.code = err.code ?? null;
  }

  if (isZodError) {
    response.message = "Validation failed";
    details.errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  if (isPrismaError) {
    response.message = mapPrismaMessage(err);
  }

  if (!isProd) {
    response.details = {
      ...details,
      errorName: err?.name,
      originalMessage: err?.message,
      stack: err?.stack,
    };
  } else if (Object.keys(details).length > 0) {
    response.details = details;
  }

  return NextResponse.json(response, { status: statusCode });
}
