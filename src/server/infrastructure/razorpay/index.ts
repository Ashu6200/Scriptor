import "server-only";
import { AppError } from "@core/errors";
import { config } from "@infra/config";
import Razorpay from "razorpay";

const RAZORPAY_KEY = Symbol.for("app.razorpay.client");

function buildRazorpay(): Razorpay {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    throw new AppError("Billing is not configured on this server", 500, "RAZORPAY_NOT_CONFIGURED");
  }

  return new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
}

export function getRazorpay(): Razorpay {
  const g = globalThis as unknown as Record<symbol, Razorpay | undefined>;
  if (!g[RAZORPAY_KEY]) {
    g[RAZORPAY_KEY] = buildRazorpay();
  }
  return g[RAZORPAY_KEY]!;
}

export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    const client = getRazorpay();
    const value = client[prop as keyof Razorpay];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
