import { prisma } from "@infra/db";
import { pingWithRetry } from "@infra/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.user.findFirst();
    await pingWithRetry();

    return NextResponse.json({
      success: true,
      data: { status: "ready", database: "connected", redis: "connected" },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: {
          status: "not_ready",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        error: "Connectivity check failed",
      },
      { status: 503 }
    );
  }
}
