"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateAiContentMutation } from "@/features/document/api";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/core";
import {
  Check,
  Code2,
  Copy,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

interface AiAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor?: Editor | null;
  workspaceId: string;
  documentTitle?: string;
}

type AiMode = "generate" | "summarize" | "explain_code" | "improve";

const MODE_PRESETS: Array<{
  id: AiMode;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}> = [
  {
    id: "generate",
    label: "Draft Docs",
    icon: Wand2,
    placeholder: "e.g. Write an API spec for a User Authentication service with endpoints...",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: FileText,
    placeholder: "Summarize this document into a concise executive summary...",
  },
  {
    id: "explain_code",
    label: "Explain Code",
    icon: Code2,
    placeholder: "Paste or select a code block to explain its logic and complexity...",
  },
  {
    id: "improve",
    label: "Polish Writing",
    icon: Sparkles,
    placeholder: "Refine tone, fix formatting, and enhance developer clarity...",
  },
];

export function AiAssistantModal({
  open,
  onOpenChange,
  editor,
  workspaceId,
  documentTitle,
}: AiAssistantModalProps) {
  const [mode, setMode] = useState<AiMode>("generate");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const [generateAi, { isLoading }] = useGenerateAiContentMutation();

  const handleGenerate = async () => {
    try {
      let context = "";
      if (editor) {
        const { from, to, empty } = editor.state.selection;
        if (!empty) {
          context = editor.state.doc.textBetween(from, to, "\n");
        } else {
          context = editor.getText();
        }
      }

      const res = await generateAi({
        workspaceId,
        mode,
        prompt: prompt.trim() || undefined,
        context: context.trim() || undefined,
      }).unwrap();

      setResult(res.result);
      toast.success("AI generated successfully!");
    } catch {
      toast.error("Failed to generate AI content. Please try again.");
    }
  };

  const handleInsert = () => {
    if (!editor || !result) return;
    editor.chain().focus().insertContent(result).run();
    toast.success("Content inserted into document.");
    onOpenChange(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("Copied to clipboard.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-500 border border-indigo-500/30">
              <Sparkles className="h-5 w-5 animate-pulse text-indigo-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                CodeVault Copilot
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  AI Assistant
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Draft specifications, summarize revisions, and generate developer documentation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Selector Chips */}
        <div className="flex flex-wrap gap-2 pt-3 shrink-0">
          {MODE_PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = mode === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setMode(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Prompt Input */}
        <div className="pt-3 shrink-0 space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={
              MODE_PRESETS.find((p) => p.id === mode)?.placeholder ||
              "Enter your prompt or instruction..."
            }
            className="w-full rounded-xl border border-border/70 bg-card p-3 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 resize-none font-sans"
          />

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">
              {editor && !editor.state.selection.empty
                ? "Using selected text as context"
                : "Using entire document content as context"}
            </span>

            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs font-semibold px-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result Preview Box */}
        {result && (
          <div className="flex-1 min-h-35 overflow-y-auto mt-4 rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-500" /> Output Preview
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>

            <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground">
              {result}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {result && (
          <DialogFooter className="gap-2 sm:gap-0 mt-4 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setResult("")}>
              Clear
            </Button>
            <Button size="sm" onClick={handleInsert} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Insert into Document
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
