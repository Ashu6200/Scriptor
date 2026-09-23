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
      <SheetContent side="bottom" className="flex h-[80vh]! w-full flex-col rounded-t-2xl p-0">
        <SheetHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" />
          <SheetTitle className="text-base">{title}</SheetTitle>
          {description && <SheetDescription className="text-xs">{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <SheetFooter className="shrink-0 border-t border-border px-6 py-4">{footer}</SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
