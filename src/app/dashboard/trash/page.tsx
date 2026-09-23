"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type TrashDocument,
  useEmptyTrashMutation,
  useGetTrashDocumentsQuery,
  usePermanentlyDeleteDocumentMutation,
  useRestoreDocumentMutation,
} from "@/features/document/api";
import { useGetWorkspacesQuery } from "@/features/workspace/api";
import { useGetProfileQuery } from "@/features/user/api";
import { getPlanEntitlements } from "@/lib/client-entitlements";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function TrashPage() {
  const { data: workspaces = [] } = useGetWorkspacesQuery();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeWorkspaceId =
    selectedWorkspaceId === "all"
      ? workspaces[0]?.id || "all"
      : selectedWorkspaceId;

  const { data: profile } = useGetProfileQuery();
  const isAdmin = profile?.platformRole === "ADMIN";
  const planLimits = getPlanEntitlements(profile?.subscriptionPlan, isAdmin);
  const isTrashGated = !planLimits.hasTrash;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const {
    data: trashItems = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetTrashDocumentsQuery(
    { workspaceId: selectedWorkspaceId },
    { skip: !selectedWorkspaceId || isTrashGated }
  );

  const [restoreDocument, { isLoading: isRestoring }] = useRestoreDocumentMutation();
  const [permanentlyDelete, { isLoading: isDeletingPermanent }] =
    usePermanentlyDeleteDocumentMutation();
  const [emptyTrash, { isLoading: isEmptying }] = useEmptyTrashMutation();

  const [documentToDelete, setDocumentToDelete] = useState<TrashDocument | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const filteredItems = useMemo(() => {
    return trashItems.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [trashItems, searchQuery]);

  const handleRestore = async (item: TrashDocument) => {
    try {
      await restoreDocument({
        workspaceId: item.workspaceId,
        id: item.id,
      }).unwrap();
      toast.success(`"${item.title}" restored successfully.`, {
        action: {
          label: "Open",
          onClick: () => {
            window.location.href = `/dashboard/documents/${item.id}`;
          },
        },
      });
    } catch {
      toast.error("Failed to restore document.");
    }
  };

  const handlePermanentDelete = async () => {
    if (!documentToDelete) return;
    try {
      await permanentlyDelete({
        workspaceId: documentToDelete.workspaceId,
        id: documentToDelete.id,
      }).unwrap();
      toast.success("Document permanently deleted.");
      setDocumentToDelete(null);
    } catch {
      toast.error("Failed to delete document permanently.");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const res = await emptyTrash({
        workspaceId: activeWorkspaceId,
      }).unwrap();
      toast.success(`Trash emptied (${res.count} documents removed).`);
      setShowEmptyConfirm(false);
    } catch {
      toast.error("Failed to empty trash.");
    }
  };

  if (isTrashGated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="p-4 rounded-full bg-muted/60 text-muted-foreground mb-4 border border-border/60">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          Pro & Max Feature
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Trash & Document Recovery is Locked</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
          Safeguard your knowledge base with soft-delete retention, one-click document restoration, and
          permanent purge controls available on Pro and Max plans.
        </p>
        <Button size="lg" onClick={() => setShowUpgradeModal(true)} className="gap-2">
          <Zap className="h-4 w-4" />
          Upgrade Workspace to Unlock
        </Button>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          title="Unlock Trash & Document Recovery"
          feature="Trash & Document Recovery"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-destructive/80" /> Trash & Recovery
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Documents remain in trash until restored or permanently purged.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>

          {trashItems.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmptyConfirm(true)}
              disabled={isEmptying}
              className="h-9 gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Empty Trash
            </Button>
          )}
        </div>
      </div>

      {/* Workspace Selector & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deleted documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card/60"
          />
        </div>

        {workspaces.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border/60 bg-card text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-48"
            >
              <option value="all">All Workspaces</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Loading deleted items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-card/30">
          <div className="p-4 rounded-full bg-muted/60 text-muted-foreground mb-4">
            <Trash2 className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Trash is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            {searchQuery
              ? `No deleted documents matched "${searchQuery}".`
              : "No documents have been soft-deleted. Deleted docs will appear here for recovery."}
          </p>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Documents
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all duration-150 gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2.5 rounded-lg bg-muted/80 text-muted-foreground shrink-0 mt-0.5">
                  <FileText className="h-5 w-5 text-muted-foreground/70" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 className="text-base font-semibold text-foreground truncate">
                    {item.title || "Untitled Document"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {item.workspace && (
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <Building2 className="h-3 w-3" /> {item.workspace.name}
                      </span>
                    )}
                    {item.parent && (
                      <span className="text-muted-foreground/60">
                        Parent: {item.parent.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      Deleted{" "}
                      {formatDistanceToNow(new Date(item.deletedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item)}
                  disabled={isRestoring}
                  className="h-8 text-xs font-semibold gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumentToDelete(item)}
                  disabled={isDeletingPermanent}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Purge
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal: Delete Permanently */}
      <Dialog
        open={Boolean(documentToDelete)}
        onOpenChange={(open) => {
          if (!open) setDocumentToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Permanently Delete?
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs">
              Are you sure you want to permanently delete{" "}
              <strong>"{documentToDelete?.title}"</strong>? This will purge all revision
              history, comments, and attachments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDocumentToDelete(null)}
              disabled={isDeletingPermanent}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handlePermanentDelete}
              disabled={isDeletingPermanent}
            >
              {isDeletingPermanent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Purging...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal: Empty Trash */}
      <Dialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Empty Entire Trash?
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs">
              This will permanently purge all {trashItems.length} deleted documents in this
              workspace. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmptyConfirm(false)}
              disabled={isEmptying}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmptyTrash}
              disabled={isEmptying}
            >
              {isEmptying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Emptying...
                </>
              ) : (
                "Empty Trash Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
