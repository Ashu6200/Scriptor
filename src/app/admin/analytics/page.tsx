"use client";

import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useGetAdminAnalyticsQuery } from "@/features/admin/api";
import type { AdminAnalytics } from "@/features/admin/api";
import { Activity, CreditCard, IndianRupee, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type Period = "today" | "7d" | "30d" | "custom";

function getRange(
  period: Period,
  customFrom: string,
  customTo: string
): { from: string; to: string } | null {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  if (period === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (period === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: start.toISOString(), to: now.toISOString() };
  }
  if (period === "custom" && customFrom && customTo) {
    return {
      from: new Date(customFrom).toISOString(),
      to: new Date(`${customTo}T23:59:59.999Z`).toISOString(),
    };
  }
  return null;
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}
function KPICard({ label, value, icon: Icon, sub }: KPICardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold font-mono text-foreground leading-none">
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

interface BarChartProps {
  series: { date: string; value: number }[];
  label: string;
  formatValue?: (v: number) => string;
}
function BarChart({ series, label, formatValue }: BarChartProps) {
  const max = Math.max(...series.map((d) => d.value), 1);
  const allZero = series.every((d) => d.value === 0);

  if (allZero) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        No {label.toLowerCase()} data for this period
      </div>
    );
  }

  const showLabels = series.length <= 31;

  return (
    <div>
      <div className="h-48 flex items-end gap-1 px-1">
        {series.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{ height: `${pct}%`, backgroundColor: "#ff5e1f", opacity: 0.8 }}
                title={`${d.date}: ${formatValue ? formatValue(d.value) : d.value}`}
              />
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono px-1 overflow-hidden">
          {series.map((d, i) => {
            const show =
              series.length <= 7 ||
              i === 0 ||
              i === series.length - 1 ||
              i % Math.ceil(series.length / 7) === 0;
            return (
              <span key={i} className="flex-1 text-center truncate">
                {show ? d.date.slice(5) : ""}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  PAST_DUE: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  CANCELED: "text-muted-foreground bg-muted/30 border-border",
  INCOMPLETE: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  NONE: "text-muted-foreground bg-muted/30 border-border",
};
const STATUS_LABELS = ["ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"];

type DateRangeValues = { customFrom: string; customTo: string };

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");

  const dateForm = useForm<DateRangeValues>({
    defaultValues: { customFrom: "", customTo: "" },
  });
  const [customFrom, customTo] = dateForm.watch(["customFrom", "customTo"]);

  const range = useMemo(
    () => getRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const { data, isLoading, isError } = useGetAdminAnalyticsQuery(range ?? { from: "", to: "" }, {
    skip: !range,
  });

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Revenue, signups, and subscription insights
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                period === p.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 w-auto text-xs"
                {...dateForm.register("customFrom")}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                className="h-8 w-auto text-xs"
                {...dateForm.register("customTo")}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <PageSkeleton variant="kpi-cards" />
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load analytics data.</p>
      ) : !range ? (
        <p className="text-sm text-muted-foreground">Select a date range to view analytics.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Revenue"
              value={`₹${(data?.totalRevenueINR ?? 0).toLocaleString("en-IN")}`}
              icon={IndianRupee}
              sub="Captured payments in range"
            />
            <KPICard
              label="Signups"
              value={(data?.totalSignups ?? 0).toLocaleString()}
              icon={Users}
              sub="New users in range"
            />
            <KPICard
              label="Transactions"
              value={(data?.totalTransactions ?? 0).toLocaleString()}
              icon={CreditCard}
              sub="Captured transactions in range"
            />
            <KPICard
              label="Avg. Revenue"
              value={
                data && data.totalTransactions > 0
                  ? `₹${Math.round(data.totalRevenueINR / data.totalTransactions).toLocaleString("en-IN")}`
                  : "—"
              }
              icon={TrendingUp}
              sub="Per captured transaction"
            />
          </div>

          {/* Revenue Trend */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Revenue Trend</h2>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                INR / day
              </span>
            </div>
            {data ? (
              <BarChart
                series={data.revenueSeries}
                label="Revenue"
                formatValue={(v) => `₹${v.toLocaleString("en-IN")}`}
              />
            ) : (
              <div className="h-48 bg-muted animate-pulse rounded-lg" />
            )}
          </div>

          {/* Signup Trend + Subscription Status */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground mb-4">Signup Trend</h2>
              {data ? (
                <BarChart series={data.signupSeries} label="Signups" />
              ) : (
                <div className="h-48 bg-muted animate-pulse rounded-lg" />
              )}
            </div>

            <div className="col-span-12 lg:col-span-5 rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Subscription Status
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {STATUS_LABELS.map((status) => {
                  const count = data?.subscriptionStatus?.[status] ?? 0;
                  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.NONE;
                  return (
                    <div
                      key={status}
                      className={`rounded-lg border p-3 flex flex-col gap-1 ${colorClass}`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                        {status.replace("_", " ")}
                      </span>
                      <span className="text-2xl font-bold font-mono">{count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {data && data.paymentMethods.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Methods
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.paymentMethods.map((pm, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {pm.method?.toUpperCase() ?? "UNKNOWN"}
                      </p>
                      <p className="text-lg font-bold font-mono text-foreground">
                        ₹{pm.amountINR.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">{pm.count} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
