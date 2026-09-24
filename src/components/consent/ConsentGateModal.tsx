"use client";

import {
  type DpdpPolicy,
  type DpdpPolicyVersion,
  useGetActivePoliciesQuery,
  useGetUserConsentsQuery,
  useRecordConsentMutation,
} from "@/features/dpdp/api";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

function getLatestPublishedVersion(policy: DpdpPolicy): DpdpPolicyVersion | null {
  const published = policy.versions.filter((v) => v.status === "PUBLISHED");
  if (!published.length) return null;
  return published.reduce((a, b) => (a.version > b.version ? a : b));
}

export function ConsentGateModal() {
  const { data: activePolicies, isLoading: isLoadingPolicies } = useGetActivePoliciesQuery();
  const { data: userConsents, isLoading: isLoadingConsents } = useGetUserConsentsQuery();
  const [recordConsent, { isLoading: isSubmitting }] = useRecordConsentMutation();

  const [choices, setChoices] = useState<Record<string, "GRANTED" | "REJECTED" | null>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoadingPolicies || isLoadingConsents || !activePolicies || !userConsents) return null;

  const pendingPolicies = activePolicies.filter((policy) => {
    const state = userConsents[policy.key];
    return !state || state.status === "PENDING";
  });

  if (!pendingPolicies.length) return null;

  // All essential policies (consentRequired === false) must be acknowledged to proceed
  const canContinue = pendingPolicies
    .filter((p) => {
      const version = getLatestPublishedVersion(p);
      return version && !version.consentRequired;
    })
    .every((p) => choices[p.id] === "GRANTED");

  const handleSubmit = async () => {
    try {
      await Promise.all(
        pendingPolicies.map((policy) => {
          const version = getLatestPublishedVersion(policy);
          if (!version) return Promise.resolve();
          return recordConsent({
            policyId: policy.id,
            policyVersionId: version.id,
            status: choices[policy.id] ?? "REJECTED",
            source: "consent_gate",
            consentMethod: "web_form",
          }).unwrap();
        })
      );
    } catch {
      toast.error("Failed to save consent preferences. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-lg w-full mx-4 rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Privacy & Data Consent</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Before continuing, please review how we process your data in accordance with DPDP
            regulations.
          </p>
        </div>

        {/* Policy list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {pendingPolicies.map((policy) => {
            const version = getLatestPublishedVersion(policy);
            if (!version) return null;
            const isEssential = !version.consentRequired;
            const choice = choices[policy.id];

            return (
              <div key={policy.id} className="px-6 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        v{version.version}
                      </span>
                    </div>
                    {version.purpose && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {version.purpose}
                      </p>
                    )}
                  </div>
                  {isEssential ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Essential
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Shield className="h-3 w-3" />
                      Optional
                    </span>
                  )}
                </div>

                {version.dataCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {version.dataCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <Database className="h-2.5 w-2.5" />
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {version.content && (
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((prev) => (prev === policy.id ? null : policy.id))
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {expandedId === policy.id ? "Collapse policy" : "Read full policy"}
                      {expandedId === policy.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {expandedId === policy.id && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(version.content) }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isEssential ? (
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={choice === "GRANTED"}
                      onChange={(e) =>
                        setChoices((prev) => ({
                          ...prev,
                          [policy.id]: e.target.checked ? "GRANTED" : null,
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-xs text-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                      I have read and understood this policy and acknowledge that this processing is
                      required to use the service.
                    </span>
                  </label>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChoices((prev) => ({ ...prev, [policy.id]: "GRANTED" }))}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-xs font-semibold transition-all",
                        choice === "GRANTED"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                      )}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setChoices((prev) => ({ ...prev, [policy.id]: "REJECTED" }))}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-xs font-semibold transition-all",
                        choice === "REJECTED"
                          ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "border-border text-muted-foreground hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400"
                      )}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border space-y-3">
          <button
            type="button"
            disabled={!canContinue || isSubmitting}
            onClick={handleSubmit}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving preferences..." : "Continue to Dashboard"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            You can update your preferences at any time in{" "}
            <Link
              href="/dashboard/consents"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Privacy Settings
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
