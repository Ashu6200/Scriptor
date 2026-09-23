"use client";

import { Button } from "@/components/ui/button";
import { getPlanEntitlements } from "@/lib/client-entitlements";
import { AlertTriangle, Zap } from "lucide-react";
import React from "react";

interface QuotaBannerProps {
  plan?: string | null;
  isAdmin?: boolean;
  currentCount: number;
  type: "documents";
  onUpgradeClick: () => void;
}

export function QuotaBanner({
  plan,
  isAdmin,
  currentCount,
  type,
  onUpgradeClick,
}: QuotaBannerProps) {
  const limits = getPlanEntitlements(plan, isAdmin);
  const max = limits.maxDocuments;

  if (max === Number.POSITIVE_INFINITY) return null;

  const percent = Math.min(100, Math.round((currentCount / max) * 100));
  const isNear = percent >= 80 && percent < 100;
  const isAtLimit = currentCount >= max;

  if (!isNear && !isAtLimit) return null;

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
        isAtLimit
          ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
          : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            isAtLimit ? "bg-red-500/20" : "bg-amber-500/20"
          }`}
        >
          {isAtLimit ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <Zap className="h-5 w-5 text-amber-500" />
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold">
            {isAtLimit
              ? `Document limit reached (${currentCount}/${max})`
              : `Nearing document limit (${currentCount}/${max})`}
          </h4>
          <p className="text-[10px] opacity-80">
            {isAtLimit
              ? `You cannot add more ${type} on the ${(plan || "Free").toUpperCase()} plan.`
              : `Upgrade to Pro for unlimited ${type} and advanced features.`}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant={isAtLimit ? "destructive" : "default"}
        onClick={onUpgradeClick}
        className="shrink-0 gap-1.5"
      >
        <Zap className="h-3.5 w-3.5" />
        Upgrade Plan
      </Button>
    </div>
  );
}
