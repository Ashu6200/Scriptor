"use client";

import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    authClient
      .verifyEmail({ query: { token } })
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2500);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "This link may have expired or already been used."
        );
      });
  }, [token, router]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs p-8 flex flex-col items-center gap-4 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Verifying your email…</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-10 w-10 text-emerald-500" />
          <p className="text-sm font-medium text-foreground">Email verified!</p>
          <p className="text-xs text-muted-foreground">Redirecting you to the dashboard…</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-medium text-foreground">Verification failed</p>
          <p className="text-xs text-muted-foreground">{message}</p>
          <Link href="/signup" className="mt-2 text-xs font-semibold text-primary hover:underline">
            Back to sign up
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full"
    >
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Email verification
        </h1>
        <p className="text-sm text-muted-foreground">Confirming your email address for Scriptor.</p>
      </div>
      <Suspense fallback={<div className="h-40 bg-muted animate-pulse rounded-xl" />}>
        <VerifyEmailContent />
      </Suspense>
    </motion.div>
  );
}
