"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type * as React from "react";

interface BottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BottomDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: BottomDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88vh] h-auto w-full max-w-3xl mx-auto flex-col rounded-t-3xl border-t border-border/80 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-2xl p-0 shadow-2xl transition-all duration-300 outline-none"
      >
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors cursor-grab" />
        </div>
        <SheetHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pt-1 text-left">
          <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <SheetFooter className="shrink-0 border-t border-border/60 bg-muted/30 px-6 py-4">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
