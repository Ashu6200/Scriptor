"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subscription } from "@/features/billing/api";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";

interface Props {
  subscription?: Subscription | null;
  isLoading: boolean;
  workspaceId: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Past Due",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
};

export function CurrentPlanCard({ subscription, isLoading, workspaceId }: Props) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const plan = subscription?.subscriptionPlan ?? "FREE";
  const status = subscription?.subscriptionStatus;
  const periodEnd = subscription?.subscriptionPeriodEnd
    ? new Date(subscription.subscriptionPeriodEnd).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 w-fit">
          {plan}
        </span>
        {status && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Status:</span>
            <StatusBadge
              variant={
                status === "ACTIVE"
                  ? "success"
                  : status === "PAST_DUE"
                    ? "warning"
                    : status === "CANCELED"
                      ? "danger"
                      : "default"
              }
            >
              {STATUS_LABELS[status] ?? status}
            </StatusBadge>
          </div>
        )}
        {periodEnd && status === "ACTIVE" && (
          <p className="text-sm text-muted-foreground">Next billing date: {periodEnd}</p>
        )}
        {periodEnd && status === "CANCELED" && (
          <p className="text-sm text-muted-foreground">Access continues until: {periodEnd}</p>
        )}

        {/* Status-specific action banners */}
        {status === "PAST_DUE" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">Payment overdue</p>
              <p className="text-xs text-muted-foreground">
                Your last payment failed. Please update your payment method through Razorpay to keep
                your subscription active.
              </p>
            </div>
          </div>
        )}
        {status === "INCOMPLETE" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Subscription setup incomplete
              </p>
              <p className="text-xs text-muted-foreground">
                Your subscription payment was not completed. Select a plan below to retry.
              </p>
            </div>
          </div>
        )}
        {status === "CANCELED" && plan !== "FREE" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-destructive">Subscription canceled</p>
              <p className="text-xs text-muted-foreground">
                Your plan will revert to Free after the period ends. Upgrade below to restore full
                access.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {plan !== "FREE" && status === "ACTIVE" && (
        <CardFooter>
          <CancelSubscriptionDialog workspaceId={workspaceId} periodEnd={periodEnd} />
        </CardFooter>
      )}
      {status === "PAST_DUE" && (
        <CardFooter>
          <Button variant="outline" className="w-full">
            <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer">
              Update Payment Method
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
