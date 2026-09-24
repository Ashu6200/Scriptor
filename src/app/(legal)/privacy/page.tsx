import { renderMarkdown } from "@/lib/markdown";
import { prisma } from "@/server/infrastructure/db";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Scriptor",
  description:
    "Privacy Policy for Scriptor, explaining how we collect, use, and protect your personal data under the DPDP Act 2023.",
};

export default async function PrivacyPage() {
  let version = null;
  try {
    const policy = await prisma.dpdpPolicy.findUnique({
      where: { key: "privacy-core-processing" },
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
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground not-prose">
        {version?.publishedAt
          ? `Last updated: ${format(new Date(version.publishedAt), "d MMMM yyyy")} — v${version.version}`
          : "Last updated: 1 January 2026"}
      </p>

      {version?.content ? (
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(version.content) }} />
      ) : (
        <p>
          Our Privacy Policy is currently being updated. Please contact{" "}
          <a href="mailto:privacy@scriptor.app">privacy@scriptor.app</a> for the latest version.
        </p>
      )}

      <hr />
      <p className="text-sm">
        You can review and update your consent choices at any time in{" "}
        <Link href="/dashboard/consents">Privacy Settings</Link>. For security practices, see our{" "}
        <Link href="/security">Security page</Link>.
      </p>
    </article>
  );
}
