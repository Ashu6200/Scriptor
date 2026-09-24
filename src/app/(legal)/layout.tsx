import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type React from "react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full flex items-center justify-between px-6 py-4 sm:px-10 border-b border-border/40">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to home</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              SC
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">Scriptor</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">{children}</main>

      <footer className="w-full px-6 py-4 sm:px-10 text-center text-xs text-muted-foreground border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Scriptor. Collaborative engineering knowledge base.</p>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy & Security
          </Link>
        </div>
      </footer>
    </div>
  );
}
