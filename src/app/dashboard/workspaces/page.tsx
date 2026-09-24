"use client";

import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type DocumentTreeItem,
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentTreeQuery,
  useUpdateDocumentMutation,
} from "@/features/document/api";
import {
  type Workspace,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetPinnedWorkspacesQuery,
  useGetWorkspacesQuery,
  useTogglePinWorkspaceApiMutation,
  useUpdateWorkspaceMutation,
} from "@/features/workspace/api";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const wsNameSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name too long"),
});

export default function WorkspacesPage() {
  const { data: workspaces = [], isLoading, isError } = useGetWorkspacesQuery();
  const [createWorkspace] = useCreateWorkspaceMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const createForm = useForm<z.infer<typeof wsNameSchema>>({
    resolver: zodResolver(wsNameSchema),
    defaultValues: { name: "" },
  });

  const onCreateSubmit = async (values: z.infer<typeof wsNameSchema>) => {
    try {
      await createWorkspace({ name: values.name.trim() }).unwrap();
      createForm.reset();
      setShowCreate(false);
      toast.success("Workspace created.");
    } catch (err: unknown) {
      const errorObj = err as { status?: number; data?: { message?: string } };
      if (errorObj?.status === 402) {
        setShowCreate(false);
        setShowUpgradeModal(true);
      } else {
        toast.error(errorObj?.data?.message || "Failed to create workspace");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading workspaces...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">All your workspaces and their document trees.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {isError && <ErrorBanner message="Failed to load workspaces. Please refresh the page." />}

      <div className="grid gap-4">
        {workspaces.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
        {workspaces.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed rounded-xl">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No workspaces yet. Create your first one!</p>
          </div>
        )}
      </div>

      {showCreate && (
        <BottomDrawer
          open={showCreate}
          onOpenChange={setShowCreate}
          title="Create Workspace"
          description="Create a new personal workspace."
          footer={
            <Button onClick={createForm.handleSubmit(onCreateSubmit)} className="w-full">
              Create Workspace
            </Button>
          }
        >
          <Form {...createForm}>
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Workspace"
                      onKeyDown={(e) =>
                        e.key === "Enter" && createForm.handleSubmit(onCreateSubmit)()
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </BottomDrawer>
      )}

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="Workspace Limit Reached"
        description="Free plan allows only 1 workspace. Upgrade to Pro for up to 5 workspaces or Max for unlimited."
      />
    </div>
  );
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [togglePinApi] = useTogglePinWorkspaceApiMutation();
  const { data: pinnedWorkspaces = [] } = useGetPinnedWorkspacesQuery();
  const isPinned = pinnedWorkspaces.some((ws) => ws.id === workspace.id);

  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: tree, isLoading } = useGetDocumentTreeQuery(workspace.id, {
    skip: !isExpanded,
  });

  const [createDoc] = useCreateDocumentMutation();
  const [updateWorkspace] = useUpdateWorkspaceMutation();
  const [deleteWorkspace] = useDeleteWorkspaceMutation();
  const [updateDocument] = useUpdateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const [showEditWs, setShowEditWs] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const editWsForm = useForm<z.infer<typeof wsNameSchema>>({
    resolver: zodResolver(wsNameSchema),
    defaultValues: { name: workspace.name },
  });

  const [editingDoc, setEditingDoc] = useState<{ id: string; title: string } | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");

  const handleCreateRootDoc = async () => {
    try {
      const doc = await createDoc({ workspaceId: workspace.id, title: "Untitled" }).unwrap();
      router.push(`/dashboard/documents/${doc.id}`);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; data?: { message?: string } };
      if (errorObj?.status === 402) {
        toast.error(
          errorObj.data?.message ||
            "Document limit reached. Upgrade to Pro for unlimited documents.",
          {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/dashboard/billing"),
            },
          }
        );
      } else {
        toast.error("Failed to create document");
      }
    }
  };

  const handleAddSubPage = useCallback(
    async (parentId: string) => {
      try {
        await createDoc({ workspaceId: workspace.id, title: "Untitled", parentId }).unwrap();
      } catch (err: unknown) {
        const errorObj = err as { status?: number; data?: { message?: string } };
        if (errorObj?.status === 402) {
          toast.error(
            errorObj.data?.message ||
              "Document limit reached. Upgrade to Pro for unlimited documents.",
            {
              action: {
                label: "Upgrade",
                onClick: () => router.push("/dashboard/billing"),
              },
            }
          );
        } else {
          toast.error("Failed to create subpage");
        }
      }
    },
    [createDoc, workspace.id, router]
  );

  const onEditWsSubmit = async (values: z.infer<typeof wsNameSchema>) => {
    if (values.name.trim() === workspace.name) {
      setShowEditWs(false);
      return;
    }
    await updateWorkspace({ id: workspace.id, data: { name: values.name.trim() } });
    setShowEditWs(false);
  };

  const handleDeleteWs = async () => {
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Workspace deleted");
    } catch {
      toast.error("Failed to delete workspace");
    }
    setShowDeleteConfirm(false);
  };

  const handleStartEditDoc = useCallback((doc: { id: string; title: string }) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
  }, []);

  const handleSaveEditDoc = async () => {
    if (!editingDoc || !editDocTitle.trim() || editDocTitle.trim() === editingDoc.title) {
      setEditingDoc(null);
      return;
    }
    await updateDocument({
      workspaceId: workspace.id,
      id: editingDoc.id,
      title: editDocTitle.trim(),
    });
    setEditingDoc(null);
  };

  const handleDeleteDoc = useCallback(
    async (id: string) => {
      await deleteDocument({ workspaceId: workspace.id, id });
    },
    [deleteDocument, workspace.id]
  );

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleExpand}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={toggleExpand}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                {workspace.name[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold leading-none">{workspace.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{workspace.slug}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                togglePinApi(workspace.id).catch(() => {});
              }}
              title={isPinned ? "Unpin workspace" : "Pin workspace"}
              className={cn("h-8 px-2", isPinned && "text-primary font-semibold")}
            >
              <Pin className={cn("h-4 w-4", isPinned && "fill-primary text-primary rotate-45")} />
              <span className="ml-1.5 text-[10px] hidden sm:inline">
                {isPinned ? "Pinned" : "Pin"}
              </span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCreateRootDoc}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              New Doc
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  editWsForm.reset({ name: workspace.name });
                  setShowEditWs(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="rounded-lg border">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading documents...
              </div>
            ) : tree && tree.length > 0 ? (
              tree.map((item) => (
                <TreeRow
                  key={item.id}
                  item={item}
                  workspaceId={workspace.id}
                  depth={0}
                  onAddSubPage={handleAddSubPage}
                  onEditDoc={handleStartEditDoc}
                  onDeleteDoc={handleDeleteDoc}
                />
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No documents yet
              </div>
            )}
          </div>
        )}
      </div>

      {showEditWs && (
        <BottomDrawer
          open={showEditWs}
          onOpenChange={setShowEditWs}
          title="Rename Workspace"
          footer={
            <Button onClick={editWsForm.handleSubmit(onEditWsSubmit)} className="w-full">
              Save
            </Button>
          }
        >
          <Form {...editWsForm}>
            <FormField
              control={editWsForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      onKeyDown={(e) =>
                        e.key === "Enter" && editWsForm.handleSubmit(onEditWsSubmit)()
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </BottomDrawer>
      )}

      {editingDoc && (
        <BottomDrawer
          open={Boolean(editingDoc)}
          onOpenChange={(open) => !open && setEditingDoc(null)}
          title="Rename Document"
          footer={
            <Button onClick={handleSaveEditDoc} disabled={!editDocTitle.trim()} className="w-full">
              Save
            </Button>
          }
        >
          <div className="space-y-2">
            <Label htmlFor={`doc-edit-${editingDoc.id}`}>Document Title</Label>
            <Input
              id={`doc-edit-${editingDoc.id}`}
              value={editDocTitle}
              onChange={(e) => setEditDocTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEditDoc()}
            />
          </div>
        </BottomDrawer>
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete Workspace
            </DialogTitle>
            <DialogDescription className="text-sm">
              Delete <span className="font-semibold text-foreground">{workspace.name}</span>? This
              will permanently delete all documents in this workspace. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteWs}>
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const TreeRow = memo(function TreeRow({
  item,
  workspaceId,
  depth,
  onAddSubPage,
  onEditDoc,
  onDeleteDoc,
}: {
  item: DocumentTreeItem;
  workspaceId: string;
  depth: number;
  onAddSubPage: (parentId: string) => void;
  onEditDoc: (doc: { id: string; title: string }) => void;
  onDeleteDoc: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(item.children && item.children.length > 0);

  return (
    <>
      <div
        className="group/docrow flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
        style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
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
        <div className="flex items-center gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onAddSubPage(item.id);
            }}
            variant="ghost"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> New Doc
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditDoc({ id: item.id, title: item.title })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteDoc(item.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {hasChildren &&
        open &&
        item.children.map((child) => (
          <TreeRow
            key={child.id}
            item={child}
            workspaceId={workspaceId}
            depth={depth + 1}
            onAddSubPage={onAddSubPage}
            onEditDoc={onEditDoc}
            onDeleteDoc={onDeleteDoc}
          />
        ))}
    </>
  );
});
