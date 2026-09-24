import { renderMarkdown } from "@/lib/markdown";
import { prisma } from "@/server/infrastructure/db";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Scriptor",
  description: "Terms of Service for Scriptor, the collaborative engineering knowledge base.",
};

export default async function TermsPage() {
  let version = null;
  try {
    const policy = await prisma.dpdpPolicy.findUnique({
      where: { key: "terms-of-service" },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });
    version = policy?.versions[0] ?? null;
  } catch {
    // DB unavailable — render fallback below
  }

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground not-prose">
        {version?.publishedAt
          ? `Last updated: ${format(new Date(version.publishedAt), "d MMMM yyyy")} — v${version.version}`
          : "Last updated: 1 January 2026"}
      </p>

      {version?.content ? (
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(version.content) }} />
      ) : (
        <p>
          Our Terms of Service are currently being updated. Please contact{" "}
          <a href="mailto:legal@scriptor.app">legal@scriptor.app</a> for the latest version.
        </p>
      )}
    </article>
  );
}
