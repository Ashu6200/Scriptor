"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Clock, FileText, FolderOpen, PenTool, Shield, Zap } from "lucide-react";
import { type UseFormReturn, useWatch } from "react-hook-form";

interface DocumentFormFieldsProps {
  form: UseFormReturn<any>;
  onSubmit: () => void;
  parentDoc?: { id: string; title: string } | null;
  workspaceName?: string;
  isEdit?: boolean;
}

export function DocumentFormFields({
  form,
  onSubmit,
  parentDoc,
  workspaceName,
  isEdit = false,
}: DocumentFormFieldsProps) {
  const watchUpdateMode = useWatch({
    control: form.control,
    name: "updateMode",
    defaultValue: form.getValues("updateMode") || "manual",
  });

  return (
    <div className="space-y-5">
      {!isEdit && parentDoc && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-r from-primary/15 via-primary/5 to-transparent p-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                  Sub-Document
                </span>
                {workspaceName && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    in {workspaceName}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                Creating under: <span className="text-primary">{parentDoc.title}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {!isEdit && !parentDoc && workspaceName && (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/40 p-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                Root Document
              </span>
              <p className="text-sm font-bold text-foreground truncate mt-1">
                Workspace: <span className="text-foreground">{workspaceName}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-xs font-semibold text-foreground">Document Title</FormLabel>
            <FormControl>
              <Input
                placeholder={parentDoc ? "Untitled Subpage" : "Untitled Document"}
                className="h-10 rounded-xl bg-card border-border/80 text-sm font-medium focus-visible:ring-primary/40"
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Update Mode Cards */}
      <FormField
        control={form.control}
        name="updateMode"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-xs font-semibold text-foreground">Update Strategy</FormLabel>
            <FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange("manual")}
                  className={cn(
                    "flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer relative overflow-hidden",
                    field.value === "manual"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md"
                      : "border-border/70 bg-card hover:bg-muted/50 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        field.value === "manual"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <PenTool className="h-4 w-4" />
                    </div>
                    {field.value === "manual" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Manual Update</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Save explicitly on demand using Ctrl+S or Save button.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => field.onChange("auto")}
                  className={cn(
                    "flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer relative overflow-hidden",
                    field.value === "auto"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md"
                      : "border-border/70 bg-card hover:bg-muted/50 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        field.value === "auto"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Zap className="h-4 w-4" />
                    </div>
                    {field.value === "auto" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Auto Update</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Automatically sync content changes at configured interval.
                    </p>
                  </div>
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto Update Options (Interval & SLO) */}
      {watchUpdateMode === "auto" && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 pb-1 border-b border-primary/15">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Auto Sync Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="updateInterval"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Time Interval</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Sec/Min/Hr
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="e.g. 30s, 5m, 1h"
                        className="h-10 pl-9 pr-3 rounded-xl bg-card border-border/80 text-sm font-medium focus-visible:ring-primary/40"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slo"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Target SLO</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Percentage
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Shield className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="e.g. 99.9%"
                        className="h-10 pl-9 pr-3 rounded-xl bg-card border-border/80 text-sm font-medium focus-visible:ring-primary/40"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <p className="text-[11px] text-muted-foreground bg-card/60 p-2.5 rounded-xl border border-border/50">
            💡 <strong>Interval Calculation:</strong> Calculated in total seconds. Examples:{" "}
            <code className="text-primary font-mono font-bold">30</code> or{" "}
            <code className="text-primary font-mono font-bold">30s</code> = 30 sec,{" "}
            <code className="text-primary font-mono font-bold">5m</code> = 300 sec,{" "}
            <code className="text-primary font-mono font-bold">1h</code> = 3600 sec.
          </p>
        </div>
      )}
    </div>
  );
}
