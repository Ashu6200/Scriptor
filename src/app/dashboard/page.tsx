"use client";

import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useGetDocumentsQuery } from "@/features/document/api";
import { useGetProfileQuery } from "@/features/user/api";
import { useGetWorkspacesQuery } from "@/features/workspace/api";
import { Activity, BookOpen, FileText, LayoutGrid, TrendingUp } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const { data: workspaces = [], isLoading: wsLoading } = useGetWorkspacesQuery();
  const { data: profile } = useGetProfileQuery();
  const primaryWorkspaceId = workspaces[0]?.id;
  const { data: docsData, isLoading: docsLoading } = useGetDocumentsQuery(
    { workspaceId: primaryWorkspaceId ?? "all", authorId: profile?.id },
    { skip: !primaryWorkspaceId }
  );

  const totalDocs = docsData?.data?.length ?? 0;
  const totalWorkspaces = workspaces.length;
  const isLoading = wsLoading || docsLoading;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <WelcomeModal />
      <PageHeader title="Dashboard" badge={{ label: "Live", color: "live" }} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:border-border/80 hover:shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Documents
            </p>
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl lg:text-3xl font-bold font-mono text-foreground leading-none">
              {totalDocs.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" /> Across all workspaces
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:border-border/80 hover:shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspaces
            </p>
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
          </div>
          {wsLoading ? (
            <div className="h-8 w-10 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl lg:text-3xl font-bold font-mono text-foreground leading-none">
              {totalWorkspaces}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1">
            <Activity className="h-3 w-3 text-emerald-500" /> Active workspaces
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:border-border/80 hover:shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              API Calls Today
            </p>
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-mono text-muted-foreground leading-none">
            —
          </p>
          <p className="text-xs text-muted-foreground mt-2.5">Usage analytics coming soon</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Document Activity</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
              Sample data
            </span>
          </div>
          <div className="h-48 flex items-end gap-3 px-2">
            {days.map((day, i) => {
              const seed = (i * 13 + 7) % 40;
              const height = 30 + seed + (i === 4 ? 25 : 0);
              const isPeak = i === 4;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      backgroundColor: isPeak ? "#ff5e1f" : "#ff7038",
                      opacity: isPeak ? 1 : 0.65 + (seed / 40) * 0.25,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono px-2">
            {days.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Quick Stats
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Documents</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {isLoading ? "—" : totalDocs.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Workspaces</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {wsLoading ? "—" : totalWorkspaces}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Plan</span>
              <span className="text-sm font-bold font-mono text-foreground capitalize">
                {profile?.subscriptionPlan ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Role</span>
              <span className="text-sm font-bold font-mono text-foreground capitalize">
                {profile?.platformRole?.toLowerCase() ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
