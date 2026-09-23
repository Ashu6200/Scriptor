"use client";

import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowToUse } from "@/components/landing/HowToUse";
import { Footer, Navbar } from "@/components/landing/NavFooter";
import { Pricing } from "@/components/landing/Pricing";
import { WhyToUse } from "@/components/landing/WhyToUse";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Key, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen bg-wv-bg relative">
      <Navbar />

      <main className="flex-1">
        <Hero />

        <Features />

        <HowToUse />

        <WhyToUse />
        <section className="py-24 border-t border-wv-border bg-wv-bg">
          <div className="max-w-300 mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-wv-border px-3 py-1 text-[12px] font-mono text-wv-cyan">
                  <span>SCRIPTOR CORE ARCHITECTURE</span>
                </div>
                <h2
                  className="text-[36px] sm:text-[44px] font-medium text-white leading-[1.1] font-display"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Built for engineering rigor.
                </h2>
                <p className="text-wv-secondary text-[16px] leading-[1.7]">
                  Scriptor provides an enterprise-ready documentation foundation powered by a TipTap
                  rich-text core, Redis caching, immutable audit logs, and granular developer API
                  tokens.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-wv-cyan mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold text-[15px]">
                        Hierarchical Knowledge Trees
                      </h4>
                      <p className="text-wv-secondary text-sm">
                        Infinite parent-child nesting, human-readable slugs, and custom display
                        ordering for workspaces.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-wv-live mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold text-[15px]">
                        Point-in-Time Snapshot History
                      </h4>
                      <p className="text-wv-secondary text-sm">
                        Every save records an atomic document snapshot with line-by-line diff
                        viewing and one-click rollback.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-sky-blue mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold text-[15px]">
                        Cryptographic Ledger & Audit Trail
                      </h4>
                      <p className="text-wv-secondary text-sm">
                        SHA-256 hashed ledger integrity verification with full actor attribution
                        and immutable tamper-evident audit logging.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architecture Terminal Status Card */}
              <div className="rounded-2xl border border-wv-border bg-wv-card p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-wv-border pb-4 font-mono text-[12px]">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-wv-cyan" />
                    <span className="text-white font-semibold">Engine Status</span>
                  </div>
                  <span className="text-wv-live px-2 py-0.5 rounded bg-wv-live/10 border border-wv-live/20">
                    OPERATIONAL
                  </span>
                </div>

                <div className="space-y-3 font-mono text-[12px]">
                  <div className="flex justify-between items-center p-2.5 rounded bg-wv-bg border border-wv-border">
                    <span className="text-wv-secondary flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-wv-cyan" />
                      Document Core
                    </span>
                    <span className="text-white">TipTap + Markdown Engine</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-wv-bg border border-wv-border">
                    <span className="text-wv-secondary flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-wv-live" />
                      Audit Logging
                    </span>
                    <span className="text-white">Actor, Resource & IP Trail</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-wv-bg border border-wv-border">
                    <span className="text-wv-secondary flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-sky-blue" />
                      API Authentication
                    </span>
                    <span className="text-wv-cyan">SHA-256 Scoped Tokens</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-wv-bg border border-wv-border">
                    <span className="text-wv-secondary flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber" />
                      Payment Engine
                    </span>
                    <span className="text-white">Razorpay Webhooks & Ledger</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real Transparent Pricing Section */}
        <Pricing />

        {/* Final CTA Section */}
        <section className="py-32 relative border-t border-wv-border">
          <div className="max-w-300 mx-auto px-6 md:px-10 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto rounded-2xl border border-wv-border bg-wv-bg p-12 md:p-16"
            >
              <h2
                className="text-[36px] sm:text-[44px] md:text-[54px] font-medium leading-[1.1] mb-6 font-display"
                style={{ letterSpacing: "-0.03em" }}
              >
                Ready to elevate your <br />
                engineering docs?
              </h2>
              <p className="mx-auto max-w-135 text-wv-secondary text-[17px] sm:text-[18px] leading-[1.6] mb-10">
                Join developers and engineering teams who use Scriptor to write clear technical
                specs, organize knowledge trees, and automate documentation pipelines.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {session ? (
                  <Link href="/dashboard">
                    <button
                      type="button"
                      className="h-11 px-7 text-sm font-semibold text-black bg-wv-cyan rounded-md hover:bg-wv-cyan/90 transition-all duration-150 inline-flex items-center justify-center gap-2 font-mono"
                    >
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <button
                      type="button"
                      className="h-11 px-7 text-sm font-semibold text-black bg-wv-cyan rounded-md hover:bg-wv-cyan/90 transition-all duration-150 inline-flex items-center justify-center gap-2 font-mono"
                    >
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                )}
                <Link href="/dashboard/documents">
                  <button
                    type="button"
                    className="h-11 px-7 text-sm font-semibold text-wv-text bg-transparent border border-wv-border rounded-md hover:border-white transition-all duration-150 font-mono"
                  >
                    Explore Demo
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
