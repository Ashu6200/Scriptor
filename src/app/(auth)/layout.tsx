import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, CheckCircle2, FileText, Layers, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-background">
      <div className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 2xl:col-span-6 flex-col justify-between p-8 xl:p-12 overflow-hidden bg-zinc-950 text-white border-r border-border">
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/auth-image.png"
            alt="Scriptor Engineering Workspace"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center filter brightness-95 contrast-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/50 to-black/35" />
          <div className="absolute inset-0 bg-linear-to-r from-black/50 via-transparent to-black/30" />
          <div className="absolute inset-0 bg-radial-[at_top_left] from-transparent via-black/20 to-black/70" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <span className="font-bold text-xl tracking-tight text-white">Scriptor</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
              v2.0
            </span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Zero Data Silos
          </span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/25 border border-primary/40 text-primary text-xs font-mono font-medium backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Developer-First Knowledge Platform</span>
            </div>

            <blockquote className="text-xl font-medium leading-relaxed text-zinc-100">
              “Scriptor transformed how our distributed engineering teams document system
              architecture, RFCs, and API contracts. Living documentation that never rots.”
            </blockquote>
          </div>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-white">Elena Vance</div>
              <div className="text-xs text-zinc-400 font-mono">
                Principal Systems Architect · Pro Plan
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-white/10 text-white/80 border border-white/10">
                TipTap Editor
              </span>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-white/10 text-white/80 border border-white/10">
                Snapshots v3
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-7 xl:col-span-7 2xl:col-span-6 flex flex-col min-h-screen bg-background">
        <header className="w-full flex items-center justify-between px-6 py-4 sm:px-10 border-b border-border/40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to website</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="lg:hidden flex items-center gap-2 mr-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                SC
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">Scriptor</span>
            </Link>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-107.5">{children}</div>
        </main>

        <footer className="w-full px-6 py-4 sm:px-10 text-center text-xs text-muted-foreground border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Scriptor. Collaborative engineering knowledge base.</p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/security" className="hover:text-foreground transition-colors">
              Security
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
