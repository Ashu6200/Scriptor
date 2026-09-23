"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { AlignLeft, ArrowUp, BookOpen, Hash, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface HeadingItem {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
  pos: number;
}

export interface TableOfContentsProps {
  editor: Editor;
  onClose?: () => void;
}

function extractHeadings(editor: Editor): HeadingItem[] {
  const headings: HeadingItem[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      const level = node.attrs.level as number;
      if (level >= 1 && level <= 4) {
        const text = node.textContent.trim();
        headings.push({
          id: `heading-${pos}-${level}`,
          text: text || "Untitled section",
          level: level as 1 | 2 | 3 | 4,
          pos,
        });
      }
    }
  });
  return headings;
}

function getActiveHeadingPos(editor: Editor, headings: HeadingItem[]): number | null {
  const cursorPos = editor.state.selection.from;
  let active: HeadingItem | null = null;
  for (const h of headings) {
    if (h.pos <= cursorPos) {
      active = h;
    } else {
      break;
    }
  }
  return active?.pos ?? (headings.length > 0 ? headings[0].pos : null);
}

export function TableOfContents({ editor, onClose }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>(() => extractHeadings(editor));
  const [activePos, setActivePos] = useState<number | null>(() =>
    getActiveHeadingPos(editor, extractHeadings(editor))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const update = useCallback(() => {
    const h = extractHeadings(editor);
    setHeadings(h);
    setActivePos(getActiveHeadingPos(editor, h));
  }, [editor]);

  const [prevEditor, setPrevEditor] = useState(editor);
  if (prevEditor !== editor) {
    setPrevEditor(editor);
    const h = extractHeadings(editor);
    setHeadings(h);
    setActivePos(getActiveHeadingPos(editor, h));
  }

  // Sync with Tiptap editor changes
  useEffect(() => {
    editor.on("update", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("update", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor, update]);

  // Sync active heading on scroll through editor pane
  useEffect(() => {
    const editorDom = editor.view.dom;
    const editorPane =
      editorDom.closest(".notion-editor-pane") || editorDom.closest(".overflow-y-auto") || window;

    const handleScroll = () => {
      if (headings.length === 0) return;
      const headingElements = editorDom.querySelectorAll("h1, h2, h3, h4");
      if (headingElements.length === 0) return;

      const paneRect =
        editorPane instanceof HTMLElement ? editorPane.getBoundingClientRect() : { top: 0 };
      const threshold = paneRect.top + 120; // offset below sticky top bar

      let currentActive: HeadingItem = headings[0];

      for (let i = 0; i < headings.length; i++) {
        const item = headings[i];
        for (let j = 0; j < headingElements.length; j++) {
          const el = headingElements[j] as HTMLElement;
          if (el.textContent?.trim() === item.text.trim()) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= threshold) {
              currentActive = item;
            }
            break;
          }
        }
      }

      setActivePos(currentActive.pos);
    };

    if (editorPane instanceof HTMLElement) {
      editorPane.addEventListener("scroll", handleScroll, { passive: true });
      return () => editorPane.removeEventListener("scroll", handleScroll);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [editor, headings]);

  // Focus search input when toggled
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [showSearch]);

  // Keep active item in view inside outline panel
  useEffect(() => {
    if (activePos !== null && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activePos]);

  // Smooth scroll and pulse highlight on heading click
  const scrollTo = useCallback(
    (item: HeadingItem) => {
      // 1. Move Tiptap cursor & scrollIntoView
      editor.chain().setTextSelection(item.pos).scrollIntoView().run();
      editor.view.focus();
      setActivePos(item.pos);

      // 2. Smoothly scroll DOM node and pulse highlight
      try {
        const editorDom = editor.view.dom;
        const headingElements = editorDom.querySelectorAll("h1, h2, h3, h4");
        let targetEl: HTMLElement | null = null;

        for (let i = 0; i < headingElements.length; i++) {
          const el = headingElements[i] as HTMLElement;
          if (el.textContent?.trim() === item.text.trim()) {
            targetEl = el;
            break;
          }
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          targetEl.classList.remove("outline-heading-highlight");
          void targetEl.offsetWidth; // Trigger reflow for animation restart
          targetEl.classList.add("outline-heading-highlight");
          setTimeout(() => {
            targetEl?.classList.remove("outline-heading-highlight");
          }, 1600);
        }
      } catch {
        // Fallback already executed by Tiptap
      }
    },
    [editor]
  );

  const scrollToTop = useCallback(() => {
    editor.chain().setTextSelection(0).scrollIntoView().run();
    editor.view.focus();
    const editorDom = editor.view.dom;
    const editorPane =
      editorDom.closest(".notion-editor-pane") || editorDom.closest(".overflow-y-auto");
    if (editorPane) {
      editorPane.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editor]);

  const handleInsertHeading = useCallback(() => {
    editor.chain().focus().insertContent("<h2>New Section</h2><p></p>").run();
  }, [editor]);

  // Filter headings
  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return headings;
    const q = searchQuery.toLowerCase().trim();
    return headings.filter((h) => h.text.toLowerCase().includes(q));
  }, [headings, searchQuery]);

  // Reading progress percentage
  const activeIndex = useMemo(() => {
    if (activePos === null) return -1;
    return headings.findIndex((h) => h.pos === activePos);
  }, [headings, activePos]);

  const progressPercent = useMemo(() => {
    if (headings.length === 0) return 0;
    if (activeIndex === -1) return 0;
    return Math.round(((activeIndex + 1) / headings.length) * 100);
  }, [headings.length, activeIndex]);

  return (
    <nav
      className="flex flex-col h-full w-full select-none bg-background/50"
      aria-label="Document Outline"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 bg-background/70 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <AlignLeft className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground">Outline</span>
          {headings.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground border border-border/50">
              {headings.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {headings.length > 3 && (
            <Button
              variant={showSearch ? "secondary" : "ghost"}
              size="icon"
              className="h-6.5 w-6.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowSearch((p) => !p)}
              title={showSearch ? "Close filter" : "Filter outline"}
            >
              <Search className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6.5 w-6.5 text-muted-foreground hover:text-foreground"
            onClick={scrollToTop}
            title="Scroll to top of document"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6.5 w-6.5 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Close outline"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Reading Progress Bar */}
      {headings.length > 0 && (
        <div className="h-0.5 w-full bg-border/40 overflow-hidden shrink-0">
          <div
            className="h-full bg-primary/80 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Filter / Search Bar */}
      {showSearch && (
        <div className="p-2 border-b border-border/40 bg-muted/30 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter headings..."
              className="w-full bg-background/90 border border-border/60 rounded-md pl-7 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                title="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-1 px-1 text-[10px] text-muted-foreground">
              Found {filteredHeadings.length} of {headings.length}
            </div>
          )}
        </div>
      )}

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {headings.length === 0 ? (
          <div className="py-10 px-3 text-center flex flex-col items-center justify-center h-full">
            <div className="h-10 w-10 rounded-full bg-muted/60 border border-border/50 flex items-center justify-center mb-3 text-muted-foreground/60">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">No headings found</p>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-50 mb-4">
              Use headings in your document to automatically generate an outline.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border border-border/40 text-[10px] text-muted-foreground/70 font-mono mb-4">
              <span># H1</span>
              <span>## H2</span>
              <span>### H3</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertHeading}
              className="text-xs gap-1.5 h-7 border-dashed"
            >
              <Plus className="h-3 w-3" /> Add Heading
            </Button>
          </div>
        ) : filteredHeadings.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
            <p>No headings matching &ldquo;{searchQuery}&rdquo;</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs h-6 text-primary"
            >
              Clear filter
            </Button>
          </div>
        ) : (
          filteredHeadings.map((h) => {
            const isActive = activePos === h.pos;
            return (
              <button
                key={h.id}
                ref={isActive ? activeItemRef : undefined}
                type="button"
                onClick={() => scrollTo(h)}
                title={h.text}
                className={cn(
                  "group relative flex items-center justify-between w-full py-1.5 rounded-md text-left transition-all duration-150 select-none",
                  // Indentation levels
                  h.level === 1 && "pl-2 pr-2 font-medium",
                  h.level === 2 && "pl-5 pr-2",
                  h.level === 3 && "pl-8 pr-2",
                  h.level === 4 && "pl-11 pr-2",
                  // Active vs Idle
                  isActive
                    ? "bg-primary/10 text-primary font-semibold dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0.5 top-1.5 bottom-1.5 w-1 rounded-full bg-primary" />
                )}

                {/* Left Tree Guide for Nested Headings */}
                {h.level > 1 && (
                  <span
                    className={cn(
                      "absolute top-0 bottom-0 border-l border-border/40 group-hover:border-border/70 transition-colors",
                      h.level === 2 && "left-3",
                      h.level === 3 && "left-6",
                      h.level === 4 && "left-9"
                    )}
                  />
                )}

                {/* Heading Text */}
                <span
                  className={cn(
                    "truncate text-xs leading-snug mr-1.5",
                    h.level === 1 && "text-[12px] font-semibold text-foreground/90",
                    h.level === 2 && "text-[11.5px]",
                    h.level >= 3 && "text-[11px]",
                    isActive && "text-primary"
                  )}
                >
                  {h.text}
                </span>

                {/* Level Pill Tag */}
                <span
                  className={cn(
                    "shrink-0 text-[9px] font-mono uppercase px-1 py-0.2 rounded transition-opacity",
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "opacity-40 group-hover:opacity-90 bg-muted text-muted-foreground border border-border/40"
                  )}
                >
                  H{h.level}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Subtle Footer with Status */}
      {headings.length > 0 && (
        <div className="px-3 py-2 border-t border-border/40 bg-muted/10 text-[10px] font-mono text-muted-foreground/70 flex items-center justify-between shrink-0">
          <span>{progressPercent}% read</span>
          <span>
            {headings.length} {headings.length === 1 ? "section" : "sections"}
          </span>
        </div>
      )}
    </nav>
  );
}
