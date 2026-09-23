"use client";

import { cn } from "@/lib/utils";
import type React from "react";

type BadgeColor = "live" | "alert" | "info";

interface PageHeaderBadge {
  label: string;
  color: BadgeColor;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: PageHeaderBadge;
  actions?: React.ReactNode;
  className?: string;
}

const badgeColorMap: Record<BadgeColor, string> = {
  live: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  alert: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

const dotColorMap: Record<BadgeColor, string> = {
  live: "bg-emerald-500",
  alert: "bg-rose-500",
  info: "bg-primary",
};

export function PageHeader({ title, description, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {badge && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                badgeColorMap[badge.color]
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full animate-pulse", dotColorMap[badge.color])}
              />
              {badge.label}
            </span>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
