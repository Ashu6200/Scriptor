import "dotenv/config";
import crypto from "node:crypto";
import {
  AuditAction,
  CommentStatus,
  PlatformRole,
  PrismaClient,
  SubscriptionPlan,
  WebhookDeliveryStatus,
  WebhookEvent,
  WorkspaceType,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the environment");
}

const prisma = new PrismaClient();

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

import { seedDpdpPolicies } from "./seed-dpdp-policies";

async function seed() {
  const shouldReset = process.env.RESET_DB === "true" || process.argv.includes("--reset");

  console.log("Starting CodeVault comprehensive seed...");

  if (shouldReset) {
    console.log("RESET requested - purging database...");
    await prisma.platformSetting.deleteMany();
    await prisma.billingTransaction.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany({ where: { parentId: { not: null } } });
    await prisma.comment.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.document.deleteMany({ where: { parentId: { not: null } } });
    await prisma.document.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.verification.deleteMany();
    console.log("Database cleanup complete.");
  } else {
    console.log("Running in safe idempotent mode (use --reset to wipe DB).");
  }

  const users = [
    {
      email: (process.env.ADMIN_EMAIL || "admin@codevault.com").toLowerCase().trim(),
      name: process.env.ADMIN_NAME || "Admin User",
      password: process.env.ADMIN_PASSWORD || "Admin@123456",
      role: PlatformRole.ADMIN,
      plan: SubscriptionPlan.MAX,
    },
  ];

  const userRecords: Record<string, Awaited<ReturnType<typeof prisma.user.upsert>>> = {};

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, emailVerified: true, platformRole: u.role, subscriptionPlan: u.plan },
      create: {
        email: u.email,
        name: u.name,
        emailVerified: true,
        platformRole: u.role,
        subscriptionPlan: u.plan,
      },
    });
    await prisma.account.upsert({
      where: {
        providerId_providerAccountId: { providerId: "credential", providerAccountId: u.email },
      },
      update: { password: hash, userId: user.id },
      create: {
        userId: user.id,
        providerId: "credential",
        providerAccountId: u.email,
        password: hash,
      },
    });
    userRecords[u.email] = user;
    console.log(`User ready: ${u.email} (${u.role}/${u.plan})`);
  }

  const admin = userRecords[users[0]!.email]!;

  const workspaceDefs = [
    { name: "Admin Workspace", slug: "admin-workspace", ownerId: admin.id },
    { name: "Admin Side Project", slug: "admin-side-project", ownerId: admin.id },
  ];

  const ws: Record<string, Awaited<ReturnType<typeof prisma.workspace.upsert>>> = {};
  for (const w of workspaceDefs) {
    ws[w.slug] = await prisma.workspace.upsert({
      where: { slug: w.slug },
      update: { name: w.name, ownerId: w.ownerId },
      create: { name: w.name, slug: w.slug, type: WorkspaceType.PERSONAL, ownerId: w.ownerId },
    });
    console.log(`Workspace ready: ${w.slug}`);
  }

  const docCount = await prisma.document.count();
  if (docCount === 0) {
    const docDefs = [
      {
        title: "Welcome to CodeVault",
        slug: "welcome-to-codevault",
        content:
          "<h1>Welcome to CodeVault</h1><p>Your personal developer knowledge base and documentation vault. Start by creating your first document or importing from Markdown.</p>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: true,
        tags: ["welcome", "getting-started"],
      },
      {
        title: "Platform Architecture",
        slug: "platform-architecture",
        content:
          "<h1>Platform Architecture</h1><h2>Overview</h2><p>CodeVault is built with Next.js 15, Prisma ORM, PostgreSQL, and Redis. The frontend uses TipTap for rich text editing with real-time collaboration support.</p><h2>Stack</h2><ul><li>Next.js 15 App Router</li><li>Prisma + PostgreSQL</li><li>Redis for caching</li><li>TipTap Editor</li></ul>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PUBLIC" as const,
        isPublished: true,
        tags: ["architecture", "technical"],
      },
      {
        title: "API Reference",
        slug: "api-reference",
        content:
          "<h1>API Reference</h1><h2>Authentication</h2><p>All API requests require a valid API key passed via the <code>Authorization</code> header.</p><h2>Endpoints</h2><h3>GET /api/documents</h3><p>List all documents in a workspace.</p><h3>POST /api/documents</h3><p>Create a new document.</p>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PUBLIC" as const,
        isPublished: true,
        tags: ["api", "reference"],
      },
      {
        title: "Deployment Guide",
        slug: "deployment-guide",
        content:
          "<h1>Deployment Guide</h1><p>Follow these steps to deploy CodeVault to production.</p><ol><li>Set up PostgreSQL and Redis</li><li>Configure environment variables</li><li>Run database migrations</li><li>Build and start the application</li></ol>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: false,
        tags: ["deployment", "devops"],
      },
      {
        title: "Project Roadmap",
        slug: "project-roadmap",
        content:
          "<h1>Project Roadmap Q4 2026</h1><h2>September</h2><ul><li>Launch v2.0 with billing</li><li>Advanced workspace analytics</li></ul><h2>October</h2><ul><li>Real-time collaboration</li><li>Mobile app beta</li></ul>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: true,
        tags: ["roadmap", "planning"],
      },
      {
        title: "Meeting Notes",
        slug: "meeting-notes",
        content:
          "<h1>Sprint Planning - Sep 1</h1><p>Attendees: Engineering Team</p><h2>Action Items</h2><ul><li>Finalize API schema</li><li>Review PRs for billing module</li><li>Set up staging environment</li></ul>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: false,
        tags: ["meetings", "sprint"],
      },
      {
        title: "Design System",
        slug: "design-system",
        content:
          "<h1>Design System</h1><h2>Colors</h2><p>Primary: #6366f1, Secondary: #8b5cf6, Accent: #06b6d4</p><h2>Typography</h2><p>Headings: Inter, Body: Inter, Code: JetBrains Mono</p>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PUBLIC" as const,
        isPublished: true,
        tags: ["design", "ui"],
      },
      {
        title: "Enterprise Handbook",
        slug: "enterprise-handbook",
        content:
          "<h1>Enterprise Handbook</h1><p>This handbook outlines policies, procedures, and best practices for enterprise teams using CodeVault.</p><h2>Onboarding</h2><p>New team members should complete the setup checklist within their first week.</p>",
        workspaceId: ws["admin-side-project"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: true,
        tags: ["enterprise", "handbook"],
      },
      {
        title: "Security Policies",
        slug: "security-policies",
        content:
          "<h1>Security Policies</h1><h2>Data Encryption</h2><p>All data is encrypted at rest using AES-256 and in transit using TLS 1.3.</p><h2>Access Control</h2><p>Role-based access control (RBAC) is enforced at both the API and UI levels.</p>",
        workspaceId: ws["admin-side-project"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: true,
        tags: ["security", "compliance"],
      },
      {
        title: "Getting Started",
        slug: "getting-started",
        content:
          "<h1>Getting Started</h1><p>Welcome! This is your first document. You can edit it using the rich text editor above.</p><p>Try adding headings, lists, code blocks, and more.</p>",
        workspaceId: ws["admin-side-project"].id,
        authorId: admin.id,
        visibility: "PRIVATE" as const,
        isPublished: false,
        tags: ["tutorial"],
      },
    ];

    const docs: Record<string, Awaited<ReturnType<typeof prisma.document.create>>> = {};
    for (const d of docDefs) {
      const doc = await prisma.document.create({ data: d });
      docs[d.slug] = doc;
    }

    await prisma.document.create({
      data: {
        title: "Authentication Details",
        slug: "authentication-details",
        content:
          "<h1>Authentication Details</h1><p>Detailed guide on OAuth2, session management, and role-based access.</p>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        parentId: docs["api-reference"].id,
        visibility: "PUBLIC",
        isPublished: true,
        tags: ["auth", "security"],
      },
    });

    await prisma.document.create({
      data: {
        title: "Old Draft",
        slug: "old-draft",
        content: "<p>This document was deleted.</p>",
        workspaceId: ws["admin-workspace"].id,
        authorId: admin.id,
        visibility: "PRIVATE",
        deletedAt: new Date(),
        tags: [],
      },
    });

    console.log(`Documents created: ${docDefs.length + 2}`);

    const versionTargets = [
      { doc: docs["welcome-to-codevault"], authorId: admin.id },
      { doc: docs["project-roadmap"], authorId: admin.id },
      { doc: docs["enterprise-handbook"], authorId: admin.id },
    ];

    for (const { doc, authorId } of versionTargets) {
      await prisma.documentVersion.createMany({
        data: [
          {
            documentId: doc.id,
            versionNumber: 1,
            title: doc.title,
            content: "<p>Initial draft</p>",
            changeSummary: "Initial version",
            createdBy: authorId,
          },
          {
            documentId: doc.id,
            versionNumber: 2,
            title: doc.title,
            content: "<p>Revised content with more details</p>",
            changeSummary: "Added more details",
            createdBy: authorId,
          },
          {
            documentId: doc.id,
            versionNumber: 3,
            title: doc.title,
            content: doc.content || "",
            changeSummary: "Final polish",
            createdBy: authorId,
          },
        ],
      });
    }
    console.log("Document versions created: 9");

    const comment1 = await prisma.comment.create({
      data: {
        content: "Great introduction! Could we add a quick-start video link?",
        documentId: docs["welcome-to-codevault"].id,
        authorId: admin.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: "Good idea, I'll add one in the next revision.",
        documentId: docs["welcome-to-codevault"].id,
        authorId: admin.id,
        parentId: comment1.id,
      },
    });
    const comment3 = await prisma.comment.create({
      data: {
        content: "The architecture diagram is missing the Redis layer.",
        documentId: docs["platform-architecture"].id,
        authorId: admin.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: "Fixed! Added Redis to the diagram.",
        documentId: docs["platform-architecture"].id,
        authorId: admin.id,
        parentId: comment3.id,
        status: CommentStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById: admin.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: "Should we version the API endpoints?",
        documentId: docs["api-reference"].id,
        authorId: admin.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: "The roadmap looks good for Q4.",
        documentId: docs["project-roadmap"].id,
        authorId: admin.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: "This comment was removed.",
        documentId: docs["meeting-notes"].id,
        authorId: admin.id,
        deletedAt: new Date(),
      },
    });
    console.log("Comments created: 7");

    const now = new Date();
    await prisma.notification.createMany({
      data: [
        {
          type: "welcome",
          payload: { message: "Welcome to CodeVault!" },
          userId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          isRead: true,
          readAt: new Date(now.getTime() - 86400000),
        },
        {
          type: "comment_added",
          payload: { documentTitle: "Welcome to CodeVault", commenterName: "Admin User" },
          userId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          isRead: false,
        },
        {
          type: "document_shared",
          payload: { documentTitle: "Platform Architecture", sharedBy: "Admin User" },
          userId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          isRead: false,
        },
      ],
    });
    console.log("Notifications created: 3");

    await prisma.billingTransaction.createMany({
      data: [
        {
          amount: 99900,
          currency: "inr",
          description: "Max Plan - Monthly",
          status: "captured",
          razorpayPaymentId: "pay_seed_max_001",
          planSnapshot: "MAX",
          userId: admin.id,
        },
        {
          amount: 99900,
          currency: "inr",
          description: "Max Plan - Monthly Renewal",
          status: "captured",
          razorpayPaymentId: "pay_seed_max_002",
          planSnapshot: "MAX",
          userId: admin.id,
        },
      ],
    });
    console.log("Billing transactions created: 2");

    await prisma.auditLog.createMany({
      data: [
        {
          action: AuditAction.LOGIN,
          resourceType: "session",
          actorId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          ipAddress: "192.168.1.10",
          userAgent: "Mozilla/5.0 Chrome/128",
        },
        {
          action: AuditAction.CREATE,
          resourceType: "workspace",
          resourceId: ws["admin-workspace"].id,
          actorId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          details: { name: "Admin Workspace" },
        },
        {
          action: AuditAction.CREATE,
          resourceType: "document",
          resourceId: docs["welcome-to-codevault"].id,
          actorId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          details: { title: "Welcome to CodeVault" },
        },
        {
          action: AuditAction.UPDATE,
          resourceType: "document",
          resourceId: docs["platform-architecture"].id,
          actorId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          details: { field: "content" },
        },
        {
          action: AuditAction.DELETE,
          resourceType: "document",
          resourceId: "deleted-doc-placeholder",
          actorId: admin.id,
          workspaceId: ws["admin-workspace"].id,
          details: { title: "Old Draft" },
        },
      ],
    });
    console.log("Audit logs created: 5");

    console.log("Webhook endpoints: 1, deliveries: 1");
  } else {
    console.log(
      "Skipping transactional data (documents, comments, etc.) - already seeded or use --reset."
    );
  }

  const settings = [
    { key: "announcement_banner", value: "Welcome to CodeVault v2.0 Platform!" },
    { key: "maintenance_mode", value: "false" },
    { key: "max_upload_size_mb", value: "50" },
    { key: "signup_enabled", value: "true" },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("Platform settings: 4");

  await seedDpdpPolicies();

  console.log("\nSeed completed successfully!");
  console.log("---------------------------------------------------");
  console.log("SEEDED CREDENTIALS:");
  console.log(`  Admin:  ${users[0]!.email} / ${users[0]!.password} (ADMIN/MAX)`);
  console.log("---------------------------------------------------");
}

seed()
  .catch((e) => {
    console.error("Error executing seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
