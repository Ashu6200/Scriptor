"use client";

import { useCreatePolicyMutation } from "@/features/dpdp/api";
import { ArrowLeft, Plus, ScrollText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreatePolicyPage() {
  const router = useRouter();
  const [createPolicy, { isLoading }] = useCreatePolicyMutation();

  const [form, setForm] = useState({
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        dataCategories: form.dataCategories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        effectiveFrom: form.effectiveFrom
          ? new Date(form.effectiveFrom).toISOString()
          : undefined,
        effectiveUntil: form.effectiveUntil
          ? new Date(form.effectiveUntil).toISOString()
          : undefined,
        description: form.description || undefined,
        retentionPeriod: form.retentionPeriod || undefined,
        content: form.content || undefined,
      };

      await createPolicy(payload).unwrap();
      toast.success("Policy created successfully");
      router.push("/admin/policies");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to create policy");
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Policy Identity */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Policy Identity</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Key (immutable slug)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. marketing-communications"
                value={form.key}
                onChange={(e) => updateField("key", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marketing Communications"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of this policy..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        {/* Version Details (v1) */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Version 1 Details
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Purpose of Processing
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Send promotional communications to users"
              value={form.purpose}
              onChange={(e) => updateField("purpose", e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Data Categories (comma-separated)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Email Address, Name, Usage Preferences"
              value={form.dataCategories}
              onChange={(e) => updateField("dataCategories", e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Processing Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe how the personal data will be processed..."
              value={form.processingDescription}
              onChange={(e) => updateField("processingDescription", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Retention Period
              </label>
              <input
                type="text"
                placeholder="e.g. 24 months or Until withdrawal"
                value={form.retentionPeriod}
                onChange={(e) => updateField("retentionPeriod", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Consent Required
              </label>
              <div className="flex items-center gap-3 h-10">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="consentRequired"
                    checked={form.consentRequired}
                    onChange={() => updateField("consentRequired", true)}
                    className="accent-primary"
                  />
                  Yes (optional)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="consentRequired"
                    checked={!form.consentRequired}
                    onChange={() => updateField("consentRequired", false)}
                    className="accent-primary"
                  />
                  No (essential)
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Effective From
              </label>
              <input
                type="datetime-local"
                value={form.effectiveFrom}
                onChange={(e) => updateField("effectiveFrom", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Effective Until
              </label>
              <input
                type="datetime-local"
                value={form.effectiveUntil}
                onChange={(e) => updateField("effectiveUntil", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Policy Content
            </label>
            <textarea
              rows={6}
              placeholder="Full policy text that users will be able to view..."
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
            />
          </div>
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
    </div>
  );
}
