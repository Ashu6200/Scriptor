"use client";

import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";
import { PlanEntitlements } from "@/components/billing/PlanEntitlements";
import { PlanSelector } from "@/components/billing/PlanSelector";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useGetBillingHistoryQuery, useGetSubscriptionQuery } from "@/features/billing/api";
import { useGetWorkspacesQuery } from "@/features/workspace/api";
import { AlertCircle } from "lucide-react";

export default function BillingPage() {
  const { data: workspaces = [], isLoading: wsLoading, isError: wsError } = useGetWorkspacesQuery();
  const workspaceId = workspaces[0]?.id;

  const {
    data: subscription,
    isLoading: subLoading,
    isError: subError,
  } = useGetSubscriptionQuery(workspaceId!, { skip: !workspaceId });

  const {
    data: historyData,
    isLoading: histLoading,
    isError: histError,
  } = useGetBillingHistoryQuery(workspaceId!, { skip: !workspaceId });

  if (wsLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageSkeleton variant="kpi-cards" />
      </div>
    );
  }

  if (wsError) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <ErrorBanner message="Failed to load workspace data. Please refresh the page." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing &amp; Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription, upgrade your plan, and view payment history.
        </p>
      </div>

      {subError && <ErrorBanner message="Failed to load subscription info. Please refresh." />}

      <CurrentPlanCard
        subscription={subscription}
        isLoading={subLoading}
        workspaceId={workspaceId!}
      />

      <PlanEntitlements plan={subscription?.subscriptionPlan ?? "FREE"} isLoading={subLoading} />

      <div>
        <h2 className="mb-3 text-base font-semibold">Available Plans</h2>
        <PlanSelector
          currentPlan={subscription?.subscriptionPlan ?? "FREE"}
          workspaceId={workspaceId!}
        />
      </div>

      {histError && <ErrorBanner message="Failed to load payment history. Please refresh." />}

      <PaymentHistoryTable transactions={historyData?.data ?? []} isLoading={histLoading} />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
