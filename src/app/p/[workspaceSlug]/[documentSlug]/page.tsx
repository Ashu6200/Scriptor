import { PublicDocViewer } from "@/components/documents/PublicDocViewer";
import { DocumentService } from "@/server/modules/document";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRight, BookOpen, Clock, FileText, User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PublicDocPageProps {
  params: Promise<{
    workspaceSlug: string;
    documentSlug: string;
  }>;
}

const documentService = new DocumentService();

export async function generateMetadata({ params }: PublicDocPageProps): Promise<Metadata> {
  const { workspaceSlug, documentSlug } = await params;
  try {
    const data = await documentService.getPublicDocument(workspaceSlug, documentSlug);
    if (!data) return { title: "Document Not Found — CodeVault" };
    return {
      title: `${data.document.title} — ${data.workspace.name} Docs`,
      description: `Read ${data.document.title} documentation on CodeVault.`,
    };
  } catch {
    return { title: "Documentation — CodeVault" };
  }
}

export default async function PublicDocPage({ params }: PublicDocPageProps) {
  const { workspaceSlug, documentSlug } = await params;

  let data: Awaited<ReturnType<typeof documentService.getPublicDocument>> | null = null;
  try {
    data = await documentService.getPublicDocument(workspaceSlug, documentSlug);
  } catch {
    notFound();
  }

  if (!data) {
    notFound();
  }

  const { workspace, document, publishedDocuments } = data;

  // Find previous and next documents in the published hierarchy
  const currentIndex = publishedDocuments.findIndex((d) => d.slug === documentSlug);
  const prevDoc = currentIndex > 0 ? publishedDocuments[currentIndex - 1] : null;
  const nextDoc =
    currentIndex >= 0 && currentIndex < publishedDocuments.length - 1
      ? publishedDocuments[currentIndex + 1]
      : null;

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb Header */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
        <Link href={`/p/${workspace.slug}`} className="hover:text-foreground transition-colors">
          {workspace.name}
        </Link>
        {document.parent && (
          <>
            <span>/</span>
            <Link
              href={`/p/${workspace.slug}/${document.parent.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {document.parent.title}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{document.title}</span>
      </nav>

      {/* Title & Metadata Header */}
      <header className="space-y-4 border-b border-border/60 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {document.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {document.author && (
            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
              {document.author.image ? (
                <div className="relative h-5 w-5 rounded-full overflow-hidden">
                  <Image
                    src={document.author.image}
                    alt={document.author.name || "Author"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              <span>{document.author.name || "Author"}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{document.readingTime ? `${document.readingTime} min read` : "1 min read"}</span>
          </div>

          <div>
            Updated{" "}
            {formatDistanceToNow(new Date(document.updatedAt || document.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <div className="pt-2">
        <PublicDocViewer content={document.content} />
      </div>

      {/* Prev / Next Document Navigation */}
      <footer className="pt-12 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {prevDoc ? (
          <Link
            href={`/p/${workspace.slug}/${prevDoc.slug}`}
            className="group flex flex-col p-4 rounded-xl border border-border/60 hover:border-primary/50 bg-card hover:bg-muted/40 transition-all sm:max-w-xs w-full"
          >
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />{" "}
              Previous
            </span>
            <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {prevDoc.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {nextDoc && (
          <Link
            href={`/p/${workspace.slug}/${nextDoc.slug}`}
            className="group flex flex-col items-end text-right p-4 rounded-xl border border-border/60 hover:border-primary/50 bg-card hover:bg-muted/40 transition-all sm:max-w-xs w-full ml-auto"
          >
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              Next{" "}
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {nextDoc.title}
            </span>
          </Link>
        )}
      </footer>
    </article>
  );
}
