"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FolderPlus,
  GitBranch,
  PenLine,
  Shield,
} from "lucide-react";
import { useState } from "react";

const steps = [
  {
    number: "01",
    title: "Create Your Workspace",
    subtitle: "Organize projects with custom slugs and pinning",
    icon: FolderPlus,
    highlight: "workspace → platform-core (pinned)",
    description:
      "Initialize isolated workspaces for your engineering teams, microservices, or client deliverables. Configure human-readable URL slugs and pin critical workspaces for instant access.",
    preview: [
      { label: "Workspace Types", value: "Personal & Team", color: "text-primary" },
      {
        label: "URL Slugs",
        value: "Human-Readable & Unique",
        color: "text-green-600 dark:text-green-400",
      },
      {
        label: "Fast Navigation",
        value: "Pinned Workspace Bar",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Isolation",
        value: "Multi-Tenant Data Boundaries",
        color: "text-amber-600 dark:text-amber-400",
      },
    ],
  },
  {
    number: "02",
    title: "Author with Rich Markdown",
    subtitle: "Full TipTap editor with code highlighting and TOC",
    icon: PenLine,
    highlight: "document → auth-architecture-v2.md",
    description:
      "Draft comprehensive engineering specifications using our distraction-free TipTap editor. Features syntax-highlighted code blocks, auto-generating table of contents, and reading time estimation.",
    preview: [
      { label: "Editor Engine", value: "TipTap Rich Text + Markdown", color: "text-primary" },
      {
        label: "Code Highlighting",
        value: "Multi-Language Syntax",
        color: "text-green-600 dark:text-green-400",
      },
      { label: "Outline", value: "Auto-Generated TOC", color: "text-blue-600 dark:text-blue-400" },
      {
        label: "Metrics",
        value: "Word Count & Reading Time",
        color: "text-amber-600 dark:text-amber-400",
      },
    ],
  },
  {
    number: "03",
    title: "Review & Version Control",
    subtitle: "Point-in-time snapshots and threaded review comments",
    icon: GitBranch,
    highlight: "snapshot → v3 restored by lead-arch",
    description:
      "Leave inline discussion comments on technical specifications, resolve review feedback, and view point-in-time version snapshots with instant rollback capabilities.",
    preview: [
      {
        label: "Version Snapshots",
        value: "Point-in-Time History",
        color: "text-green-600 dark:text-green-400",
      },
      {
        label: "Restore Action",
        value: "One-Click Version Rollback",
        color: "text-blue-600 dark:text-blue-400",
      },
      { label: "Comments", value: "Threaded & Resolvable", color: "text-primary" },
      { label: "Status Badges", value: "Saved / Draft / Published", color: "text-foreground" },
    ],
  },
  {
    number: "04",
    title: "Audit & Governance",
    subtitle: "Immutable audit trail and security attribution",
    icon: Shield,
    highlight: "audit → document.updated by lead-arch",
    description:
      "Every document change, version restoration, and workspace operation is captured in an immutable audit trail with actor, resource, and timestamp attribution.",
    preview: [
      { label: "Action Attribution", value: "Actor & Timestamp Logged", color: "text-primary" },
      {
        label: "Audit Trail",
        value: "Immutable Action History",
        color: "text-green-600 dark:text-green-400",
      },
      {
        label: "Compliance",
        value: "Filter by Actor & Resource",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Workspace Security",
        value: "Role & Access Guardrails",
        color: "text-amber-600 dark:text-amber-400",
      },
    ],
  },
];

export function HowToUse() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 relative bg-card border-t border-border" id="how-to-use">
      <div className="max-w-300 mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] font-mono text-primary"
          >
            <span>WORKFLOW OVERVIEW</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[40px] sm:text-[48px] md:text-[56px] font-semibold text-foreground leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            How Scriptor works.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-150  text-muted-foreground text-[18px] leading-[1.6]"
          >
            From workspace setup to version-controlled publishing and audit governance in four
            steps.
          </motion.p>
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-lg border text-left transition-all duration-100 flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? "border-primary bg-secondary text-foreground shadow-[0_0_20px_rgba(255,94,31,0.08)]"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`font-mono tex-sm font-bold ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    STEP {step.number}
                  </span>
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-[16px] text-foreground mb-1">{step.title}</h4>
                  <p className="tex-sm text-muted-foreground line-clamp-1">{step.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Box */}
        <div className="rounded-lg border border-border bg-background overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-5 p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 font-mono text-[12px] text-primary">
                <span>PHASE {steps[activeStep].number} OF 04</span>
              </div>
              <h3
                className="text-[28px] font-semibold text-foreground mb-3"
                style={{ letterSpacing: "-0.02em" }}
              >
                {steps[activeStep].title}
              </h3>
              <p className="text-muted-foreground text-[15px] leading-[1.6] mb-6">
                {steps[activeStep].description}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card font-mono tex-sm text-foreground flex items-center justify-between">
              <span className="text-primary">→ {steps[activeStep].highlight}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="lg:col-span-7 p-6 bg-card font-mono tex-sm leading-[1.7] overflow-x-auto flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border text-[12px] text-muted-foreground">
              <span className="text-foreground font-semibold">{steps[activeStep].title}</span>
              <span className="text-primary">System Verification</span>
            </div>
            <div className="space-y-3 flex-1">
              {steps[activeStep].preview.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between p-3 rounded-md bg-background border border-border"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={item.color}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Production ready in Scriptor
              </span>
              <span className="text-primary">Scriptor Engine</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
