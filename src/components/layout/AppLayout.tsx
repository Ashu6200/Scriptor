"use client";

import { CommandPalette } from "@/components/search/CommandPalette";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  const isDocumentsPath = pathname?.startsWith("/dashboard/documents");

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Authenticating...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider defaultOpen={!isDocumentsPath}>
        <CommandPalette />
        <Sidebar />
        <SidebarInset className="min-w-0">
          <div className="fixed top-3 left-3 z-30 md:hidden">
            <SidebarTrigger className="h-9 w-9 rounded-md border border-border bg-card/90 shadow-xs backdrop-blur-md hover:bg-card text-muted-foreground hover:text-primary transition-all flex items-center justify-center" />
          </div>
          <main className="flex-1 overflow-auto h-lvh min-w-0 w-full">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
