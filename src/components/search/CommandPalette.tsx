"use client";

import { useSearchDocumentsQuery } from "@/features/search/api";
import { formatDistanceToNow } from "date-fns";
import { FileText, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useSearchDocumentsQuery(debouncedQuery, {
    skip: !open || debouncedQuery.length < 2,
  });

  const results = data?.documents ?? [];

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setDebouncedQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) handleClose();
        else handleOpen();
      }
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleOpen, handleClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].id);
    }
  };

  const navigate = (id: string) => {
    handleClose();
    router.push(`/dashboard/documents/${id}`);
  };

  // Reset selected index when results change
  useEffect(() => setSelectedIndex(0), [results.length]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search documents…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono border border-border rounded px-1.5 py-0.5 text-muted-foreground bg-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {debouncedQuery.length < 2 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : isFetching ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No documents found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {results.map((doc, i) => (
                <button
                  key={doc.id}
                  onClick={() => navigate(doc.id)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === selectedIndex
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <FileText
                    className={`h-4 w-4 shrink-0 ${i === selectedIndex ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title || "Untitled"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {doc.workspace.name} ·{" "}
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="border border-border rounded px-1 bg-muted font-mono">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-border rounded px-1 bg-muted font-mono">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-border rounded px-1 bg-muted font-mono">ESC</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
