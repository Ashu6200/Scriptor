"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Code2, FolderTree, GitBranch, MessageSquare, Shield } from "lucide-react";

export function Features() {
  return (
    <section className="py-24 relative bg-background" id="features">
      <div className="max-w-300 mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] font-mono text-primary"
          >
            <span>ENGINEERED FOR ENGINEERING TEAMS</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[40px] sm:text-[48px] md:text-[56px] font-semibold text-foreground leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Everything you need to ship great docs.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-160 text-muted-foreground text-[18px] leading-[1.6]"
          >
            A complete technical documentation suite built for developer productivity — write
            architecture specs, organize nested trees, restore version history, and maintain
            immutable audit trails across team workspaces.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-8 rounded-lg border border-border bg-card p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px] transition-all duration-200"
          >
            <div>
              <div
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold"
                style={{ background: "linear-gradient(to right bottom, #ff5e1f, #ff4800)" }}
              >
                <FolderTree className="h-5 w-5" />
              </div>
              <h3 className="text-[20px] font-semibold text-foreground mb-2">
                Hierarchical Document Tree & TipTap Editor
              </h3>
              <p className="text-muted-foreground text-[15px] max-w-140 leading-[1.6]">
                Organize system designs with infinite parent-child nesting. Write with the TipTap
                rich text engine supporting markdown shortcuts, formatted code blocks, tables, task
                lists, and instant slug routing.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[12px]">
              <div className="p-3 rounded-md border border-border bg-background">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-foreground font-semibold">Nested Trees</span>
                </div>
                <p className="text-muted-foreground text-[10px]">Parent/Child docs</p>
              </div>

              <div className="p-3 rounded-md border border-border bg-background">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-foreground font-semibold">TipTap Core</span>
                </div>
                <p className="text-muted-foreground text-[10px]">Markdown + Rich Text</p>
              </div>

              <div className="p-3 rounded-md border border-border bg-background">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-foreground font-semibold">⌘K Search</span>
                </div>
                <p className="text-muted-foreground text-[10px]">Global command bar</p>
              </div>

              <div className="p-3 rounded-md border border-border bg-background">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-foreground font-semibold">Custom Slugs</span>
                </div>
                <p className="text-muted-foreground text-[10px]">Clean human URLs</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-4 rounded-lg border border-border bg-card p-8 flex flex-col justify-between hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px] transition-all duration-200"
          >
            <div>
              <div
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold"
                style={{ background: "linear-gradient(to right bottom, #ff5e1f, #ff4800)" }}
              >
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-[20px] font-semibold text-foreground mb-2">
                Technical Code Blocks
              </h3>
              <p className="text-muted-foreground text-sm leading-[1.6]">
                Native syntax highlighting for TypeScript, Python, Go, Rust, SQL, and YAML. Format
                snippets directly within documentation.
              </p>
            </div>

            <div className="mt-6 font-mono text-[10px] space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between p-2 rounded bg-background border border-border">
                <span className="text-muted-foreground">auth-middleware.ts</span>
                <span className="text-green-600 dark:text-green-400">TypeScript</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-background border border-border">
                <span className="text-muted-foreground">schema.prisma</span>
                <span className="text-primary">Prisma Schema</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-4 rounded-lg border border-border bg-card p-8 flex flex-col justify-between hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px] transition-all duration-200"
          >
            <div>
              <div
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold"
                style={{ background: "linear-gradient(to right bottom, #ff5e1f, #ff4800)" }}
              >
                <GitBranch className="h-5 w-5" />
              </div>
              <h3 className="text-[20px] font-semibold text-foreground mb-2">
                Atomic Version History
              </h3>
              <p className="text-muted-foreground text-sm leading-[1.6]">
                Every saved revision creates a point-in-time snapshot. Compare versions and restore
                any historical document state with one click.
              </p>
            </div>

            <div className="mt-6 font-mono text-[10px] bg-background p-3 rounded-md border border-border space-y-1">
              <div className="text-green-600 dark:text-green-400">
                + v3 — Added payment idempotency keys
              </div>
              <div className="text-destructive">- v2 — Reverted legacy webhook schema</div>
              <div className="text-muted-foreground text-[10px] mt-2 pt-1 border-t border-border flex justify-between">
                <span>Point-in-time snapshots</span>
                <span className="text-primary">One-click restore</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-8 rounded-lg border border-border bg-card p-8 flex flex-col justify-between hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px] transition-all duration-200"
          >
            <div>
              <div
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold"
                style={{ background: "linear-gradient(to right bottom, #ff5e1f, #ff4800)" }}
              >
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-[20px] font-semibold text-foreground mb-2">
                Audit Governance & Access Trails
              </h3>
              <p className="text-muted-foreground text-[15px] leading-[1.6]">
                Every sensitive action is recorded in an immutable audit trail with actor, resource,
                and timestamp attribution. Monitor document creations, content revisions,
                soft-deletes, and authentication events with complete compliance transparency.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[12px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-foreground">Actor Attribution</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-foreground">Immutable Audit Logs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-foreground">Workspace Security</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
