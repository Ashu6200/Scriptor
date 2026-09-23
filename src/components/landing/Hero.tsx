"use client";

import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative flex flex-col items-center pt-32 pb-20 overflow-hidden bg-background">
      <div className="max-w-300 mx-auto px-6 md:px-10 relative z-10 w-full">
        <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-1.5 tex-sm font-semibold text-foreground hover:border-primary/40 transition-colors">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Scriptor Platform — Developer-First Knowledge Base</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-[0.96]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Document with precision.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-150 text-muted-foreground text-[17px] sm:text-[18px] leading-[1.6] font-medium"
          >
            The all-in-one workspace where engineering teams write specs, organize hierarchical
            documents, track version history, and maintain immutable audit logs for complete team
            governance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            {session ? (
              <Link href="/dashboard">
                <button
                  type="button"
                  className="h-11 px-7 text-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-cf-accent-hover transition-all duration-100 inline-flex items-center gap-2 shadow-[0_4px_14px_rgba(255,94,31,0.25)]"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            ) : (
              <Link href="/signup">
                <button
                  type="button"
                  className="h-11 px-7 text-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-cf-accent-hover transition-all duration-100 inline-flex items-center gap-2 shadow-[0_4px_14px_rgba(255,94,31,0.25)]"
                >
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            )}
            <Link href="#features">
              <button
                type="button"
                className="h-11 px-7 text-sm font-semibold text-foreground bg-transparent border border-border rounded-md hover:border-foreground/40 transition-all duration-100"
              >
                Explore Features
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 w-full rounded-lg border border-border bg-card overflow-hidden shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px]"
        >
          <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="h-4 w-px bg-border mx-1" />
              <span className="font-mono text-[12px] text-muted-foreground truncate">
                scriptor.app/dashboard/documents/developer-blog
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                WORKSPACE ACTIVE
              </span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden bg-muted/20">
            <Image
              src="/scriptor.PNG"
              alt="Scriptor Developer Workspace and Documentation Editor"
              width={1903}
              height={924}
              priority
              className="w-full h-auto block select-none"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left"
        >
          {[
            { label: "TipTap Rich Engine", desc: "Markdown shortcuts, code blocks & tables" },
            { label: "Atomic Snapshots", desc: "Full version diffs & instant restore" },
            { label: "Audit Governance", desc: "Actor & timestamp attribution on every save" },
            { label: "Multi-Workspace", desc: "Custom slugs & deterministic pinning" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-5 rounded-lg border border-border bg-card hover:shadow-[rgba(255,80,10,0.06)_0px_4px_60px_0px,rgba(0,0,0,0.03)_0px_2px_12px_0px] transition-shadow duration-200"
            >
              <p className="text-[15px] font-semibold text-foreground">{item.label}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
