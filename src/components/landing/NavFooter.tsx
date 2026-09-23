"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/lib/auth-client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed w-full top-0 z-50 flex h-16 items-center px-6 md:px-10 bg-background/90 backdrop-blur-[25px] border-b border-border/40"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-foreground"
        >
          <span className="tracking-[-0.02em] text-[17px] font-semibold">Scriptor</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors duration-100">
            The Platform
          </Link>
          <Link href="#how-to-use" className="hover:text-foreground transition-colors duration-100">
            How it Works
          </Link>
          <Link href="#why-to-use" className="hover:text-foreground transition-colors duration-100">
            Architecture
          </Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors duration-100">
            Pricing
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard">
              <button
                type="button"
                className="h-9 px-4 tex-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-cf-accent-hover transition-all duration-100 flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-100"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <button
                  type="button"
                  className="h-9 px-4 tex-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-cf-accent-hover transition-all duration-100 flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border p-6 shadow-2xl flex flex-col gap-4 text-sm"
          >
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-muted-foreground hover:text-foreground border-b border-border/50"
            >
              The Platform
            </Link>
            <Link
              href="#how-to-use"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-muted-foreground hover:text-foreground border-b border-border/50"
            >
              How it Works
            </Link>
            <Link
              href="#why-to-use"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-muted-foreground hover:text-foreground border-b border-border/50"
            >
              Architecture
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-muted-foreground hover:text-foreground border-b border-border/50"
            >
              Pricing
            </Link>

            <div className="pt-2 flex flex-col gap-3">
              {session ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <button
                    type="button"
                    className="w-full h-10 px-4 tex-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-cf-accent-hover flex items-center justify-center gap-1.5"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button
                      type="button"
                      className="w-full h-10 px-4 tex-sm font-semibold text-foreground border border-border rounded-md hover:border-foreground/40"
                    >
                      Sign In
                    </button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <button
                      type="button"
                      className="w-full h-10 px-4 tex-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-cf-accent-hover flex items-center justify-center gap-1.5"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 tex-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <p>© 2026 Scriptor. Engineered for engineering teams.</p>
        </div>
      </div>
    </footer>
  );
}
