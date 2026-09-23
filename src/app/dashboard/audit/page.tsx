"use client";

import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AuditLog,
  useGetAuditLogsQuery,
  useLazyVerifyAuditChainQuery,
} from "@/features/audit/api";
import { useGetProfileQuery } from "@/features/user/api";
import { useGetWorkspacesQuery } from "@/features/workspace/api";
import { getPlanEntitlements } from "@/lib/client-entitlements";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Hash,
  Link as LinkIcon,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"];
const RESOURCE_TYPES = ["Document", "Workspace", "User"];
const LIMIT = 20;

type AuditFilterValues = { action: string; resourceType: string };

export default function AuditPage() {
  const { data: workspaces = [], isLoading: wsLoading } = useGetWorkspacesQuery();
  const workspaceId = workspaces[0]?.id;
  const { data: profile } = useGetProfileQuery();
  const [page, setPage] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<AuditLog | null>(null);

  const form = useForm<AuditFilterValues>({
    defaultValues: { action: "", resourceType: "" },
  });
  const { action, resourceType } = form.watch();

  useEffect(() => {
    setPage(1);
  }, [action, resourceType]);

  const [verifyChain, { data: verification, isFetching: isVerifying }] =
    useLazyVerifyAuditChainQuery();

  const isAdmin = profile?.platformRole === "ADMIN";
  const planLimits = getPlanEntitlements(profile?.subscriptionPlan, isAdmin);
  const isAuditGated = !planLimits.hasAuditLogs;

  const {
    data,
    isLoading,
    isError: isAuditError,
  } = useGetAuditLogsQuery(
    {
      workspaceId: workspaceId!,
      page,
      limit: LIMIT,
      ...(action && { action }),
      ...(resourceType && { resourceType }),
    },
    { skip: !workspaceId || isAuditGated }
  );

  const handleVerifyChain = async () => {
    if (!workspaceId) return;
    try {
      const res = await verifyChain(workspaceId).unwrap();
      if (res.valid) {
        toast.success(
          `Audit chain verified: ${res.verifiedCount} cryptographic blocks validated with zero discrepancies.`
        );
      } else {
        toast.error(`Tamper detected! ${res.error || "Chain integrity broken."}`);
      }
    } catch {
      toast.error("Failed to verify audit ledger chain.");
    }
  };

  const totalPages = data ? Math.ceil(data.meta.total / LIMIT) : 0;

  if (wsLoading || (isLoading && !isAuditGated)) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <PageSkeleton variant="page-header" />
        <PageSkeleton variant="table" />
      </div>
    );
  }

  if (isAuditGated) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all security and operational actions performed in your workspace.
          </p>
        </div>

        <div className="relative rounded-2xl border bg-card/60 p-12 text-center overflow-hidden flex flex-col items-center justify-center min-h-100">
          <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pro & Enterprise Feature
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Audit Logs are Locked</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
            Detailed activity logs, security tracking, and cryptographic audit records are available
            on Pro and Max plans.
          </p>

          <Button size="lg" onClick={() => setShowUpgradeModal(true)} className="gap-2">
            <Zap className="h-4 w-4" />
            Upgrade Workspace to Unlock
          </Button>

          <UpgradeModal
            open={showUpgradeModal}
            onOpenChange={setShowUpgradeModal}
            title="Unlock Security & Compliance Audit Logs"
            feature="Workspace Audit Logs"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 lg:p-6">
      {isAuditError && (
        <ErrorBanner message="Failed to load audit logs. Please refresh the page." />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit & Governance Ledger</h1>
          <p className="text-muted-foreground text-sm">
            Immutable, SHA-256 cryptographically chained activity trail with actor and timestamp
            attribution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleVerifyChain}
          disabled={isVerifying}
          className="gap-2 shrink-0 border-primary/30 hover:border-primary text-[10px]"
        >
          {isVerifying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          )}
          <span>Verify Ledger Integrity</span>
        </Button>
      </div>

      {/* Cryptographic Ledger Status Banner */}
      {verification && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] ${
            verification.valid
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {verification.valid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {verification.valid
                  ? "Cryptographic Hash Chain: VERIFIED"
                  : "Cryptographic Tampering Detected!"}
              </p>
              <p className="opacity-90 font-mono text-[10px] mt-0.5">
                {verification.valid
                  ? `${verification.verifiedCount} consecutive blocks validated using SHA-256 sequential parent hashing.`
                  : verification.error || "Hash mismatch found in audit chain."}
              </p>
            </div>
          </div>

          {verification.latestHash && (
            <div className="font-mono text-[10px] px-2 py-1 rounded bg-background/50 border border-border/40 shrink-0 self-start sm:self-auto">
              Latest Hash: {verification.latestHash.substring(0, 16)}...
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          {...form.register("action")}
          className="rounded-md border bg-transparent px-3 py-1.5 text-[10px] font-mono"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          {...form.register("resourceType")}
          className="rounded-md border bg-transparent px-3 py-1.5 text-[10px] font-mono"
        >
          <option value="">All Resources</option>
          {RESOURCE_TYPES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
          {data?.meta.total ?? 0} total records
        </span>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl border bg-card overflow-x-auto shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground text-[10px] font-semibold">
              <th className="h-10 px-4 text-left">Timestamp</th>
              <th className="h-10 px-4 text-left">Action</th>
              <th className="h-10 px-4 text-left">Actor</th>
              <th className="h-10 px-4 text-left">Resource</th>
              <th className="h-10 px-4 text-left">Ledger Proof</th>
              <th className="h-10 px-4 text-left">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data?.data.map((log: AuditLog) => {
              const integrity = log.details?._integrity;

              return (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground whitespace-nowrap text-[10px] font-mono">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted font-mono uppercase tracking-wider font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-foreground">
                        {log.actor?.name || log.actor?.email?.split("@")[0] || "User"}
                      </span>
                      {log.actor?.email && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-40">
                          {log.actor.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-foreground">
                        {log.resourceType}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-44">
                        {log.resourceId ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {integrity ? (
                      <button
                        type="button"
                        onClick={() => setSelectedProof(log)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-[10px] font-mono"
                        title="Click to view full SHA-256 cryptographic proof"
                      >
                        <Fingerprint className="h-3 w-3" />
                        <span>#{integrity.sequence}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {integrity.hash.substring(0, 6)}...
                        </span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 font-mono italic">
                        Legacy Log
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-[10px]">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              );
            })}
            {(!data?.data || data.data.length === 0) && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Shield}
                    title="No audit logs found"
                    description="Actions matching your current filters will appear here."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-[10px] text-muted-foreground font-mono">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Cryptographic Proof Inspection Dialog */}
      <Dialog
        open={Boolean(selectedProof)}
        onOpenChange={(open) => {
          if (!open) setSelectedProof(null);
        }}
      >
        <DialogContent className="max-w-xl bg-background border-border/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Fingerprint className="h-4 w-4 text-primary" />
              <span>Cryptographic Block Proof</span>
            </DialogTitle>
            <DialogDescription className="text-[10px]">
              Tamper-evident verification proof for audit block #
              {selectedProof?.details?._integrity?.sequence}.
            </DialogDescription>
          </DialogHeader>

          {selectedProof?.details?._integrity && (
            <div className="space-y-3 text-[10px] font-mono bg-muted/20 p-4 rounded-xl border border-border/60">
              <div>
                <span className="text-muted-foreground block text-[10px]">Algorithm:</span>
                <span className="text-emerald-500 font-semibold">
                  {selectedProof.details._integrity.algorithm}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Block Sequence:</span>
                <span className="text-foreground font-semibold">
                  Block #{selectedProof.details._integrity.sequence}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">
                  Block Hash (SHA-256):
                </span>
                <span className="text-primary break-all bg-card p-1.5 rounded border border-border/40 block mt-0.5">
                  {selectedProof.details._integrity.hash}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">
                  Parent Block Hash (Previous Chain Link):
                </span>
                <span className="text-muted-foreground break-all bg-card p-1.5 rounded border border-border/40 block mt-0.5">
                  {selectedProof.details._integrity.previousHash}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">
                  Payload Checksum (SHA-256):
                </span>
                <span className="text-muted-foreground break-all bg-card p-1.5 rounded border border-border/40 block mt-0.5">
                  {selectedProof.details._integrity.payloadChecksum}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px]">Sealed At:</span>
                <span className="text-foreground">
                  {new Date(selectedProof.details._integrity.timestamp).toUTCString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px]"
              onClick={() => setSelectedProof(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
