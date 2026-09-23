"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, GitFork, History, LayoutGrid, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

const PLAN_ENTITLEMENTS = {
  FREE: {
    maxWorkspaces: 1,
    maxDocuments: 30,
    versionHistoryDays: 7,
    hasAuditLogs: false,
    hasTrash: false,
    hasMermaid: false,
    hasAi: false,
  },
  PRO: {
    maxWorkspaces: 5,
    maxDocuments: null,
    versionHistoryDays: 90,
    hasAuditLogs: true,
    hasTrash: true,
    hasMermaid: true,
    hasAi: false,
  },
  MAX: {
    maxWorkspaces: null,
    maxDocuments: null,
    versionHistoryDays: 365,
    hasAuditLogs: true,
    hasTrash: true,
    hasMermaid: true,
    hasAi: true,
  },
} as const;

interface Props {
  plan: "FREE" | "PRO" | "MAX";
  isLoading: boolean;
}

export function PlanEntitlements({ plan, isLoading }: Props) {
  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  const e = PLAN_ENTITLEMENTS[plan];

  const items = [
    {
      icon: LayoutGrid,
      label: "Workspaces",
      value: e.maxWorkspaces === null ? "Unlimited" : `Up to ${e.maxWorkspaces}`,
    },
    {
      icon: FileText,
      label: "Documents",
      value: e.maxDocuments === null ? "Unlimited" : `Up to ${e.maxDocuments}`,
    },
    {
      icon: History,
      label: "Version history",
      value: `${e.versionHistoryDays} days`,
    },
    {
      icon: ShieldCheck,
      label: "Audit logs",
      value: e.hasAuditLogs ? "Enabled" : "Not available",
      muted: !e.hasAuditLogs,
    },
    {
      icon: Trash2,
      label: "Trash & Recovery",
      value: e.hasTrash ? "Enabled" : "Pro & Max only",
      muted: !e.hasTrash,
    },
    {
      icon: GitFork,
      label: "Mermaid Diagrams",
      value: e.hasMermaid ? "Enabled" : "Pro & Max only",
      muted: !e.hasMermaid,
    },
    {
      icon: Sparkles,
      label: "AI Copilot",
      value: e.hasAi ? "Unlimited" : "Max plan only",
      muted: !e.hasAi,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your {plan} Plan Includes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map(({ icon: Icon, label, value, muted }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
              </div>
              <span
                className={`text-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
