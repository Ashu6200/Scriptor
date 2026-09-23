import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import type React from "react";

const statusBadgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground border-border",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        info: "bg-primary/10 text-primary border-primary/20",
        muted:
          "bg-muted/60 text-muted-foreground border-border/50 font-mono uppercase tracking-wider text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
}

export function StatusBadge({ variant, children, className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
