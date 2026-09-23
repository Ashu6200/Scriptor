"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <div
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-muted/40 p-1 opacity-60",
          className
        )}
        aria-hidden="true"
      >
        <span className="h-6 w-6 rounded-full bg-background border border-border/40 shadow-xs" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border/80 bg-muted/60 p-1 shadow-2xs transition-all duration-200 hover:bg-muted hover:border-border active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {/* Background static icons for track */}
      <span className="flex flex-1 items-center justify-center pl-0.5">
        <Sun
          className={cn(
            "h-3.5 w-3.5 transition-colors duration-200",
            isDark ? "text-muted-foreground/40" : "text-amber-500/30"
          )}
        />
      </span>
      <span className="flex flex-1 items-center justify-center pr-0.5">
        <Moon
          className={cn(
            "h-3.5 w-3.5 transition-colors duration-200",
            isDark ? "text-primary/30" : "text-muted-foreground/40"
          )}
        />
      </span>

      {/* Sliding thumb */}
      <span
        className={cn(
          "absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border/60 shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
      >
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 text-amber-500 fill-amber-500/20 transition-all duration-200",
            isDark ? "scale-0 opacity-0 -rotate-90" : "scale-100 opacity-100 rotate-0"
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 text-primary fill-primary/20 transition-all duration-200",
            isDark ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 rotate-90"
          )}
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
