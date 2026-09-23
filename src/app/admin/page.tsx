"use client";

import type React from "react";
import { useGetAdminMetricsQuery } from "@/features/admin/api";
import {
  Activity,
  AlertTriangle,
  Building2,
  FileText,
  IndianRupee,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

function KPICard({
  label,
  value,
  icon: Icon,
  accent = "orange",
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "orange" | "cyan" | "green" | "red" | "amber" | "purple";
  subtext?: string;
}) {
  const accentMap = {
    orange: { bg: "bg-primary/10", text: "text-primary" },
    cyan: { bg: "bg-primary/10", text: "text-primary" },
    green: { bg: "bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" },
    red: { bg: "bg-rose-500/10", text: "text-rose-500 dark:text-rose-400" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500 dark:text-purple-400" },
  };
  const a = accentMap[accent] || accentMap.orange;

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:border-border/80 hover:shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className={`h-8 w-8 rounded-md ${a.bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.text}`} />
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold font-mono text-foreground leading-none tracking-tight">
        {value}
      </p>
      {subtext && (
        <p className="text-[11px] text-muted-foreground mt-2.5 flex items-center gap-1.5">
          {subtext}
        </p>
      )}
    </div>
  );
}

function PlanBreakdownBar({ planCounts }: { planCounts: Record<string, number> }) {
  const total = Object.values(planCounts).reduce((s, v) => s + v, 0) || 1;
  const plans = [
    { key: "FREE", label: "Free", color: "bg-neutral-400 dark:bg-neutral-600" },
    { key: "PRO", label: "Pro", color: "bg-primary" },
    { key: "MAX", label: "Max", color: "bg-purple-500" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h3>
      <div className="flex h-2.5 rounded-full overflow-hidden mb-4 bg-muted">
        {plans.map(({ key, color }) => {
          const pct = ((planCounts[key] || 0) / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`${color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex gap-6">
        {plans.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono text-foreground font-semibold">{planCounts[key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: metrics, isLoading } = useGetAdminMetricsQuery();

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Loading metrics...
        </div>
      </div>
    );
  }

  const formatCurrency = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live metrics —{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          icon={IndianRupee}
          accent="green"
        />
        <KPICard
          label="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          icon={Users}
          accent="orange"
          subtext={`+${metrics.newUsers7d} this week`}
        />
        <KPICard
          label="Total Workspaces"
          value={metrics.totalWorkspaces.toLocaleString()}
          icon={Building2}
          accent="purple"
        />
        <KPICard
          label="Total Documents"
          value={metrics.totalDocuments.toLocaleString()}
          icon={FileText}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Active Users (7d)"
          value={metrics.activeUsers7d.toLocaleString()}
          icon={Activity}
          accent="green"
        />
        <KPICard
          label="New Signups (7d)"
          value={metrics.newUsers7d.toLocaleString()}
          icon={UserPlus}
          accent="orange"
        />
        <KPICard
          label="Failed Payments"
          value={metrics.failedPayments}
          icon={AlertTriangle}
          accent={metrics.failedPayments > 0 ? "red" : "green"}
          subtext={metrics.failedPayments > 0 ? "Requires attention" : "All clear"}
        />
        <KPICard
          label="Net Revenue"
          value={formatCurrency(metrics.paymentStats?.netRevenueINR ?? 0)}
          icon={IndianRupee}
          accent="purple"
          subtext={`${(metrics.paymentStats?.totalCapturedCount ?? 0).toLocaleString()} payments captured`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanBreakdownBar planCounts={metrics.planCounts} />

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Growth Indicators
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">User Growth (7d)</span>
              <span className="font-mono text-sm text-emerald-500 font-semibold">
                +{metrics.newUsers7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="font-mono text-sm text-primary font-semibold">
                {metrics.activeUsers7d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Paid Workspaces</span>
              <span className="font-mono text-sm text-purple-500 font-semibold">
                {(metrics.planCounts.PRO || 0) + (metrics.planCounts.MAX || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ARR (Estimated)</span>
              <span className="font-mono text-sm text-emerald-500 font-semibold">
                {formatCurrency(metrics.mrr * 12)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
