"use client";

import {
  useGetAdminWorkspacesQuery,
  useSuspendWorkspaceMutation,
  useUnsuspendWorkspaceMutation,
} from "@/features/admin/api";
import { Input } from "@/components/ui/input";
import { Ban, CheckCircle2, ChevronLeft, ChevronRight, Crown, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-muted text-muted-foreground border border-border",
  PRO: "bg-primary/10 text-primary ring-1 ring-primary/20",
  MAX: "bg-purple-500/10 text-purple-500 dark:text-purple-400 ring-1 ring-purple-500/20",
};

type WorkspaceFilterValues = { search: string; plan: string };

export default function AdminWorkspacesPage() {
  const [page, setPage] = useState(1);

  const form = useForm<WorkspaceFilterValues>({
    defaultValues: { search: "", plan: "" },
  });
  const { search, plan } = form.watch();

  useEffect(() => {
    setPage(1);
  }, [search, plan]);

  const { data, isLoading } = useGetAdminWorkspacesQuery({
    page,
    limit: 20,
    search: search || undefined,
    plan: plan || undefined,
  });
  const [suspendWorkspace] = useSuspendWorkspaceMutation();
  const [unsuspendWorkspace] = useUnsuspendWorkspaceMutation();

  const workspaces = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Workspace Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-tenant workspace directory with plan overrides
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-70">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name or slug..."
            className="pl-10 pr-4 h-10 bg-card"
            {...form.register("search")}
          />
        </div>
        <select
          {...form.register("plan")}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="MAX">Max</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Workspace
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Owner
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Docs
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      Loading workspaces...
                    </span>
                  </td>
                </tr>
              ) : workspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No workspaces found
                  </td>
                </tr>
              ) : (
                workspaces.map((ws) => (
                  <tr key={ws.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-foreground font-semibold">{ws.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{ws.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-muted-foreground text-xs">
                          {ws.owner.name || ws.owner.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          PLAN_COLORS[ws.owner.subscriptionPlan] || PLAN_COLORS.FREE
                        }`}
                      >
                        {ws.owner.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-muted-foreground">{ws._count.documents}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          ws.suspendedAt
                            ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                            : "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            ws.suspendedAt ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                        />
                        {ws.suspendedAt ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {ws.suspendedAt ? (
                          <button
                            onClick={() => unsuspendWorkspace(ws.id)}
                            title="Unsuspend Workspace"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendWorkspace(ws.id)}
                            title="Suspend Workspace"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages} · {meta.total} workspaces
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.hasMore}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition"
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
