"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CLIENT_PLAN_LIMITS } from "@/lib/client-entitlements";
import { Check, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  feature?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  title = "Upgrade your Plan",
  description = "Unlock higher limits and advanced features.",
  feature,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 sm:p-8">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Plan Entitlement
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {feature ? `The feature "${feature}" requires a Pro or Max plan.` : description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-5 bg-card/50 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Current Plan
              </span>
              <h3 className="text-xl font-bold mt-1">Free</h3>
              <p className="text-2xl font-extrabold mt-2">₹0</p>

              <ul className="mt-4 space-y-2 text-[10px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Up to {CLIENT_PLAN_LIMITS.FREE.maxDocuments} documents
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" />1 workspace included
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <span className="h-3.5 w-3.5 text-center font-bold">✕</span>
                  No Audit Logs
                </li>
              </ul>
            </div>
            <Button variant="outline" disabled className="w-full mt-6">
              Active Plan
            </Button>
          </div>

          <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Recommended
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Pro Upgrade
              </span>
              <h3 className="text-xl font-bold mt-1 flex items-center gap-1.5">
                Pro <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-2xl font-extrabold mt-2">
                ₹499 <span className="text-[10px] font-medium text-muted-foreground">/ mo</span>
              </p>

              <ul className="mt-4 space-y-2 text-[10px]">
                <li className="flex items-center gap-2 font-semibold">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Unlimited documents
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  5 workspaces included
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Full Audit Logs & Verification
                </li>
                <li className="flex items-center gap-2 font-semibold">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  90-day version history
                </li>
              </ul>
            </div>

            <Link href="/dashboard/billing" className="w-full mt-6 block">
              <Button onClick={() => onOpenChange(false)} className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
