"use client";

import { useListPoliciesQuery, usePublishPolicyMutation, useArchivePolicyMutation, useDeletePolicyMutation } from "@/features/dpdp/api";
import type { DpdpPolicy } from "@/features/dpdp/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus,
  History,
  Pencil,
  Plus,
  Rocket,
  ScrollText,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  PUBLISHED: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  ARCHIVED: {
    bg: "bg-neutral-500/10",
    text: "text-neutral-500 dark:text-neutral-400",
    dot: "bg-neutral-500",
  },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
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

export default function PoliciesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = useListPoliciesQuery({
    page,
    limit: 20,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const [publishPolicy] = usePublishPolicyMutation();
  const [archivePolicy] = useArchivePolicyMutation();
  const [deletePolicy] = useDeletePolicyMutation();

  const handlePublish = async (policy: DpdpPolicy) => {
    try {
      await publishPolicy(policy.id).unwrap();
      toast.success(`Policy "${policy.name}" published`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to publish");
    }
  };

  const handleArchive = async (policy: DpdpPolicy) => {
    try {
      await archivePolicy(policy.id).unwrap();
      toast.success(`Policy "${policy.name}" archived`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to archive");
    }
  };

  const handleDelete = async (policy: DpdpPolicy) => {
    if (!confirm(`Are you sure you want to delete "${policy.name}"? This action uses soft-delete.`)) return;
    try {
      await deletePolicy(policy.id).unwrap();
      toast.success(`Policy "${policy.name}" deleted`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to delete");
    }
  };

  const policies = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <ScrollText className="h-6 w-6 text-primary" />
            DPDP Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage data processing policies and their lifecycle
          </p>
        </div>
        <Link
          href="/admin/policies/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create Policy
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              Loading policies...
            </div>
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No policies found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create your first data processing policy
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Version
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Consent Req.
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {policies.map((policy) => {
                const latestVersion = policy.versions?.[0];
                return (
                  <tr
                    key={policy.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <Link
                          href={`/admin/policies/${policy.id}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {policy.name}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {policy.key}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-50">
                        {latestVersion?.purpose ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-mono font-semibold text-foreground">
                        v{latestVersion?.version ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={policy.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          latestVersion?.consentRequired
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {latestVersion?.consentRequired ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(policy.updatedAt), "dd MMM yyyy")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/policies/${policy.id}`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/admin/policies/${policy.id}/edit`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/admin/policies/${policy.id}/versions`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          title="Versions"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Link>
                        {policy.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublish(policy)}
                            className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-all"
                            title="Publish"
                          >
                            <Rocket className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {policy.status === "PUBLISHED" && (
                          <>
                            <Link
                              href={`/admin/policies/${policy.id}/versions`}
                              className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-all"
                              title="Create Version"
                            >
                              <FilePlus className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => handleArchive(policy)}
                              className="p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 transition-all"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(policy)}
                          className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
