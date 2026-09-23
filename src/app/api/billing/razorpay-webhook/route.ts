import crypto from "node:crypto";
import { config } from "@infra/config";
import { logger } from "@infra/logger";
import { BillingService, type RazorpayWebhookEvent } from "@modules/billing";
import { type NextRequest, NextResponse } from "next/server";

const log = logger.child("RazorpayWebhook");
const billingService = new BillingService();

const MAX_BODY_BYTES = 1_000_000;

function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          message: "Missing x-razorpay-signature header",
          data: null,
        },
        { status: 400 }
      );
    }

    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, statusCode: 413, message: "Payload too large", data: null },
        { status: 413 }
      );
    }

    const rawBody = Buffer.from(await req.arrayBuffer());
    if (rawBody.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, statusCode: 413, message: "Payload too large", data: null },
        { status: 413 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_WEBHOOK_SECRET || "")
      .update(rawBody)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, signature)) {
      log.warn("Rejected webhook with invalid signature");
      return NextResponse.json(
        { success: false, statusCode: 401, message: "Invalid webhook signature", data: null },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookEvent;
    await billingService.handleRazorpayWebhook(event);

    return NextResponse.json({ success: true, statusCode: 200, message: "Success", data: null });
  } catch (error) {
    log.error("Webhook processing failed:", error);
    return NextResponse.json(
      { success: false, statusCode: 500, message: "Webhook processing failed", data: null },
      { status: 500 }
    );
  }
}
