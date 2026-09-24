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
import { useCreatePolicyMutation } from "@/features/dpdp/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, ScrollText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(64, "Key too long")
    .regex(/^[a-z][a-z0-9_-]*$/, "Must start with a letter; only lowercase, hyphens, underscores"),
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(2000).optional(),
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

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const textareaClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";

const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";

export default function CreatePolicyPage() {
  const router = useRouter();
  const [createPolicy, { isLoading }] = useCreatePolicyMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
      name: "",
      description: "",
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
      const created = await createPolicy({
        key: data.key,
        name: data.name,
        purpose: data.purpose,
        processingDescription: data.processingDescription,
        consentRequired: data.consentRequired,
        dataCategories: data.dataCategories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom).toISOString() : undefined,
        effectiveUntil: data.effectiveUntil
          ? new Date(data.effectiveUntil).toISOString()
          : undefined,
        description: data.description || undefined,
        retentionPeriod: data.retentionPeriod || undefined,
        content: data.content || undefined,
      }).unwrap();
      toast.success("Policy created — publish it to activate the consent gate");
      router.push(`/admin/policies/${created.id}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to create policy");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/policies"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <ScrollText className="h-6 w-6 text-primary" />
            Create Policy
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define a new data processing policy with its first version
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Policy Identity */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Policy Identity</h2>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Key (immutable slug)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. marketing-communications"
                        className={inputClass}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Marketing Communications"
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Description</FormLabel>
                  <FormControl>
                    <textarea
                      rows={2}
                      placeholder="Brief description of this policy..."
                      className={textareaClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Version Details (v1) */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Version 1 Details</h2>

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
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/policies"
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isLoading ? "Creating..." : "Create Policy"}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
