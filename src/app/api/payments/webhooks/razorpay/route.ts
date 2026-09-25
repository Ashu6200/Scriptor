import { logger } from "@infra/logger";
import { WebhookService } from "@modules/payment";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const log = logger.child("RazorpayPaymentWebhook");
const webhookService = new WebhookService();
const MAX_BODY_BYTES = 1_000_000;

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

    const eventIdHeader = req.headers.get("x-razorpay-event-id") || undefined;

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

    const result = await webhookService.handleWebhook(rawBody, signature, eventIdHeader);

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: result.duplicate ? "Event already processed" : "Webhook processed successfully",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    log.error("Webhook route error:", error);

    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    return NextResponse.json(
      { success: false, statusCode, message, data: null },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}
