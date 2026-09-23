"use client";

import { VersionDiffViewer } from "@/components/documents/VersionDiffViewer";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type DocumentTreeItem,
  type DocumentVersion,
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentQuery,
  useGetDocumentTreeQuery,
  useGetDocumentVersionsQuery,
  useUpdateDocumentMutation,
} from "@/features/document/api";
import { CommentsPanel } from "@/features/document/components/CommentsPanel";
import { AiAssistantModal } from "@/features/document/components/AiAssistantModal";
import { Editor } from "@/features/document/components/Editor";
import { TableOfContents } from "@/features/document/components/TableOfContents";
import { Toolbar } from "@/features/document/components/Toolbar";
import { downloadFile, tiptapToMarkdown, tiptapToPlainText } from "@/features/document/export";
import { useGetProfileQuery } from "@/features/user/api";
import { useGetWorkspacesQuery } from "@/features/workspace/api";
import { useAutosave } from "@/hooks/useAutosave";
import { cn } from "@/lib/utils";
import { type JSONContent, generateHTML } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  GitCompare,
  Globe,
  Lock,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const previewExtensions = [
  StarterKit,
  Underline,
  TiptapLink,
  Image,
  Highlight,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

function jsonToHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const json = JSON.parse(raw);
    return generateHTML(json, previewExtensions);
  } catch {
    return raw;
  }
}

function extractTextFromJson(node: JSONContent | string | null | undefined): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromJson).join(" ");
  }
  return "";
}

function getDocumentStats(rawContent: string | null | undefined) {
  if (!rawContent) return { wordCount: 0, readTime: 0 };
  let text = "";
  try {
    const json = JSON.parse(rawContent);
    text = extractTextFromJson(json);
  } catch {
    text = rawContent.replace(/<[^>]*>/g, " ");
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  return { wordCount: words, readTime };
}

function getDocEmoji(visibility: string | undefined): string {
  if (visibility === "PUBLIC") return "🌐";
  return "📄";
}

function flattenTree(items: DocumentTreeItem[]): DocumentTreeItem[] {
  const result: DocumentTreeItem[] = [];
  function walk(nodes: DocumentTreeItem[]) {
    for (const n of nodes) {
      result.push(n);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(items);
  return result;
}

function containsDoc(item: DocumentTreeItem, targetId: string): boolean {
  if (item.id === targetId) return true;
  return item.children?.some((child) => containsDoc(child, targetId)) ?? false;
}

function findRootAncestor(tree: DocumentTreeItem[], targetId: string): DocumentTreeItem | null {
  for (const item of tree) {
    if (containsDoc(item, targetId)) return item;
  }
  return null;
}

export default function DocumentEditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: document, isLoading } = useGetDocumentQuery(
    { workspaceId: "all", id },
    { skip: !id }
  );
  const docWorkspaceId = document?.workspaceId ?? "all";
  const { data: tree } = useGetDocumentTreeQuery(docWorkspaceId, {
    skip: !docWorkspaceId || docWorkspaceId === "all",
  });
  const relevantTree = useMemo(() => {
    const rootAncestor = tree ? findRootAncestor(tree, id) : null;
    return rootAncestor ? [rootAncestor] : (tree ?? []);
  }, [tree, id]);
  const flatList = useMemo(() => flattenTree(relevantTree), [relevantTree]);
  const [updateDocument] = useUpdateDocumentMutation();
  const [createDocument] = useCreateDocumentMutation();
  const { data: profile } = useGetProfileQuery();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  const [savedContent, setSavedContent] = useState<string | null>(null);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("saved");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleOpenAi = () => setShowAiModal(true);
    window.addEventListener("codevault:open-ai-modal", handleOpenAi);
    return () => window.removeEventListener("codevault:open-ai-modal", handleOpenAi);
  }, []);

  const [title, setTitle] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titleInitialized = useRef(false);

  useEffect(() => {
    if (document?.title && !titleInitialized.current) {
      setTitle(document.title);
      titleInitialized.current = true;
    }
  }, [document?.title]);

  const saveTitle = useAutosave(async (newTitle: string) => {
    setSaveIndicator("saving");
    try {
      await updateDocument({ workspaceId: docWorkspaceId, id, title: newTitle });
      setSaveIndicator("saved");
    } catch {
      setSaveIndicator("idle");
      toast.error("Failed to save title");
    }
  }, 800);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    saveTitle(e.target.value);
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const editable = window.document.querySelector(".notion-editable .tiptap") as HTMLElement;
      editable?.focus();
    }
  };

  const save = useCallback(
    async (content: string) => {
      setSaveIndicator("saving");
      setSavedContent(content);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`doc_draft_${id}`, content);
        } catch {}
      }
      try {
        await updateDocument({ workspaceId: docWorkspaceId, id, content });
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(`doc_draft_${id}`);
          } catch {}
        }
        setSaveIndicator("saved");
      } catch {
        setSaveIndicator("idle");
        toast.error("Autosave failed — changes may not be saved");
      }
    },
    [updateDocument, docWorkspaceId, id]
  );

  const debouncedSave = useAutosave(save, 1000);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        setSaveIndicator("saving");
        setTimeout(() => setSaveIndicator("saved"), 800);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const stats = useMemo(
    () => getDocumentStats(savedContent ?? document?.content),
    [savedContent, document?.content]
  );

  const handleCreateSubDoc = async () => {
    if (!docWorkspaceId || docWorkspaceId === "all") return;
    try {
      const result = await createDocument({
        workspaceId: docWorkspaceId,
        title: "Untitled Subpage",
        parentId: id,
      }).unwrap();
      if (result?.id) {
        router.push(`/dashboard/documents/${result.id}`);
      }
    } catch {
      toast.error("Failed to create subpage");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground bg-background p-4 lg:p-6">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-[10px] font-semibold tracking-wide uppercase">
          Loading Document...
        </span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center bg-background p-6">
        <div className="p-4 rounded-2xl bg-muted/50 border border-border">
          <FileText className="h-10 w-10 text-muted-foreground/60" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Document not found</h2>
          <p className="text-[10px] text-muted-foreground max-w-sm">
            This document might have been removed or you don&apos;t have permission to view it.
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/dashboard/documents")}>
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-background text-foreground relative">
      <aside
        className={cn(
          "shrink-0 transition-all duration-300 ease-in-out border-r border-border/60 bg-card flex flex-col relative z-10",
          sidebarOpen ? "w-64 opacity-100" : "w-0 overflow-hidden border-none opacity-0"
        )}
      >
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[10px] text-muted-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground tracking-tight">Navigation</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-mono">
              {flatList.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            title="Collapse Sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <DocTreeNav tree={relevantTree} currentId={id} workspaceId={docWorkspaceId} />
        </div>

        <div className="p-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateSubDoc}
            className="w-full justify-start text-[10px] gap-2 text-muted-foreground hover:text-foreground border-dashed"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Subpage
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-13 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 z-10 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((p) => !p)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-4 mx-0.5 shrink-0" />

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0 overflow-hidden">
              <span className="hidden sm:flex items-center gap-1 text-muted-foreground/70 shrink-0">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-20">Docs</span>
              </span>
              {document.parent && (
                <>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 hidden sm:inline" />
                  <Link
                    href={`/dashboard/documents/${document.parent.id}`}
                    className="hover:text-foreground transition-colors truncate max-w-24 shrink"
                  >
                    {document.parent.title}
                  </Link>
                </>
              )}
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              <span className="text-foreground font-semibold truncate max-w-36">
                {title || "Untitled"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-1 shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={saveIndicator}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 border border-border/60 px-2.5 py-1 rounded-full font-mono shrink-0"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      saveIndicator === "saving" ? "bg-amber-400 animate-ping" : "bg-emerald-500"
                    )}
                  />
                  <span>{saveIndicator === "saving" ? "Saving..." : "Saved"}</span>
                </motion.div>
              </AnimatePresence>

              <div className="hidden xl:flex items-center gap-2 text-[10px] text-muted-foreground/70 font-mono shrink-0">
                <span>{stats.wordCount} words</span>
                <span>•</span>
                <span>{stats.readTime} min read</span>
                <span className="hidden 2xl:inline">
                  Update:{" "}
                  {formatDistanceToNow(new Date(document.updatedAt || document.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowShare(true)}
              className={cn(
                "hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors",
                document.visibility === "PUBLIC"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                  : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
              )}
            >
              {document.visibility === "PUBLIC" ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </button>

            <div className="flex items-center gap-1 border-l border-border/50 pl-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={showToc ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setShowToc((p) => !p)}
                      className="h-8 px-2.5 text-[10px] gap-1.5"
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Outline</span>
                    </Button>
                  }
                />
                <TooltipContent>Table of Contents</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHistory(true)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <TooltipContent>Version History</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={showComments ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setShowComments((p) => !p)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <TooltipContent>Comments</TooltipContent>
              </Tooltip>

              {/* AI Copilot feature commented out (not implemented yet / pending API credentials)
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiModal(true)}
                className="h-8 px-2.5 text-[10px] gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                <span className="hidden sm:inline font-semibold">Ask AI</span>
              </Button>
              */}

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowShare(true)}
                className="h-8 px-3 text-[10px] gap-1.5 bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer outline-none">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-[10px]">
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{isCopied ? "Link Copied!" : "Copy Document Link"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowHistory(true)}
                    className="gap-2 text-[10px]"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Version History</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCreateSubDoc} className="gap-2 text-[10px]">
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Subpage</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      try {
                        const raw = savedContent ?? document?.content;
                        const json = raw ? JSON.parse(raw) : null;
                        const html = json ? generateHTML(json, previewExtensions) : "";
                        downloadFile(
                          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`,
                          `${title || "document"}.html`,
                          "text/html"
                        );
                      } catch {
                        toast.error("Failed to export as HTML");
                      }
                    }}
                    className="gap-2 text-[10px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export as HTML</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      try {
                        const raw = savedContent ?? document?.content;
                        const json = raw ? JSON.parse(raw) : null;
                        const md = json ? tiptapToMarkdown(json) : "";
                        downloadFile(md, `${title || "document"}.md`, "text/markdown");
                      } catch {
                        toast.error("Failed to export as Markdown");
                      }
                    }}
                    className="gap-2 text-[10px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export as Markdown</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      try {
                        const raw = savedContent ?? document?.content;
                        const json = raw ? JSON.parse(raw) : null;
                        const txt = json ? tiptapToPlainText(json) : "";
                        downloadFile(txt, `${title || "document"}.txt`, "text/plain");
                      } catch {
                        toast.error("Failed to export as plain text");
                      }
                    }}
                    className="gap-2 text-[10px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export as Plain Text</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className={`notion-body flex-1 min-h-0 ${showPreview ? "notion-body--split" : ""}`}>
          <div className="notion-editor-pane flex-1 flex flex-col justify-between overflow-y-auto relative">
            <div>
              {editorInstance && (
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                  <div className="max-w-7xl mx-auto w-full px-2">
                    <Toolbar editor={editorInstance} />
                  </div>
                </div>
              )}

              {showPreview && (
                <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border/50 px-6 py-2 flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <FileCode className="h-3 w-3" /> Editor
                  </span>
                </div>
              )}

              <div className="max-w-7xl mx-auto w-full px-6 pt-8 pb-4">
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="relative group mb-4">
                    <textarea
                      ref={titleRef}
                      value={title}
                      onChange={handleTitleChange}
                      onKeyDown={handleTitleKeyDown}
                      placeholder="Untitled Document"
                      className="w-full border-none outline-none bg-transparent text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground placeholder:text-muted-foreground/30 resize-none overflow-hidden leading-tight"
                      rows={1}
                    />
                  </div>
                </motion.div>
              </div>

              <div className="max-w-7xl mx-auto w-full px-6 pb-8">
                <Editor
                  initialContent={document.content}
                  onSave={debouncedSave}
                  onEditorReady={setEditorInstance}
                />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 bg-background/90 backdrop-blur-md border-t border-border/60 py-3 px-6 shadow-lg shadow-black/5 mt-auto">
              <div className="max-w-7xl mx-auto w-full">
                <PrevNextNav flatList={flatList} currentId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showToc && (
          <>
            {/* Backdrop on screens < 2xl */}
            <motion.div
              key="toc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 2xl:hidden"
              onClick={() => setShowToc(false)}
            />

            <motion.aside
              key="toc-panel"
              className="fixed inset-y-0 right-0 z-40 2xl:relative 2xl:z-10 w-80 shrink-0 border-l border-border/60 bg-background/95 2xl:bg-card/40 backdrop-blur-xl shadow-2xl 2xl:shadow-none flex flex-col h-full overflow-hidden"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {editorInstance ? (
                <TableOfContents editor={editorInstance} onClose={() => setShowToc(false)} />
              ) : (
                <div className="p-6 text-xs text-muted-foreground text-center flex flex-col items-center justify-center h-full gap-2">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading outline...</span>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <HistoryPanel
        workspaceId={docWorkspaceId}
        documentId={id}
        currentDocument={{
          title: title || document?.title || "Untitled",
          content: savedContent || document?.content || "",
        }}
        open={showHistory}
        onOpenChange={setShowHistory}
      />

      <ShareDialog
        workspaceId={docWorkspaceId}
        documentId={id}
        open={showShare}
        onOpenChange={setShowShare}
      />

      {/* AI Assistant modal commented out until AI service is enabled
      <AiAssistantModal
        open={showAiModal}
        onOpenChange={setShowAiModal}
        editor={editorInstance}
        workspaceId={docWorkspaceId}
        documentTitle={title || document?.title}
      />
      */}

      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="right" className="sm:max-w-sm p-0 flex flex-col">
          <CommentsPanel workspaceId={docWorkspaceId} documentId={id} currentUserId={profile?.id} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function HistoryPanel({
  workspaceId,
  documentId,
  currentDocument,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  documentId: string;
  currentDocument: { title: string; content?: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: versions, isLoading } = useGetDocumentVersionsQuery(
    { workspaceId, id: documentId },
    { skip: !open }
  );
  const [updateDocument, { isLoading: isRestoring }] = useUpdateDocumentMutation();
  const [diffVersion, setDiffVersion] = useState<DocumentVersion | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="pb-4 border-b border-border/50">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-primary" /> Version History
            </SheetTitle>
            <SheetDescription className="text-[10px]">
              Review past versions, compare side-by-side diffs, and restore historical snapshots.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
            {isLoading && (
              <div className="py-8 text-center text-[10px] text-muted-foreground">
                Loading revision history...
              </div>
            )}

            {versions?.map((version: DocumentVersion, idx: number) => (
              <div
                key={version.id ?? idx}
                className="relative pl-6 pb-4 border-l border-border/60 last:border-0 last:pb-0"
              >
                <div className="absolute -left-1.25 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1 hover:border-primary/40 transition-colors shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-foreground">
                      Version {version.versionNumber ?? versions.length - idx}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {version.createdAt &&
                        formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>
                  {version.changeSummary ? (
                    <p className="text-[10px] text-muted-foreground">{version.changeSummary}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      Automated snapshot
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 gap-1 text-foreground hover:bg-muted"
                      onClick={() => setDiffVersion(version)}
                    >
                      <GitCompare className="h-3 w-3 text-primary" />
                      <span>Compare Diff</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10"
                      disabled={isRestoring}
                      onClick={() => {
                        void updateDocument({
                          workspaceId,
                          id: documentId,
                          content: version.content,
                          title: version.title,
                          changeSummary: `Restored to v${version.versionNumber ?? versions?.length - idx}`,
                        });
                        onOpenChange(false);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {!isLoading && (!versions || versions.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Clock className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-[10px] text-muted-foreground font-semibold">
                  No previous versions saved yet.
                </p>
                <p className="text-[10px] text-muted-foreground/70 max-w-xs">
                  Revisions are automatically captured as you make edits to this document.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <VersionDiffViewer
        open={Boolean(diffVersion)}
        onOpenChange={(openState) => {
          if (!openState) setDiffVersion(null);
        }}
        comparedVersion={diffVersion}
        currentDocument={currentDocument}
        onRestore={(ver) => {
          void updateDocument({
            workspaceId,
            id: documentId,
            content: ver.content,
            title: ver.title,
            changeSummary: `Restored to v${ver.versionNumber}`,
          });
          onOpenChange(false);
        }}
        isRestoring={isRestoring}
      />
    </>
  );
}

function ShareDialog({
  workspaceId,
  documentId,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: document } = useGetDocumentQuery({ workspaceId, id: documentId }, { skip: !open });
  const { data: workspaces = [] } = useGetWorkspacesQuery(undefined, { skip: !open });
  const [updateDocument, { isLoading: isUpdating }] = useUpdateDocumentMutation();
  const [isCopiedPublic, setIsCopiedPublic] = useState(false);
  const [isCopiedPrivate, setIsCopiedPrivate] = useState(false);
  const isPublic = document?.visibility === "PUBLIC";

  const toggleVisibility = async () => {
    const nextPublic = !isPublic;
    await updateDocument({
      workspaceId,
      id: documentId,
      visibility: nextPublic ? "PUBLIC" : "PRIVATE",
      isPublished: nextPublic,
    });
  };

  const currentWs = workspaces.find((w) => w.id === workspaceId);
  const wsSlug = currentWs?.slug || workspaceId;
  const docSlug = (document as { slug?: string })?.slug || documentId;

  const publicPortalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${wsSlug}/${docSlug}`
      : "";

  const internalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/documents/${documentId}`
      : "";

  const handleCopyPublic = () => {
    if (publicPortalUrl) {
      navigator.clipboard.writeText(publicPortalUrl);
      setIsCopiedPublic(true);
      setTimeout(() => setIsCopiedPublic(false), 2000);
      toast.success("Public link copied to clipboard!");
    }
  };

  const handleCopyInternal = () => {
    if (internalUrl) {
      navigator.clipboard.writeText(internalUrl);
      setIsCopiedPrivate(true);
      setTimeout(() => setIsCopiedPrivate(false), 2000);
      toast.success("Dashboard link copied!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" /> Publish & Share Document
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage public web publishing and copy shareable links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Public Access Card */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-lg",
                  isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                )}
              >
                {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {isPublic ? "Published to Web" : "Private Document"}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-56 leading-relaxed">
                  {isPublic
                    ? "Anyone with the link can view this documentation portal without signing in."
                    : "Only members of this workspace can view this document."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPublic}
                onCheckedChange={() => void toggleVisibility()}
                disabled={isUpdating}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          {/* Public Documentation Portal Link */}
          {isPublic && (
            <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Public Documentation Portal Link
                </label>
                <a
                  href={publicPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open Page</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicPortalUrl}
                  className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none"
                />
                <Button size="sm" onClick={handleCopyPublic} className="text-xs h-8 gap-1.5 shrink-0">
                  {isCopiedPublic ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Private Internal Link */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Internal Workspace Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={internalUrl}
                className="flex-1 bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1 text-[11px] font-mono text-muted-foreground focus:outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInternal}
                className="text-[11px] h-7 px-2.5 gap-1 shrink-0"
              >
                {isCopiedPrivate ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>Copy</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocTreeNav({
  tree,
  currentId,
  workspaceId = "all",
}: {
  tree?: DocumentTreeItem[];
  currentId: string;
  workspaceId?: string;
}) {
  const [filter, setFilter] = useState("");

  if (!tree?.length) {
    return (
      <div className="p-4 text-center text-[10px] text-muted-foreground">No documents found.</div>
    );
  }

  const filteredTree = filter.trim()
    ? tree.filter((item) => item.title.toLowerCase().includes(filter.toLowerCase()))
    : tree;

  return (
    <div className="space-y-2">
      <div className="relative px-1 pt-1">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Filter documents..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-muted/40 border border-border/40 rounded-md pl-8 pr-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      <nav className="space-y-0.5">
        {filteredTree.map((item) => (
          <DocNavItem
            key={item.id}
            item={item}
            currentId={currentId}
            depth={0}
            workspaceId={workspaceId}
          />
        ))}
      </nav>
    </div>
  );
}

function DocNavItem({
  item,
  currentId,
  depth,
  workspaceId = "all",
}: {
  item: DocumentTreeItem;
  currentId: string;
  depth: number;
  workspaceId?: string;
}) {
  const isActive = item.id === currentId;
  const hasChildren = item.children && item.children.length > 0;
  const [expanded, setExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteDocument({ workspaceId, id: item.id }).unwrap();
      toast.success("Document deleted");
      setShowDeleteConfirm(false);
      if (isActive || containsDoc(item, currentId)) {
        router.push("/dashboard/documents");
      }
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "group/docnav flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] transition-all duration-150 relative",
          isActive
            ? "border-l-2 border-primary bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
        style={{
          paddingLeft: isActive
            ? `calc(${0.5 + depth * 0.75}rem - 2px)`
            : `${0.5 + depth * 0.75}rem`,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
            className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground/60 hover:text-foreground shrink-0"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <FileText
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isActive ? "text-primary" : "text-muted-foreground/60"
            )}
          />
        )}

        <Link href={`/dashboard/documents/${item.id}`} className="flex-1 truncate tracking-tight">
          {item.title || "Untitled"}
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          disabled={isDeleting}
          title="Delete document"
          aria-label={`Delete ${item.title || "document"}`}
          className="opacity-0 group-hover/docnav:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-destructive/15 text-muted-foreground/60 hover:text-destructive transition-all duration-150 shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Document
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{item.title || "Untitled"}</span>?
              This action cannot be undone
              {item.children && item.children.length > 0
                ? " and will also delete its subpages."
                : "."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasChildren && expanded && (
        <div className="border-l border-border/40 ml-3 pl-0.5 my-0.5 space-y-0.5">
          {item.children?.map((child) => (
            <DocNavItem
              key={child.id}
              item={child}
              currentId={currentId}
              depth={depth + 1}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PrevNextNav({
  flatList,
  currentId,
}: {
  flatList: DocumentTreeItem[];
  currentId: string;
}) {
  const idx = flatList.findIndex((d) => d.id === currentId);
  const prev = idx > 0 ? flatList[idx - 1] : null;
  const next = idx >= 0 && idx < flatList.length - 1 ? flatList[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <Link
          href={`/dashboard/documents/${prev.id}`}
          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/80 px-3.5 py-2 hover:border-primary/50 hover:bg-card hover:shadow-xs transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-transform shrink-0" />
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Previous
            </span>
            <span className="text-[10px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {prev.title || "Untitled"}
            </span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/dashboard/documents/${next.id}`}
          className="group flex items-center justify-end gap-3 rounded-lg border border-border/60 bg-card/80 px-3.5 py-2 hover:border-primary/50 hover:bg-card hover:shadow-xs transition-all duration-200 text-right sm:col-start-2"
        >
          <div className="flex flex-col min-w-0 text-right">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Next
            </span>
            <span className="text-[10px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {next.title || "Untitled"}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
