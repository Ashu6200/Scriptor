"use client";

import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { QuotaBanner } from "@/components/ui/QuotaBanner";
import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type DocumentTreeItem,
  useCreateDocumentMutation,
  useGetDocumentTreeQuery,
  useGetDocumentsQuery,
} from "@/features/document/api";
import { useGetProfileQuery } from "@/features/user/api";
import { useGetWorkspacesQuery } from "@/features/workspace/api";
import { getPlanEntitlements } from "@/lib/client-entitlements";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function DocumentsPage() {
  const {
    data: workspaces = [],
    isLoading: isLoadingWorkspaces,
    isError: isWsError,
  } = useGetWorkspacesQuery();
  const { data: profile } = useGetProfileQuery();

  const primaryWorkspace = workspaces[0];
  const activeWsId = primaryWorkspace?.id || "all";

  const {
    data,
    isLoading: isLoadingDocuments,
    isError: isDocsError,
  } = useGetDocumentsQuery({
    workspaceId: activeWsId,
    authorId: profile?.id,
  });
  const { data: tree } = useGetDocumentTreeQuery(activeWsId);
  const [createDocument] = useCreateDocumentMutation();
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [viewMode, setViewMode] = useState<"grid" | "tree">("grid");

  const isLoading = isLoadingWorkspaces || isLoadingDocuments;
  const documents = data?.data || [];

  const isAdmin = profile?.platformRole === "ADMIN";
  const planLimits = getPlanEntitlements(profile?.subscriptionPlan, isAdmin);
  const isAtDocLimit = documents.length >= planLimits.maxDocuments;

  const handleNewDocumentClick = () => {
    if (isAtDocLimit) {
      setShowUpgradeModal(true);
    } else {
      setShowCreateDoc(true);
    }
  };

  const handleCreate = async () => {
    if (!docTitle.trim() || !primaryWorkspace?.id) return;
    try {
      await createDocument({ workspaceId: primaryWorkspace.id, title: docTitle.trim() }).unwrap();
      toast.success("Document created.");
      setDocTitle("Untitled Document");
      setShowCreateDoc(false);
    } catch (err: unknown) {
      const errorObj = err as { status?: number };
      if (errorObj?.status === 402) {
        setShowCreateDoc(false);
        setShowUpgradeModal(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageSkeleton variant="page-header" />
        <PageSkeleton variant="cards-grid" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and edit your workspace documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "tree" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Tree view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleNewDocumentClick}>
            {isAtDocLimit ? (
              <Zap className="mr-2 h-4 w-4 text-amber-400 fill-amber-400" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAtDocLimit ? "Upgrade to Create" : "New Document"}
          </Button>
        </div>
      </div>

      {isWsError && <ErrorBanner message="Failed to load workspaces. Please refresh the page." />}
      {isDocsError && <ErrorBanner message="Failed to load documents. Please refresh the page." />}

      <QuotaBanner
        plan={profile?.subscriptionPlan}
        isAdmin={isAdmin}
        currentCount={documents.length}
        type="documents"
        onUpgradeClick={() => setShowUpgradeModal(true)}
      />

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/dashboard/documents/${doc.id}`}
              className="group flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold leading-none">{doc.title}</h3>
                <p className="text-[10px] text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
          {documents.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Create your first document to start building your knowledge base."
                action={{ label: "New Document", onClick: handleNewDocumentClick }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border">
          {tree && tree.length > 0 ? (
            tree.map((item) => <TreeRow key={item.id} item={item} depth={0} />)
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No documents yet"
              description="Create your first document to start building your knowledge base."
              action={{ label: "New Document", onClick: handleNewDocumentClick }}
            />
          )}
        </div>
      )}

      <BottomDrawer
        open={showCreateDoc}
        onOpenChange={setShowCreateDoc}
        title="Create Document"
        description="Add a new document to your workspace."
        footer={
          <Button onClick={handleCreate} disabled={!docTitle.trim()} className="w-full">
            Create Document
          </Button>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="doc-title">Document Title</Label>
          <Input
            id="doc-title"
            placeholder="Untitled Document"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
      </BottomDrawer>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="Document Limit Reached"
        description={`Your ${profile?.subscriptionPlan || "FREE"} plan allows up to ${planLimits.maxDocuments} documents.`}
        feature="Unlimited Documents"
      />
    </div>
  );
}

function TreeRow({ item, depth }: { item: DocumentTreeItem; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
        style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Link
          href={`/dashboard/documents/${item.id}`}
          className="flex-1 text-sm font-semibold hover:text-primary transition-colors truncate"
        >
          {item.title}
        </Link>
      </div>
      {hasChildren &&
        open &&
        item.children.map((child) => <TreeRow key={child.id} item={child} depth={depth + 1} />)}
    </div>
  );
}
