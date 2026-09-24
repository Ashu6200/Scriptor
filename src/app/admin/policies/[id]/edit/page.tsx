"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGetPolicyQuery, useUpdatePolicyMutation } from "@/features/dpdp/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, ScrollText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof formSchema>;

const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wider";
const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const textareaClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";

export default function EditPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: policy, isLoading } = useGetPolicyQuery(id);
  const [updatePolicy, { isLoading: isSaving }] = useUpdatePolicyMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        description: policy.description ?? "",
      });
    }
  }, [policy, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updatePolicy({
        id,
        data: {
          name: data.name,
          description: data.description || undefined,
        },
      }).unwrap();
      toast.success("Policy updated successfully");
      router.push(`/admin/policies/${id}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to update policy");
    }
  };

  if (isLoading || !policy) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Loading policy...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/policies/${id}`}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <ScrollText className="h-6 w-6 text-primary" />
            Edit Policy
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Update policy metadata</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Policy Identity</h2>

            {/* Key — read-only */}
            <div className="space-y-1.5">
              <label className={labelClass}>Key (immutable)</label>
              <div className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground font-mono select-all">
                {policy.key}
              </div>
              <p className="text-xs text-muted-foreground">
                Policy keys cannot be changed after creation.
              </p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Display Name</FormLabel>
                  <FormControl>
                    <Input className={inputClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Description</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
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

          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/admin/policies/${id}`}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
