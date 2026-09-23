"use client";

import { motion } from "framer-motion";
import { Check, FolderTree, History, Shield, Terminal, X } from "lucide-react";

const pillars = [
  {
    title: "Terminal-Grade Simplicity",
    description:
      "Designed like a developer terminal. High-contrast typography, zero-bloat navigation, and instant ⌘K command menu.",
    icon: Terminal,
    tag: "USER EXPERIENCE",
  },
  {
    title: "Hierarchical Document Trees",
    description:
      "Organize system architecture with infinite parent-child nesting, human-readable slugs, and rapid keyboard navigation.",
    icon: FolderTree,
    tag: "ORGANIZATION",
  },
  {
    title: "Immutable Audit Governance",
    description:
      "Every document creation, content update, soft-delete, and auth event is logged with actor, resource, and timestamp attribution.",
    icon: Shield,
    tag: "GOVERNANCE & AUDIT",
  },
  {
    title: "Point-in-Time Snapshots",
    description:
      "Every save records an atomic document snapshot. Compare revisions and restore historical versions with one click.",
    icon: History,
    tag: "VERSION CONTROL",
  },
];

const comparisonData = [
  {
    feature: "UI Aesthetic & Load Speed",
    traditional: "Heavy drop shadows, bloated navigation, cluttered menus",
    scriptor: "Clean minimalist canvas, fast TipTap engine, instant ⌘K command bar",
  },
  {
    feature: "Document Hierarchy",
    traditional: "Flat disorganized lists or rigid single-depth folders",
    scriptor: "Infinite nested document trees with drag reordering & custom slugs",
  },
  {
    feature: "Version Control & Rollback",
    traditional: "Opaque revision lists without snapshot diffs or restore",
    scriptor: "Point-in-time version snapshots with one-click instant rollback",
  },
  {
    feature: "Audit & Team Governance",
    traditional: "Silent changes without actor attribution or audit history",
    scriptor: "Immutable audit trail with actor, resource, and timestamp attribution",
  },
];

export function WhyToUse() {
  return (
    <section className="py-24 relative bg-background border-t border-border" id="why-to-use">
      <div className="max-w-300 mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] font-mono text-primary"
          >
            <span>THE SCRIPTOR ADVANTAGE</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[40px] sm:text-[48px] md:text-[56px] font-semibold text-foreground leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Why engineering teams choose Scriptor.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-155 text-muted-foreground text-[18px] leading-[1.6]"
          >
            Built from the ground up to eliminate the friction of legacy wikis and disorganized
            document repositories.
          </motion.p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="rounded-lg border border-border bg-card p-7 flex flex-col justify-between hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px] transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold"
                      style={{ background: "linear-gradient(to right bottom, #ff5e1f, #ff4800)" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground font-semibold tracking-wider uppercase">
                      {pillar.tag}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-[1.6]">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Architectural Comparison Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40">
            <div>
              <h3 className="text-[20px] font-semibold text-foreground">
                Architectural Comparison
              </h3>
              <p className="text-muted-foreground text-sm">
                How Scriptor contrasts with legacy documentation tools
              </p>
            </div>
            <div className="flex items-center gap-4 text-[12px] font-mono">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Legacy Systems
              </span>
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Scriptor Platform
              </span>
            </div>
          </div>

          <div className="divide-y divide-border font-mono tex-sm">
            {comparisonData.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-1 md:grid-cols-12 p-5 items-center gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="md:col-span-4 text-foreground font-semibold">{row.feature}</div>
                <div className="md:col-span-4 text-muted-foreground flex items-start gap-2">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-[12px]">{row.traditional}</span>
                </div>
                <div className="md:col-span-4 text-foreground flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-[12px] font-semibold">{row.scriptor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
