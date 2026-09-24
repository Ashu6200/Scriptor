import { prisma } from "@/server/infrastructure/db";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PublicWorkspaceIndexProps {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function PublicWorkspaceIndexPage({ params }: PublicWorkspaceIndexProps) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true, slug: true, suspendedAt: true },
  });

  if (!workspace || workspace.suspendedAt) {
    notFound();
  }

  const firstDoc = await prisma.document.findFirst({
    where: {
      workspaceId: workspace.id,
      AND: [
        { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
        { OR: [{ visibility: "PUBLIC" }, { isPublished: true }] },
      ],
    },
    orderBy: { order: "asc" },
    select: { slug: true },
  });

  if (firstDoc?.slug) {
    redirect(`/p/${workspace.slug}/${firstDoc.slug}`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
      <div className="p-4 rounded-2xl bg-muted/60 text-muted-foreground mb-4 border border-border/60">
        <BookOpen className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome to {workspace.name} Docs
      </h1>
      <p className="text-sm text-muted-foreground mt-2 mb-6">
        Documentation for this workspace has not been published to the web yet. Check back soon!
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Learn more about CodeVault
      </Link>
    </div>
  );
}
