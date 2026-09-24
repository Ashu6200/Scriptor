import { ThemeToggle } from "@/components/ThemeToggle";
import { prisma } from "@/server/infrastructure/db";
import { BookOpen, Building2, ChevronRight, ExternalLink, FileText, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}

export default async function PublicDocsLayout({ children, params }: PublicLayoutProps) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      suspendedAt: true,
    },
  });

  if (!workspace || workspace.suspendedAt) {
    notFound();
  }

  const publishedDocs = await prisma.document.findMany({
    where: {
      workspaceId: workspace.id,
      AND: [
        { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
        { OR: [{ visibility: "PUBLIC" }, { isPublished: true }] },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      parentId: true,
      order: true,
    },
    orderBy: { order: "asc" },
  });

  const rootDocs = publishedDocs.filter((d) => !d.parentId);
  const childMap = new Map<string, typeof publishedDocs>();
  for (const doc of publishedDocs) {
    if (doc.parentId) {
      const list = childMap.get(doc.parentId) || [];
      list.push(doc);
      childMap.set(doc.parentId, list);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/p/${workspace.slug}`}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              {workspace.logoUrl ? (
                <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-border/60">
                  <Image
                    src={workspace.logoUrl}
                    alt={workspace.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {workspace.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-sm tracking-tight">{workspace.name}</span>
            </Link>

            <span className="text-muted-foreground/40 text-xs hidden sm:inline">•</span>
            <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline">
              Docs
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <span>CodeVault</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar (Desktop Navigation) */}
        <aside className="w-full md:w-64 shrink-0 border-r border-border/50 py-6 px-4 md:px-6 bg-card/20 hidden md:block overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground px-2">
              Documentation
            </div>

            {publishedDocs.length === 0 ? (
              <div className="text-xs text-muted-foreground px-2 py-4 italic">
                No public documents published yet.
              </div>
            ) : (
              <nav className="space-y-1">
                {rootDocs.map((doc) => {
                  const children = childMap.get(doc.id) || [];
                  return (
                    <div key={doc.id} className="space-y-1">
                      <Link
                        href={`/p/${workspace.slug}/${doc.slug}`}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </Link>

                      {children.length > 0 && (
                        <div className="pl-5 space-y-1 border-l border-border/40 ml-4">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/p/${workspace.slug}/${child.slug}`}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <span className="truncate">{child.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}
          </div>
        </aside>

        {/* Center Reader Pane */}
        <main className="flex-1 min-w-0 py-8 px-4 sm:px-8 lg:px-12">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Published with{" "}
            <Link href="/" className="font-semibold text-foreground hover:underline">
              CodeVault
            </Link>{" "}
            — The Developer Knowledge Base
          </span>
          <span className="text-[11px] font-mono text-muted-foreground/60">
            {workspace.name} &copy; {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
