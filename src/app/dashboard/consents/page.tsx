"use client";

import {
  type DpdpConsentEvent,
  type DpdpPolicy,
  useGetActivePoliciesQuery,
  useGetUserConsentHistoryQuery,
  useGetUserConsentsQuery,
  useRecordConsentMutation,
  useWithdrawConsentMutation,
} from "@/features/dpdp/api";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  FileText,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldPlus,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// ─── Filter schema ─────────────────────────────────────────────────────────

const filterSchema = z.object({
  search: z.string().optional(),
  activeStatus: z.string().optional(),
  historyStatus: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
type FilterValues = z.infer<typeof filterSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  GRANTED: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  REJECTED: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
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

function HistoryEventRow({ event }: { event: DpdpConsentEvent }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
            event.status === "GRANTED"
              ? "bg-emerald-500/10"
              : event.status === "WITHDRAWN"
                ? "bg-amber-500/10"
                : "bg-rose-500/10"
          )}
        >
          {event.status === "GRANTED" ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : event.status === "WITHDRAWN" ? (
            <ShieldOff className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Shield className="h-3.5 w-3.5 text-rose-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {event.policy?.name ?? event.policyId}
          </p>
          <p className="text-xs text-muted-foreground">
            {event.status} · {event.consentMethod} · {event.source}
          </p>
        </div>
      </div>
      <div className="text-right">
        <StatusBadge status={event.status} />
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm")}
        </p>
      </div>
    </div>
  );
}

function getLatestPublishedVersionId(policy: DpdpPolicy): string | null {
  const published = policy.versions.filter((v) => v.status === "PUBLISHED");
  if (!published.length) return null;
  return published.reduce((a, b) => (a.version > b.version ? a : b)).id;
}

const inputClass =
  "h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const selectClass =
  "h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function UserConsentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Filter form (no useState for filters) ──
  const { control, watch, reset } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: searchParams.get("search") ?? "",
      activeStatus: searchParams.get("activeStatus") ?? "",
      historyStatus: searchParams.get("historyStatus") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    },
  });

  const filters = watch();

  // Sync filter changes → URL; reset history page to 1
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.activeStatus) params.set("activeStatus", filters.activeStatus);
    if (filters.historyStatus) params.set("historyStatus", filters.historyStatus);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    filters.search,
    filters.activeStatus,
    filters.historyStatus,
    filters.from,
    filters.to,
    pathname,
    router,
  ]);

  // History pagination from URL (no useState)
  const historyPage = Number(searchParams.get("page") ?? "1");
  const setHistoryPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove filter keys so we only update page on top of current filters
    params.set("page", String(page));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // ── Data ──
  const { data: consents, isLoading: consentsLoading } = useGetUserConsentsQuery();
  const { data: activePolicies } = useGetActivePoliciesQuery();
  const { data: history, isLoading: historyLoading } = useGetUserConsentHistoryQuery({
    page: historyPage,
    limit: 10,
    status: filters.historyStatus || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    search: filters.search || undefined,
  });

  const [withdrawConsent, { isLoading: isWithdrawing }] = useWithdrawConsentMutation();
  const [recordConsent, { isLoading: isGranting }] = useRecordConsentMutation();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  // ── Active policies — client-side filtering ──
  const consentEntries = consents ? Object.entries(consents) : [];
  const filteredEntries = consentEntries.filter(([key, state]) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!state.policyName.toLowerCase().includes(q) && !key.toLowerCase().includes(q))
        return false;
    }
    if (filters.activeStatus && state.status !== filters.activeStatus) return false;
    return true;
  });

  // ── Handlers ──
  const handleGrant = async (policyId: string, policyName: string) => {
    const policy = activePolicies?.find((p) => p.id === policyId);
    if (!policy) return;
    const policyVersionId = getLatestPublishedVersionId(policy);
    if (!policyVersionId) return;
    setGrantingId(policyId);
    try {
      await recordConsent({
        policyId,
        policyVersionId,
        status: "GRANTED",
        source: "consent_center",
        consentMethod: "web_form",
      }).unwrap();
      toast.success(`Consent granted for "${policyName}"`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to grant consent");
    } finally {
      setGrantingId(null);
    }
  };

  const handleWithdraw = async (policyId: string, policyName: string) => {
    if (!confirm(`Withdraw consent for "${policyName}"? You can re-grant it at any time.`)) return;
    setWithdrawingId(policyId);
    try {
      await withdrawConsent(policyId).unwrap();
      toast.success(`Consent withdrawn for "${policyName}"`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to withdraw consent");
    } finally {
      setWithdrawingId(null);
    }
  };

  const hasActiveFilters =
    !!filters.search ||
    !!filters.activeStatus ||
    !!filters.historyStatus ||
    !!filters.from ||
    !!filters.to;

  const clearFilters = () => {
    reset({ search: "", activeStatus: "", historyStatus: "", from: "", to: "" });
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Privacy & Consent Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your data processing consent choices. Essential processing cannot be withdrawn.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Filters
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Policy search (shared) */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Controller
              control={control}
              name="search"
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="Search by policy name..."
                  className={cn(inputClass, "w-full pl-9")}
                  {...field}
                />
              )}
            />
          </div>

          {/* Active Policies status filter */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Active Policies — Status</label>
            <Controller
              control={control}
              name="activeStatus"
              render={({ field }) => (
                <select className={cn(selectClass, "w-full")} {...field}>
                  <option value="">All Statuses</option>
                  <option value="GRANTED">Granted</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              )}
            />
          </div>

          {/* History status filter */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">History — Status</label>
            <Controller
              control={control}
              name="historyStatus"
              render={({ field }) => (
                <select className={cn(selectClass, "w-full")} {...field}>
                  <option value="">All Statuses</option>
                  <option value="GRANTED">Granted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                  <option value="PENDING">Pending</option>
                </select>
              )}
            />
          </div>

          {/* Date range (History) */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">History — From</label>
            <Controller
              control={control}
              name="from"
              render={({ field }) => (
                <input type="date" className={cn(inputClass, "w-full")} {...field} />
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">History — To</label>
            <Controller
              control={control}
              name="to"
              render={({ field }) => (
                <input type="date" className={cn(inputClass, "w-full")} {...field} />
              )}
            />
          </div>
        </div>
      </div>

      {/* ── Active Policies ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Active Policies
          </h2>
          {consents && (
            <p className="text-xs font-mono text-muted-foreground">
              {filteredEntries.length} of {consentEntries.length}
            </p>
          )}
        </div>

        {consentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              Loading consent preferences...
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters ? "No policies match the current filters" : "No active policies"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEntries.map(([key, state]) => (
              <div key={key} className="px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{state.policyName}</p>
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {state.policyKey}
                      </span>
                      {state.policyVersion && (
                        <span className="text-xs font-mono text-muted-foreground">
                          v{state.policyVersion}
                        </span>
                      )}
                    </div>
                    {state.purpose && (
                      <p className="text-xs text-muted-foreground mt-1">{state.purpose}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={state.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {state.consentRequired ? (
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Optional — you can withdraw at any time
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold">
                        <Lock className="h-3.5 w-3.5" />
                        Essential — required for the service
                      </span>
                    )}
                    {state.consentedAt && (
                      <span>· Consented {format(new Date(state.consentedAt), "dd MMM yyyy")}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Grant button: PENDING, REJECTED, or WITHDRAWN optional */}
                    {(state.status === "PENDING" ||
                      state.status === "REJECTED" ||
                      (state.status === "WITHDRAWN" && state.consentRequired)) && (
                      <button
                        onClick={() => handleGrant(state.policyId, state.policyName)}
                        disabled={isGranting && grantingId === state.policyId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                      >
                        <ShieldPlus className="h-3.5 w-3.5" />
                        {isGranting && grantingId === state.policyId
                          ? "Granting..."
                          : "Grant Consent"}
                      </button>
                    )}

                    {/* Withdraw button: GRANTED optional */}
                    {state.consentRequired && state.status === "GRANTED" && (
                      <button
                        onClick={() => handleWithdraw(state.policyId, state.policyName)}
                        disabled={isWithdrawing && withdrawingId === state.policyId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                        {isWithdrawing && withdrawingId === state.policyId
                          ? "Withdrawing..."
                          : "Withdraw"}
                      </button>
                    )}

                    {/* Essential + GRANTED */}
                    {!state.consentRequired && state.status === "GRANTED" && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" />
                        Cannot be withdrawn
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable full policy content */}
                {(() => {
                  const policy = activePolicies?.find((p) => p.id === state.policyId);
                  const published = policy?.versions.filter((v) => v.status === "PUBLISHED") ?? [];
                  const version = published.length
                    ? published.reduce((a, b) => (a.version > b.version ? a : b))
                    : null;
                  if (!version?.content) return null;
                  const isExpanded = expandedPolicyId === state.policyId;
                  return (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPolicyId((prev) =>
                            prev === state.policyId ? null : state.policyId
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {isExpanded ? "Collapse policy" : "View full policy"}
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-border bg-muted/30 px-4 py-3">
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(version.content) }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Consent History ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Consent History
          </h2>
          {history?.meta && (
            <p className="text-xs font-mono text-muted-foreground">{history.meta.total} events</p>
          )}
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              Loading history...
            </div>
          </div>
        ) : !history || history.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Database className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasActiveFilters ? "No events match the current filters" : "No consent history yet"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="px-5">
            {history.data.map((event) => (
              <HistoryEventRow key={event.id} event={event} />
            ))}
          </div>
        )}

        {history?.meta && history.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {history.meta.page} of {history.meta.totalPages} · {history.meta.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={!history.meta.hasMore}
                onClick={() => setHistoryPage(historyPage + 1)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
