"use client";

import {
  useArchivePolicyMutation,
  useGetPolicyQuery,
  usePublishPolicyMutation,
} from "@/features/dpdp/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Calendar,
  Database,
  FileText,
  History,
  Pencil,
  Rocket,
  ScrollText,
  Shield,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ARCHIVED: "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400",
};

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: policy, isLoading } = useGetPolicyQuery(id);
  const [publishPolicy] = usePublishPolicyMutation();
  const [archivePolicy] = useArchivePolicyMutation();

  if (isLoading || !policy) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Loading policy...
        </div>
      </div>
    );
  }

  const latestVersion = policy.versions?.[0];

  const handlePublish = async () => {
    try {
      await publishPolicy(policy.id).unwrap();
      toast.success("Policy published successfully");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to publish");
    }
  };

  const handleArchive = async () => {
    try {
      await archivePolicy(policy.id).unwrap();
      toast.success("Policy archived successfully");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to archive");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/policies"
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <ScrollText className="h-6 w-6 text-primary" />
              {policy.name}
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{policy.key}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              STATUS_COLORS[policy.status]
            )}
          >
            {policy.status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/policies/${policy.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
        <Link
          href={`/admin/policies/${policy.id}/versions`}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
        >
          <History className="h-3.5 w-3.5" />
          Version History
        </Link>
        {policy.status === "DRAFT" && (
          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish
          </button>
        )}
        {policy.status === "PUBLISHED" && (
          <button
            onClick={handleArchive}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-all"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
        )}
      </div>

      {/* DRAFT banner */}
      {policy.status === "DRAFT" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">This policy is a DRAFT</span> — users cannot see it
              yet. Publish it to activate the consent gate.
            </p>
          </div>
          <button
            onClick={handlePublish}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish Now
          </button>
        </div>
      )}

      {/* Policy Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Tag className="h-3.5 w-3.5" />
            Policy Metadata
          </h3>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm text-foreground">{policy.description || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm text-foreground">
                {format(new Date(policy.createdAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm text-foreground">
                {format(new Date(policy.updatedAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
        </div>

        {latestVersion && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Latest Version (v{latestVersion.version})
            </h3>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                    STATUS_COLORS[latestVersion.status]
                  )}
                >
                  {latestVersion.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Policy Type</p>
                <p className="text-sm text-foreground">
                  {latestVersion.consentRequired
                    ? "Optional — user can accept or decline"
                    : "Essential — required to use the service"}
                </p>
              </div>
              {latestVersion.publishedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-sm text-foreground">
                    {format(new Date(latestVersion.publishedAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version Details */}
      {latestVersion && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Version {latestVersion.version} — Processing Details
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Purpose
              </p>
              <p className="text-sm text-foreground">{latestVersion.purpose}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Data Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {latestVersion.dataCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    <Database className="h-3 w-3" />
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Processing Description
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {latestVersion.processingDescription}
              </p>
            </div>

            {latestVersion.retentionPeriod && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Retention Period
                </p>
                <p className="text-sm text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {latestVersion.retentionPeriod}
                </p>
              </div>
            )}

            {latestVersion.content && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Full Policy Content
                </p>
                <div className="rounded-lg bg-muted/30 border border-border p-4 text-sm text-foreground whitespace-pre-wrap font-mono max-h-75 overflow-y-auto">
                  {latestVersion.content}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
