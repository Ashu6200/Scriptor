"use client";

import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PlanTier {
  id: "FREE" | "PRO" | "MAX";
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

const TIERS: PlanTier[] = [
  {
    id: "FREE",
    name: "Free",
    description: "Essential documentation workspace for individual developers.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Up to 30 documents",
      "1 workspace",
      "TipTap rich text & markdown editor",
      "Hierarchical document tree",
      "Inline comments & discussions",
      "7-day document version history",
      "Community support",
    ],
    ctaText: "Start Free",
  },
  {
    id: "PRO",
    name: "Pro",
    badge: "Most Popular",
    description: "Advanced technical documentation & audit governance for scaling teams.",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    popular: true,
    features: [
      "Unlimited documents",
      "Unlimited workspaces & custom slugs",
      "90-day version snapshot history",
      "Workspace pinning & custom ordering",
      "Full document diffs & instant rollback",
      "Immutable audit logs & activity trail",
      "In-app notification center",
      "Priority developer support",
    ],
    ctaText: "Upgrade to Pro",
  },
  {
    id: "MAX",
    name: "Max",
    badge: "Enterprise SLA",
    description: "Maximum throughput, team collaboration, and extended retention.",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    features: [
      "Everything included in Pro",
      "Unlimited workspaces & documents",
      "365-day version history retention",
      "Dedicated response SLA (<4h)",
      "Early access to new features",
    ],
    ctaText: "Upgrade to Max",
  },
];

export function Pricing() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="py-24 relative bg-card border-t border-border" id="pricing">
      <div className="max-w-300 mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] font-mono text-primary"
          >
            <span>TRANSPARENT PRICING</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[40px] sm:text-[48px] md:text-[56px] font-semibold text-foreground leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Simple, predictable plans.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-155 text-muted-foreground text-[18px] leading-[1.6]"
          >
            Start for free, then scale with unlimited documents, full audit logging, and extended
            version history.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="pt-4 flex items-center gap-3 font-mono tex-sm"
          >
            <span
              className={`cursor-pointer transition-colors ${
                billingCycle === "monthly"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly billing
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={billingCycle === "yearly"}
              aria-label="Toggle annual billing"
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted border border-border transition-colors focus:outline-none"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`cursor-pointer transition-colors flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              <span>Yearly billing</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30">
                Save 17%
              </span>
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {TIERS.map((tier, idx) => {
            const isYearly = billingCycle === "yearly";
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
            const priceDisplay =
              tier.monthlyPrice === 0
                ? "₹0"
                : isYearly
                  ? `₹${price.toLocaleString("en-IN")}`
                  : `₹${price.toLocaleString("en-IN")}`;
            const periodDisplay =
              tier.monthlyPrice === 0 ? "/ forever" : isYearly ? "/ year" : "/ month";

            const ctaHref = session
              ? tier.id === "FREE"
                ? "/dashboard"
                : "/dashboard/billing"
              : "/signup";

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`rounded-lg border p-8 flex flex-col justify-between relative transition-all duration-200 ${
                  tier.popular
                    ? "bg-background border-primary/60 shadow-[0_0_40px_rgba(255,94,31,0.08)]"
                    : "bg-background border-border hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px]"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-8">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[10px] font-mono font-bold text-primary-foreground uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[22px] font-semibold text-foreground">{tier.name}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-normal mb-6 min-h-10.5">
                    {tier.description}
                  </p>

                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-[38px] font-semibold text-foreground tracking-tight">
                        {priceDisplay}
                      </span>
                      <span className="text-muted-foreground text-sm">{periodDisplay}</span>
                    </div>
                    {isYearly && tier.monthlyPrice > 0 && (
                      <p className="text-[12px] font-mono text-green-600 dark:text-green-400 mt-1">
                        Equivalent to ₹{Math.round(tier.yearlyPrice / 12).toLocaleString("en-IN")} /
                        month
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                      What's included:
                    </p>
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href={ctaHref} className="w-full">
                  <button
                    type="button"
                    className={`w-full h-11 px-5 rounded-md text-sm font-semibold transition-all duration-100 flex items-center justify-center gap-2 ${
                      tier.popular
                        ? "bg-primary text-primary-foreground hover:bg-cf-accent-hover shadow-[0_4px_14px_rgba(255,94,31,0.2)]"
                        : "bg-muted text-foreground border border-border hover:border-foreground/40"
                    }`}
                  >
                    <span>
                      {session
                        ? tier.id === "FREE"
                          ? "Go to Dashboard"
                          : tier.ctaText
                        : "Get Started Free"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Enterprise / Mission Control note */}
        <div className="mt-16 p-6 rounded-lg border border-border bg-muted flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h4 className="text-foreground font-semibold text-[16px] mb-1">
              Need platform administration or organization governance?
            </h4>
            <p className="text-muted-foreground text-sm">
              Scriptor includes platform-level Mission Control for managing roles, audit logs, and
              workspace quotas.
            </p>
          </div>
          <Link href={session ? "/dashboard" : "/signup"} className="shrink-0">
            <button
              type="button"
              className="h-10 px-5 rounded-md tex-sm font-semibold text-foreground border border-border hover:border-foreground/40 transition-colors"
            >
              Learn More →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
