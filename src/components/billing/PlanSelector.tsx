"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreatePaymentOrderMutation,
  useVerifyPaymentOrderMutation,
} from "@/features/billing/api";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useSession } from "@/lib/auth-client";
import { api } from "@/store/api";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const MONTHLY_PRODUCT_IDS = {
  PRO: "pro-plan-monthly",
  MAX: "max-plan-monthly",
} as const;

const YEARLY_PRODUCT_IDS = {
  PRO: "pro-plan-yearly",
  MAX: "max-plan-yearly",
} as const;

const PLANS = [
  {
    id: "FREE" as const,
    name: "Free",
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    features: ["30 documents", "1 workspace", "7-day version history", "Community support"],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    monthlyPrice: "₹499",
    yearlyPrice: "₹416",
    yearlyTotal: "₹4,999",
    features: [
      "Unlimited documents",
      "5 workspaces",
      "90-day version history",
      "Audit logs",
      "Trash & Document Recovery",
      "Interactive Mermaid Diagrams",
      "Priority support",
    ],
  },
  {
    id: "MAX" as const,
    name: "Max",
    monthlyPrice: "₹999",
    yearlyPrice: "₹833",
    yearlyTotal: "₹9,999",
    features: [
      "Everything in Pro",
      "Unlimited workspaces",
      "365-day version history",
      "CodeVault Copilot (AI Assistant)",
      "Dedicated SLA",
    ],
  },
];

interface Props {
  currentPlan: "FREE" | "PRO" | "MAX";
  workspaceId: string;
}

export function PlanSelector({ currentPlan, workspaceId }: Props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const { openCheckout } = useRazorpay();
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPaymentOrder] = useVerifyPaymentOrderMutation();
  const [loadingPlan, setLoadingPlan] = useState<"PRO" | "MAX" | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const handleUpgrade = async (plan: "PRO" | "MAX") => {
    setLoadingPlan(plan);
    try {
      const productId = billing === "yearly" ? YEARLY_PRODUCT_IDS[plan] : MONTHLY_PRODUCT_IDS[plan];
      const order = await createPaymentOrder({
        items: [{ productId, quantity: 1 }],
      }).unwrap();

      await openCheckout({
        key: order.keyId,
        order_id: order.razorpayOrderId,
        name: "Scriptor",
        description: `Scriptor ${plan} Plan (${billing})`,
        prefill: {
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
        },
        theme: { color: "#ff5e1f" },
        handler: async (response) => {
          try {
            await verifyPaymentOrder({
              razorpay_order_id: response.razorpay_order_id || order.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();
            // Invalidate subscription cache for this workspace then soft-refresh
            dispatch(
              api.util.invalidateTags([
                { type: "Billing", id: `SUB-${workspaceId}` },
                { type: "Billing", id: `HISTORY-${workspaceId}` },
              ])
            );
            toast.success(`Successfully upgraded to ${plan} Plan!`);
            router.refresh();
          } catch (verifyErr: unknown) {
            const msg =
              (verifyErr as { data?: { message?: string } })?.data?.message ||
              "Payment verification failed. Please contact support.";
            toast.error(msg);
          }
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      });
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to initiate payment checkout";
      toast.error(msg);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Billing period toggle */}
      <div className="flex items-center gap-3 self-start rounded-lg border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
            billing === "monthly"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling("yearly")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
            billing === "yearly"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yearly
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Save 17%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgradeable =
            plan.id !== "FREE" &&
            plan.id !== currentPlan &&
            (currentPlan === "FREE" || plan.id === "MAX");
          const isDowngrade = plan.id === "FREE" || (currentPlan === "MAX" && plan.id === "PRO");

          const displayPrice =
            plan.id === "FREE"
              ? "₹0 / mo"
              : billing === "yearly"
                ? `${plan.yearlyPrice} / mo`
                : `${plan.monthlyPrice} / mo`;

          return (
            <Card key={plan.id} className={isCurrent ? "ring-2 ring-primary border-primary" : ""}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-xl font-bold">{displayPrice}</p>
                {billing === "yearly" && plan.yearlyTotal && (
                  <p className="text-xs text-muted-foreground">Billed {plan.yearlyTotal} / year</p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : isUpgradeable ? (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id as "PRO" | "MAX")}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.id ? "Processing..." : `Upgrade to ${plan.name}`}
                  </Button>
                ) : isDowngrade ? (
                  <Button
                    disabled
                    className="w-full"
                    variant="ghost"
                    title="Contact support to downgrade your plan"
                  >
                    <span className="text-muted-foreground text-xs">
                      Contact support to downgrade
                    </span>
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
