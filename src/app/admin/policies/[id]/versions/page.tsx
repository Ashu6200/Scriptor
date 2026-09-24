"use client";

import { PolicyContentEditor } from "@/components/admin/PolicyContentEditor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  type DpdpPolicyVersion,
  useCreatePolicyVersionMutation,
  useGetPolicyVersionsQuery,
} from "@/features/dpdp/api";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Database,
  FilePlus,
  History,
  Plus,
  ScrollText,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  purpose: z.string().min(5, "Must be at least 5 characters").max(1000),
  dataCategories: z.string().min(1, "Enter at least one data category"),
  processingDescription: z.string().min(10, "Must be at least 10 characters").max(5000),
  retentionPeriod: z.string().max(200).optional(),
  consentRequired: z.boolean(),
  content: z.string().optional(),
  effectiveFrom: z.string().optional(),
  effectiveUntil: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ARCHIVED: "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400",
};

function VersionCard({ version }: { version: DpdpPolicyVersion }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono text-foreground">v{version.version}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
              STATUS_COLORS[version.status]
            )}
          >
            {version.status}
          </span>
          {version.consentRequired ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Optional
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              Essential
            </span>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {version.publishedAt ? (
            <p>Published {format(new Date(version.publishedAt), "dd MMM yyyy")}</p>
          ) : (
            <p>Created {format(new Date(version.createdAt), "dd MMM yyyy")}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Purpose
          </p>
          <p className="text-sm text-foreground">{version.purpose}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Data Categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {version.dataCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Database className="h-3 w-3" />
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Processing Description
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {version.processingDescription}
          </p>
        </div>

        {version.retentionPeriod && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Retention Period
            </p>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {version.retentionPeriod}
            </p>
          </div>
        )}

        {(version.effectiveFrom || version.effectiveUntil) && (
          <div className="grid grid-cols-2 gap-4">
            {version.effectiveFrom && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Effective From
                </p>
                <p className="text-sm text-foreground font-mono">
                  {format(new Date(version.effectiveFrom), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            )}
            {version.effectiveUntil && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Effective Until
                </p>
                <p className="text-sm text-foreground font-mono">
                  {format(new Date(version.effectiveUntil), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";
const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const textareaClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";

export default function PolicyVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useGetPolicyVersionsQuery(id);
  const [createVersion, { isLoading: isCreating }] = useCreatePolicyVersionMutation();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: "",
      dataCategories: "",
      processingDescription: "",
      retentionPeriod: "",
      consentRequired: true,
      content: "",
      effectiveFrom: "",
      effectiveUntil: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createVersion({
        policyId: id,
        data: {
          ...data,
          dataCategories: data.dataCategories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          effectiveFrom: data.effectiveFrom
            ? new Date(data.effectiveFrom).toISOString()
            : undefined,
          effectiveUntil: data.effectiveUntil
            ? new Date(data.effectiveUntil).toISOString()
            : undefined,
          retentionPeriod: data.retentionPeriod || undefined,
          content: data.content || undefined,
        },
      }).unwrap();
      toast.success("New version created successfully");
      form.reset();
      setShowForm(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to create version");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Loading versions...
        </div>
      </div>
    );
  }

  const { policy, versions } = data;
  const latestVersion = versions[0];
  const latestIsDraft = latestVersion?.status === "DRAFT";

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/policies/${id}`}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <History className="h-6 w-6 text-primary" />
              Version History
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-0.5 flex items-center gap-2">
              <ScrollText className="h-3.5 w-3.5" />
              {policy.name}
              <span className="text-muted-foreground/50">·</span>
              {policy.key}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (latestVersion) {
              form.reset({
                purpose: latestVersion.purpose,
                dataCategories: latestVersion.dataCategories.join(", "),
                processingDescription: latestVersion.processingDescription,
                retentionPeriod: latestVersion.retentionPeriod ?? "",
                consentRequired: latestVersion.consentRequired,
                content: latestVersion.content ?? "",
                effectiveFrom: "",
                effectiveUntil: "",
              });
            }
            setShowForm((v) => !v);
          }}
          disabled={latestIsDraft}
          title={
            latestIsDraft
              ? `v${latestVersion.version} is already a DRAFT — publish it from the detail page first`
              : undefined
          }
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FilePlus className="h-4 w-4" />
          New Version
        </button>
      </div>

      {/* DRAFT banner */}
      {latestIsDraft && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">v{latestVersion.version} is a DRAFT</span> — publish it
            from the{" "}
            <Link
              href={`/admin/policies/${id}`}
              className="underline underline-offset-2 hover:text-amber-600"
            >
              policy detail page
            </Link>{" "}
            before creating a new version.
          </p>
        </div>
      )}

      {/* Create Version Form */}
      {showForm && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="rounded-xl border border-primary/30 bg-card p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Create New Version (v{versions.length + 1})
            </h2>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Purpose of Processing</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Send promotional communications to users"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataCategories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Data Categories (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Email Address, Name, Usage Preferences"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processingDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Processing Description</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      placeholder="Describe how the personal data will be processed..."
                      className={textareaClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="retentionPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Retention Period</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 24 months or Until withdrawal"
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Policy Type</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2 pt-1">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                            className="accent-primary"
                          />
                          <span>
                            <span className="font-semibold">Optional</span>
                            <span className="text-muted-foreground">
                              {" "}
                              — user can accept or decline
                            </span>
                          </span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                            className="accent-primary"
                          />
                          <span>
                            <span className="font-semibold">Essential</span>
                            <span className="text-muted-foreground">
                              {" "}
                              — required to use the service
                            </span>
                          </span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Effective From</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className={inputClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Effective Until</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className={inputClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Full Policy Content</FormLabel>
                  <FormControl>
                    <PolicyContentEditor value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  form.reset();
                  setShowForm(false);
                }}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {isCreating ? "Creating..." : "Create Version"}
              </button>
            </div>
          </form>
        </Form>
      )}

      {/* Version List */}
      {versions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-16 text-center">
          <History className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No versions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click &quot;New Version&quot; to create the first version of this policy.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-mono text-muted-foreground">
            {versions.length} version{versions.length !== 1 ? "s" : ""} — newest first
          </p>
          {versions.map((version) => (
            <VersionCard key={version.id} version={version} />
          ))}
        </div>
      )}
    </div>
  );
}
