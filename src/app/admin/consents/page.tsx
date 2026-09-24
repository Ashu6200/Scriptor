"use client";

import { type DpdpConsentEvent, useSearchAdminConsentsQuery } from "@/features/dpdp/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  GRANTED: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  WITHDRAWN: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  PENDING: {
    bg: "bg-neutral-500/10",
    text: "text-neutral-500 dark:text-neutral-400",
    dot: "bg-neutral-500",
  },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        colors.bg,
        colors.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {status}
    </span>
  );
}

function ExpandedRow({ event }: { event: DpdpConsentEvent }) {
  return (
    <tr className="bg-muted/20">
      <td colSpan={7} className="px-4 py-3">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Purpose
            </p>
            <p className="text-foreground">{event.purpose || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Consent Method
            </p>
            <p className="text-foreground font-mono">{event.consentMethod}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Source
            </p>
            <p className="text-foreground font-mono">{event.source}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              IP Address
            </p>
            <p className="text-foreground font-mono">{event.ipAddress ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Policy Version
            </p>
            <p className="text-foreground font-mono">v{event.policyVersion?.version ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              Event ID
            </p>
            <p className="text-foreground font-mono text-[10px] break-all">{event.id}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminConsentsPage() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { control, watch } = useForm({
    defaultValues: { search: "", status: "", fromDate: "", toDate: "" },
  });
  const { search, status: statusFilter, fromDate, toDate } = watch();

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, fromDate, toDate]);

  const { data, isLoading } = useSearchAdminConsentsQuery({
    page,
    limit: 20,
    status: statusFilter || undefined,
    search: search || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const events = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Consent Records
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and audit all user consent events across all policies
          </p>
        </div>
        {meta && (
          <p className="text-xs font-mono text-muted-foreground">{meta.total} total records</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Controller
            control={control}
            name="search"
            render={({ field }) => (
              <input
                type="text"
                placeholder="Search by user email..."
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                {...field}
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <select
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...field}
            >
              <option value="">All Statuses</option>
              <option value="GRANTED">Granted</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="PENDING">Pending</option>
            </select>
          )}
        />
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="fromDate"
            render={({ field }) => (
              <input
                type="date"
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...field}
              />
            )}
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Controller
            control={control}
            name="toDate"
            render={({ field }) => (
              <input
                type="date"
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              Loading consent records...
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No consent records found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting the filters above</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => (
                <>
                  <tr
                    key={event.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {event.user?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {event.user?.email ?? event.userId}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {event.policy?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {event.policy?.key ?? event.policyId}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {event.consentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {event.ipAddress ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs text-primary font-semibold">
                        {expandedId === event.id ? "Hide" : "View"}
                      </span>
                    </td>
                  </tr>
                  {expandedId === event.id && (
                    <ExpandedRow key={`${event.id}-expanded`} event={event} />
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={!meta.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
