"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

interface CommandItem {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  shortcut?: string;
}

interface CommandGroup {
  category: string;
  items: CommandItem[];
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commandGroups: CommandGroup[] = [
    {
      category: "Navigation",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", shortcut: "G H" },
        { name: "Documents", icon: FileText, href: "/dashboard/documents", shortcut: "G D" },
        { name: "Audit Trail", icon: Activity, href: "/dashboard/audit", shortcut: "G A" },
      ],
    },
    {
      category: "Workspaces",
      items: [
        {
          name: "Workspaces",
          icon: ShieldCheck,
          href: "/dashboard/workspaces",
        },
      ],
    },
    {
      category: "Actions & Quick Start",
      items: [
        { name: "All Documents", icon: Plus, href: "/dashboard/documents", shortcut: "D" },
        { name: "Manage Workspaces", icon: BookOpen, href: "/dashboard/workspaces", shortcut: "W" },
        { name: "Workspace Settings", icon: Settings, href: "/dashboard/settings", shortcut: "S" },
      ],
    },
  ];

  const filteredGroups = commandGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((group) => group.items.length > 0);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl z-10"
        >
          <div className="flex items-center border-b border-border px-4 py-3.5 gap-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search documents, workspaces..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              <span>ESC</span>
            </div>
          </div>

          <div className="max-h-90 overflow-y-auto p-2 space-y-4">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div key={group.category}>
                  <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.category}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href);
                          setOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
                              {item.badge}
                            </span>
                          )}
                          {item.shortcut && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm font-mono text-muted-foreground">
                No matching commands found.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                  ↑↓
                </kbd>{" "}
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                  ↵
                </kbd>{" "}
                select
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Scriptor</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
