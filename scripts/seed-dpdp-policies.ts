import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedDpdpPolicies() {
  console.log("Seeding DPDP-compliant policies into the database...");

  // Find an admin user to assign as creator
  const adminUser = await prisma.user.findFirst({
    where: { platformRole: "ADMIN" },
    select: { id: true, email: true },
  });

  const creatorId = adminUser?.id || "system-admin";
  console.log(`Using creator ID: ${creatorId} (${adminUser?.email || "system default"})`);

  const policiesData = [
    {
      key: "privacy-core-processing",
      name: "Privacy Policy & Core Data Processing",
      description:
        "Mandatory service processing policy governing account management, workspace authentication, and document persistence.",
      status: "PUBLISHED" as const,
      version: {
        version: 1,
        purpose:
          "Account authentication, session management, secure document storage, and access authorization across workspaces.",
        dataCategories: [
          "Full Name",
          "Email Address",
          "IP Address",
          "Authentication Logs",
          "Workspace & Document Metadata",
        ],
        processingDescription:
          "Personal data is processed strictly as necessary for the performance of our contract with you to provide the CodeVault collaborative platform, including identity verification, role-based workspace permissions, and audit logging.",
        retentionPeriod:
          "Active duration of account plus 180 days post-deletion for legal and audit compliance.",
        consentRequired: false,
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        effectiveFrom: new Date(),
        content: `# CodeVault Core Privacy & Data Processing Policy

**Effective Date:** 24 September 2026  
**Version:** 1.0 (DPDP Act, 2023 Compliant)

## 1. Introduction and Scope
CodeVault ("we", "us", or "our") is dedicated to safeguarding your personal data in strict compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act). This Core Policy outlines how we collect, process, and protect your digital personal data when you interact with our platform.

## 2. Grounds for Processing
Under Section 4 and Section 7 of the DPDP Act, 2023, your personal data is processed for specified, necessary operational purposes:
- Provision and maintenance of your user account and authentication services.
- Enforcement of role-based access control (RBAC) across shared workspaces and documents.
- Preservation of document version history and tamper-evident audit trails.

## 3. Categories of Personal Data Collected
- **Identity & Contact Data:** Name, email address, profile avatar.
- **Technical & Security Data:** IP address, browser type, device information, session identifiers.
- **Workspace Data:** Created documents, comments, revisions, and permissions.

## 4. Retention and Erasure
Your personal data is retained only for the period necessary to fulfill the stated purposes. Upon account deletion, personal records are permanently erased after a statutory compliance hold of 180 days, except where retention is mandated by applicable law.

## 5. Data Principal Rights
As a Data Principal under the DPDP Act, 2023, you hold the following statutory rights:
- Right to access information about personal data processed.
- Right to correction, completion, and updating of personal data.
- Right to erasure of personal data that is no longer necessary.
- Right of grievance redressal via our Data Protection Officer (DPO).
- Right to nominate an individual in the event of death or incapacity.

## 6. Contact and Grievance Officer
For any questions or grievances regarding this policy:
- **Email:** privacy@codevault.com
- **Grievance Redressal:** Available via the Admin Compliance Portal.`,
      },
    },
    {
      key: "product-analytics",
      name: "Product Analytics & Usage Telemetry",
      description:
        "Optional policy for collecting anonymized usage metrics, feature adoption data, and UI performance logs.",
      status: "PUBLISHED" as const,
      version: {
        version: 1,
        purpose:
          "Measure feature usage, analyze navigation patterns, identify application bottlenecks, and improve product performance.",
        dataCategories: [
          "Feature Usage Events",
          "Page View Timings",
          "Browser & Device Specifications",
          "Error Diagnostics",
        ],
        processingDescription:
          "Usage metrics are aggregated and pseudonymized to evaluate feature adoption, assess latency, and prioritize platform improvements.",
        retentionPeriod: "12 months rolling retention from capture date.",
        consentRequired: true,
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        effectiveFrom: new Date(),
        content: `# CodeVault Analytics & Telemetry Policy

**Effective Date:** 24 September 2026  
**Version:** 1.0 (DPDP Act, 2023 Compliant)

## 1. Purpose of Analytics Processing
With your explicit consent under Section 6 of the DPDP Act, 2023, CodeVault collects pseudonymized platform interaction metrics to enhance application performance, understand feature adoption, and improve user workflows.

## 2. Personal Data Categories
- Interaction telemetry: button clicks, navigation flows, and editor tool activations.
- Technical performance data: bundle load times, render latencies, and API response durations.
- Device & browser context: display resolution, operating system, and browser engine version.

## 3. Data Minimization & Protection
- All analytics identifiers are salted and pseudonymized.
- We do not track document content, keystrokes, or confidential code snippets.
- Data is processed on secure cloud infrastructure and never sold or shared with data brokers.

## 4. Consent and Right to Withdraw
- Your consent is entirely voluntary.
- You can withdraw your consent at any time via your Account Settings > Privacy & Consents.
- Withdrawal of consent will immediately halt telemetry collection without affecting your core service access.`,
      },
    },
    {
      key: "marketing-communications",
      name: "Marketing Communications & Product Updates",
      description:
        "Optional policy governing delivery of developer newsletters, release announcements, and platform webinars.",
      status: "PUBLISHED" as const,
      version: {
        version: 1,
        purpose:
          "Send periodic newsletters, announcements about new features, security bulletins, and promotional offers.",
        dataCategories: [
          "Email Address",
          "Preferred Name",
          "Communication Preferences",
          "Campaign Engagement",
        ],
        processingDescription:
          "We process your contact details to deliver relevant updates on CodeVault enhancements, new integrations, and educational webinars based on your stated interests.",
        retentionPeriod: "Until consent is withdrawn or account is closed.",
        consentRequired: true,
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        effectiveFrom: new Date(),
        content: `# CodeVault Marketing & Communication Policy

**Effective Date:** 24 September 2026  
**Version:** 1.0 (DPDP Act, 2023 Compliant)

## 1. Notice of Purpose
In compliance with the DPDP Act, 2023, CodeVault seeks your clear, affirmative consent to deliver product updates, technical changelogs, developer tutorials, and educational invitations.

## 2. Communication Channels
- Direct email updates and digests.
- In-app product update notifications.

## 3. Data Categories Involved
- Registered email address.
- Preferred display name.
- Subscription and notification preference tags.

## 4. Withdrawal of Consent
You have the right to withdraw your consent at any time with ease equal to how it was granted. Every marketing email contains a one-click unsubscribe link, and preferences can be updated instantly from your Consent Dashboard.`,
      },
    },
    {
      key: "ai-content-processing",
      name: "AI Assistant & Document Intelligence",
      description:
        "Optional policy governing generative AI processing for document summarization, code explanation, and auto-completion.",
      status: "PUBLISHED" as const,
      version: {
        version: 1,
        purpose:
          "Provide AI-powered document summarization, code explanation, grammar enhancement, and diagram generation.",
        dataCategories: [
          "User Prompts",
          "Document Excerpts Selected for AI",
          "Model Response History",
        ],
        processingDescription:
          "Selected document text and user instructions are sent over TLS encryption to enterprise AI model endpoints solely to compute the requested response in real time. Prompts are never used to train public models.",
        retentionPeriod:
          "Zero-retention for training; 30-day transient logging for abuse prevention and rate-limiting.",
        consentRequired: true,
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        effectiveFrom: new Date(),
        content: `# CodeVault AI Assistant & Content Processing Policy

**Effective Date:** 24 September 2026  
**Version:** 1.0 (DPDP Act, 2023 Compliant)

## 1. Purpose Specification
CodeVault provides optional AI-assisted writing, code analysis, and document summarization. By opting into this policy, you consent to transient processing of user-selected text blocks by enterprise LLM processors.

## 2. No Model Training Commitment
- Your private documents, confidential code, and prompts are **NEVER** used to train, retrain, or fine-tune public or third-party AI models.
- All AI processing occurs within dedicated enterprise instances governed by strict confidentiality commitments.

## 3. Data Flow and Security
- Data is transmitted solely via TLS 1.3 encryption.
- Transient payloads are retained for a maximum of 30 days strictly for rate-limiting, safety filtering, and abuse detection, after which they are automatically purged.

## 4. Voluntary Consent
- AI features are entirely optional. If you reject or withdraw consent, the AI Assistant modal will remain disabled, and none of your document data will be transmitted to AI processors.`,
      },
    },
    {
      key: "third-party-integrations",
      name: "Third-Party Integrations & Webhook Forwarding",
      description:
        "Draft policy governing external webhook notifications and third-party developer tool integrations.",
      status: "DRAFT" as const,
      version: {
        version: 1,
        purpose:
          "Forward workspace activity events and document notifications to customer-configured webhooks and external APIs.",
        dataCategories: [
          "Webhook Payload",
          "Event Timestamps",
          "Actor Identifier",
          "Resource Metadata",
        ],
        processingDescription:
          "Transmits real-time events to user-designated destination endpoints for CI/CD integrations, alerting systems, and external issue trackers.",
        retentionPeriod: "Webhook delivery logs retained for 30 days.",
        consentRequired: true,
        status: "DRAFT" as const,
        publishedAt: null,
        effectiveFrom: null,
        content: `# CodeVault Third-Party Integrations Policy (Draft)

**Status:** Under Legal Review & Draft Lifecycle  
**Version:** 1.0-draft

## 1. Purpose
This policy governs data transferred when workspace administrators configure outbound webhooks and third-party integrations (e.g., Slack, GitHub, custom HTTP listeners).

## 2. Shared Data
Payloads include event headers, timestamps, actor IDs, and document identifiers.

## 3. Admin Control
Webhooks can be paused, modified, or permanently deleted by workspace owners at any time.`,
      },
    },
  ];

  const createdPolicies = [];

  for (const item of policiesData) {
    const { version, ...policyMeta } = item;

    // Upsert policy
    let policy = await prisma.dpdpPolicy.findUnique({
      where: { key: policyMeta.key },
      include: { versions: true },
    });

    if (!policy) {
      policy = await prisma.dpdpPolicy.create({
        data: {
          key: policyMeta.key,
          name: policyMeta.name,
          description: policyMeta.description,
          status: policyMeta.status,
          createdBy: creatorId,
          versions: {
            create: {
              ...version,
              createdBy: creatorId,
            },
          },
        },
        include: { versions: true },
      });
      console.log(`Created policy: "${policy.name}" (${policy.key}) [${policy.status}]`);
    } else {
      // Update existing
      policy = await prisma.dpdpPolicy.update({
        where: { id: policy.id },
        data: {
          name: policyMeta.name,
          description: policyMeta.description,
          status: policyMeta.status,
        },
        include: { versions: true },
      });

      // Check version 1
      const existingVersion = policy.versions.find((v) => v.version === 1);
      if (!existingVersion) {
        await prisma.dpdpPolicyVersion.create({
          data: {
            ...version,
            policyId: policy.id,
            createdBy: creatorId,
          },
        });
      } else {
        await prisma.dpdpPolicyVersion.update({
          where: { id: existingVersion.id },
          data: {
            purpose: version.purpose,
            dataCategories: version.dataCategories,
            processingDescription: version.processingDescription,
            retentionPeriod: version.retentionPeriod,
            consentRequired: version.consentRequired,
            content: version.content,
            status: version.status,
            publishedAt: version.publishedAt,
            effectiveFrom: version.effectiveFrom,
          },
        });
      }
      console.log(`Updated policy: "${policy.name}" (${policy.key}) [${policy.status}]`);
    }

    createdPolicies.push(policy);

    // Audit log
    await prisma.dpdpAuditLog.create({
      data: {
        actorId: creatorId,
        action: "POLICY_SEEDED",
        entityType: "DpdpPolicy",
        entityId: policy.id,
        metadata: { key: policy.key, name: policy.name, status: policy.status },
        ipAddress: "127.0.0.1",
      },
    });
  }

  // Seed sample consent records for realistic demonstration
  const allUsers = await prisma.user.findMany({
    where: { platformRole: "USER" },
    take: 3,
  });

  const publishedPolicies = await prisma.dpdpPolicy.findMany({
    where: { status: "PUBLISHED" },
    include: { versions: { where: { status: "PUBLISHED" } } },
  });

  console.log(`Seeding consent events for ${allUsers.length} users on ${publishedPolicies.length} published policies...`);

  for (const user of allUsers) {
    for (const policy of publishedPolicies) {
      const v = policy.versions[0];
      if (!v) continue;

      const existingEvent = await prisma.dpdpConsentEvent.findFirst({
        where: { userId: user.id, policyId: policy.id },
      });

      if (!existingEvent) {
        // If essential (not optional), grant
        const isEssential = !v.consentRequired;
        const status = isEssential
          ? "GRANTED"
          : user.email.includes("pro")
          ? "GRANTED"
          : "GRANTED";

        const event = await prisma.dpdpConsentEvent.create({
          data: {
            userId: user.id,
            policyId: policy.id,
            policyVersionId: v.id,
            purpose: v.purpose,
            status,
            consentMethod: "web_form",
            source: "consent_center",
            ipAddress: "127.0.0.1",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        });

        await prisma.dpdpAuditLog.create({
          data: {
            actorId: user.id,
            action: `CONSENT_${status}`,
            entityType: "DpdpConsentEvent",
            entityId: event.id,
            metadata: {
              policyId: policy.id,
              policyKey: policy.key,
              version: v.version,
            },
            ipAddress: "127.0.0.1",
          },
        });
      }
    }
  }

  // Specifically record one WITHDRAWN consent for max@codevault.com on marketing to test withdrawal history
  const maxUser = allUsers.find((u) => u.email.includes("max"));
  const marketingPolicy = publishedPolicies.find((p) => p.key === "marketing-communications");
  if (maxUser && marketingPolicy && marketingPolicy.versions[0]) {
    const v = marketingPolicy.versions[0];
    const latestEvent = await prisma.dpdpConsentEvent.findFirst({
      where: { userId: maxUser.id, policyId: marketingPolicy.id },
      orderBy: { createdAt: "desc" },
    });

    if (latestEvent && latestEvent.status === "GRANTED") {
      const withdrawnEvent = await prisma.dpdpConsentEvent.create({
        data: {
          userId: maxUser.id,
          policyId: marketingPolicy.id,
          policyVersionId: v.id,
          purpose: v.purpose,
          status: "WITHDRAWN",
          consentMethod: "web_form",
          source: "consent_center",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      await prisma.dpdpAuditLog.create({
        data: {
          actorId: maxUser.id,
          action: "CONSENT_WITHDRAWN",
          entityType: "DpdpConsentEvent",
          entityId: withdrawnEvent.id,
          metadata: {
            policyId: marketingPolicy.id,
            policyKey: marketingPolicy.key,
            version: v.version,
          },
          ipAddress: "127.0.0.1",
        },
      });
      console.log(`Created sample WITHDRAWN event for ${maxUser.email} on ${marketingPolicy.key}`);
    }
  }

  console.log("DPDP policies and consent seeding complete!");
}

// Self-run when executed directly
if (require.main === module) {
  seedDpdpPolicies()
    .catch((err) => {
      console.error("Error seeding DPDP policies:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
