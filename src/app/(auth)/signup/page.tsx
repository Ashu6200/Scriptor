"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, UserX } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">Scriptor platform registration status.</p>
      </div>

      <Card className="border-border bg-card shadow-xs text-center">
        <CardHeader className="space-y-3 pb-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted border border-border">
            <UserX className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg font-semibold">Sign-ups are currently closed</CardTitle>
          <CardDescription className="text-sm max-w-sm mx-auto">
            New user registrations are temporarily disabled. If you already have an account, please
            sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Link href="/login" className="w-full block">
            <Button className="w-full h-10 rounded-md font-semibold text-sm cursor-pointer shadow-xs">
              Go to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="pt-2 justify-center border-t border-border/50 mt-4">
          <p className="text-xs text-muted-foreground">
            Looking for more information?{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Back to Home
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
