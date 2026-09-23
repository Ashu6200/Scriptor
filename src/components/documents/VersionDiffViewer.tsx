"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DocumentVersion } from "@/features/document/api";
import { computeLineDiff } from "@/lib/diff";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeftRight, Check, Columns2, GitCompare, RotateCcw, Rows2 } from "lucide-react";
import React, { useMemo, useState } from "react";

function extractPlainText(content: string): string {
  if (!content) return "";
  try {
    const doc = JSON.parse(content);
    if (typeof doc !== "object" || !doc.type) return content;
    const lines: string[] = [];
    function walk(node: { type: string; text?: string; content?: unknown[] }) {
      if (node.type === "text" && typeof node.text === "string") {
        lines.push(node.text);
      }
      if (Array.isArray(node.content)) {
        const isBlock = [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "listItem",
          "blockquote",
          "codeBlock",
          "horizontalRule",
        ].includes(node.type);
        for (const child of node.content) {
          walk(child as typeof node);
        }
        if (isBlock) lines.push("\n");
      }
    }
    walk(doc);
    return lines.join("").trim();
  } catch {
    return content;
  }
}

interface VersionDiffViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparedVersion: DocumentVersion | null;
  currentDocument: { title: string; content?: string | null };
  onRestore?: (version: DocumentVersion) => void;
  isRestoring?: boolean;
}

export function VersionDiffViewer({
  open,
  onOpenChange,
  comparedVersion,
  currentDocument,
  onRestore,
  isRestoring = false,
}: VersionDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");

  const diffResult = useMemo(() => {
    if (!comparedVersion) {
      return {
        additions: 0,
        deletions: 0,
        totalChanges: 0,
        unified: [],
        sideBySide: [],
        hasChanges: false,
      };
    }
    const oldContent = extractPlainText(comparedVersion.content || "");
    const newContent = extractPlainText(currentDocument.content || "");
    return computeLineDiff(oldContent, newContent);
  }, [comparedVersion, currentDocument.content]);

  if (!comparedVersion) return null;

  const titleChanged = comparedVersion.title !== currentDocument.title;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh]! w-full flex flex-col rounded-t-2xl p-0 gap-0 overflow-hidden bg-background border-border/80 shadow-2xl"
      >
        <SheetHeader className="p-4 sm:p-5 border-b border-border/60 bg-card/40 shrink-0">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/25" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <GitCompare className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Version Comparison</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
                    v{comparedVersion.versionNumber} vs Current
                  </span>
                </SheetTitle>
                <SheetDescription className="text-[10px] text-muted-foreground mt-0.5">
                  Saved{" "}
                  {comparedVersion.createdAt &&
                    formatDistanceToNow(new Date(comparedVersion.createdAt), {
                      addSuffix: true,
                    })}
                  {comparedVersion.changeSummary ? ` • "${comparedVersion.changeSummary}"` : ""}
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{diffResult.additions}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                  -{diffResult.deletions}
                </span>
              </div>

              <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setViewMode("side-by-side")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    viewMode === "side-by-side"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Columns2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("unified")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    viewMode === "unified"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Rows2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Unified</span>
                </button>
              </div>
            </div>
          </div>

          {titleChanged && (
            <div className="mt-3 p-2.5 rounded-lg border border-border/60 bg-muted/30 flex items-center gap-2 text-[10px] font-mono">
              <span className="text-muted-foreground shrink-0">Title Diff:</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 line-through">
                {comparedVersion.title}
              </span>
              <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                {currentDocument.title}
              </span>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-auto font-mono text-[10px] bg-muted/10 select-text">
          {!diffResult.hasChanges && !titleChanged ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center text-muted-foreground">
              <Check className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="font-semibold text-foreground">Identical to Current Version</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                There are no content or title differences between Version{" "}
                {comparedVersion.versionNumber} and the active document.
              </p>
            </div>
          ) : viewMode === "side-by-side" ? (
            <div className="min-w-175">
              <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-border/80 bg-muted/80 backdrop-blur-xs font-semibold text-[10px] text-muted-foreground">
                <div className="px-4 py-2 border-r border-border/60 flex items-center justify-between">
                  <span>Older: Version {comparedVersion.versionNumber}</span>
                  <span className="text-[10px] text-rose-500 font-mono">Original</span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>Newer: Current Active Document</span>
                  <span className="text-[10px] text-emerald-500 font-mono">Current</span>
                </div>
              </div>

              <div className="divide-y divide-border/20">
                {diffResult.sideBySide.map((row, idx) => {
                  const leftDeleted = row.left.type === "deleted";
                  const rightAdded = row.right.type === "added";

                  return (
                    <div
                      key={`sbs-${idx}`}
                      className="grid grid-cols-2 hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`flex items-start border-r border-border/60 py-0.5 px-2 ${
                          leftDeleted
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-l-2 border-l-rose-500"
                            : row.left.type === "empty"
                              ? "bg-muted/15"
                              : "text-foreground"
                        }`}
                      >
                        <span className="w-9 shrink-0 text-right pr-3 select-none text-[10px] text-muted-foreground/60 font-mono">
                          {row.left.lineNumber ?? ""}
                        </span>
                        <span className="w-4 shrink-0 text-center select-none font-bold text-rose-500">
                          {leftDeleted ? "-" : ""}
                        </span>
                        <pre className="flex-1 whitespace-pre-wrap break-all font-mono leading-relaxed pl-1">
                          {row.left.text ?? ""}
                        </pre>
                      </div>

                      <div
                        className={`flex items-start py-0.5 px-2 ${
                          rightAdded
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-l-2 border-l-emerald-500"
                            : row.right.type === "empty"
                              ? "bg-muted/15"
                              : "text-foreground"
                        }`}
                      >
                        <span className="w-9 shrink-0 text-right pr-3 select-none text-[10px] text-muted-foreground/60 font-mono">
                          {row.right.lineNumber ?? ""}
                        </span>
                        <span className="w-4 shrink-0 text-center select-none font-bold text-emerald-500">
                          {rightAdded ? "+" : ""}
                        </span>
                        <pre className="flex-1 whitespace-pre-wrap break-all font-mono leading-relaxed pl-1">
                          {row.right.text ?? ""}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="min-w-125 divide-y divide-border/20">
              <div className="sticky top-0 z-10 px-4 py-2 border-b border-border/80 bg-muted/80 backdrop-blur-xs font-semibold text-[10px] text-muted-foreground">
                <span>Unified Patch: v{comparedVersion.versionNumber} → Current</span>
              </div>
              {diffResult.unified.map((line, idx) => {
                const isAdded = line.type === "added";
                const isDeleted = line.type === "deleted";

                return (
                  <div
                    key={`uni-${idx}`}
                    className={`flex items-start py-0.5 px-3 hover:bg-muted/30 transition-colors ${
                      isAdded
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-l-2 border-l-emerald-500"
                        : isDeleted
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-l-2 border-l-rose-500"
                          : "text-foreground"
                    }`}
                  >
                    <span className="w-8 shrink-0 text-right pr-2 select-none text-[10px] text-muted-foreground/60 font-mono">
                      {line.oldLineNumber ?? ""}
                    </span>
                    <span className="w-8 shrink-0 text-right pr-3 select-none text-[10px] text-muted-foreground/60 font-mono">
                      {line.newLineNumber ?? ""}
                    </span>
                    <span
                      className={`w-4 shrink-0 text-center select-none font-bold ${
                        isAdded
                          ? "text-emerald-500"
                          : isDeleted
                            ? "text-rose-500"
                            : "text-muted-foreground/40"
                      }`}
                    >
                      {isAdded ? "+" : isDeleted ? "-" : " "}
                    </span>
                    <pre className="flex-1 whitespace-pre-wrap break-all font-mono leading-relaxed pl-1">
                      {line.text}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter className="p-3 sm:p-4 border-t border-border/60 bg-card/40 flex flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
            {diffResult.totalChanges} total line{" "}
            {diffResult.totalChanges === 1 ? "change" : "changes"} detected
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] px-3"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {onRestore && (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-[10px] px-3 gap-1.5"
                disabled={isRestoring}
                onClick={() => {
                  onRestore(comparedVersion);
                  onOpenChange(false);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore v{comparedVersion.versionNumber}</span>
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
