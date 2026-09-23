# CodeVault 2.0

> Modern, full-stack developer knowledge base and documentation platform built with Next.js 16, React 19, MongoDB, Prisma, Upstash Redis, and Better Auth.

CodeVault is a unified, single-process application combining a rich collaborative documentation UI, REST API route handlers, enterprise-grade authentication, role-based administration, and tiered subscription billing.

---

## Highlights & Features

- **Rich Block-Based Editor**: Powered by TipTap v3 with drag-and-drop block handles, bubble menus, formatting toolbars, code highlighting, tables, task lists, and auto-saving.
- **Interactive Mermaid Diagrams**: Native TipTap custom node supporting architecture flowcharts, sequence diagrams, system topologies, and git graphs with live theme-reactive SVG rendering and presets.
- **CodeVault Copilot (AI Assistant)**: In-editor AI assistant accessible via `/ai` slash command and toolbar to draft specifications, summarize documents, explain code, and polish technical writing via Google Gemini.
- **Public Documentation Portal (`/p/[workspaceSlug]/[documentSlug]`)**: Turn any workspace or document into a fast, read-only public documentation portal with breadcrumbs, nested navigation, reading time estimation, and code block copying.
- **Trash & Document Recovery**: Soft-delete management (`/dashboard/trash`) allowing one-click document restoration, permanent purging, and bulk trash cleanup with transactional cascade integrity.
- **Hierarchical Document Tree**: Nested parent-child document structure, intuitive reordering, tagging, reading time estimation, and public/private visibility control.
- **Document Versioning & Visual Diff**: Snapshot version history with visual comparison diff viewer to track, inspect, and restore previous iterations.
- **Threaded Inline Comments**: Context-aware selection-range and document-level commenting with resolution workflows.
- **Workspace Management**: Personal workspaces with customizable slugs, custom logos, workspace switcher, and quick-access pinned workspaces.
- **Subscription Tiers & Entitlements**: Three tiers (**Free**, **Pro**, **Max**) with automated feature enforcement covering document caps, workspace limits, version history retention, and audit logs.
- **Platform Admin Portal**: Dedicated platform administration dashboard (`/admin`) for user management, workspace moderation/suspension, revenue metrics, transaction ledger auditing, and system settings.
- **Payments & Ledger**: Complete Razorpay integration with one-time payment orders, subscription lifecycle tracking, double-entry transaction ledgers, refund processing, and cryptographically verified webhooks.
- **Authentication & Security**: Powered by Better Auth with email/password authentication, social OAuth (Google & GitHub), password reset/verification via Resend, HTTP-only session cookies, Upstash Redis secondary caching, and Strict Content Security Policy (CSP).
- **Command Palette (Cmd+K)**: Instant full-text search across documents and workspaces with tag filtering and keyboard shortcuts.
- **Modern UI & Theming**: Built with Tailwind CSS v4, Base UI primitives, Framer Motion animations, Sonner toasts, and seamless light/dark theme switching.

---

## Architecture

CodeVault is engineered as a unified Next.js full-stack system:

```text
CodeVault 2.0
├── Frontend (src/app, src/components, src/features)
│   ├── app/                      App Router pages (Server & Client Components)
│   │   ├── (auth)/               Login, Signup, Forgot/Reset Password, Verify Email
│   │   ├── dashboard/            Documents, Workspaces, Billing, Notifications, Audit, Settings
│   │   └── admin/                Metrics, Analytics, Users, Workspaces, Transactions, Settings
│   ├── components/               Tailwind CSS v4 & Base UI component library
│   ├── features/                 RTK Query API slices and Redux Toolkit store
│   └── hooks/                    Custom React hooks (theme, debounce, shortcuts)
│
├── Backend (src/server/)
│   ├── http/createHandler.ts     Unified middleware wrapper (Auth, Workspace, Rate Limit, Entitlements)
│   ├── core/                     Entitlements matrix, standardized AppError classes
│   ├── infrastructure/           Database (Prisma), Cache (Upstash Redis), Auth (Better Auth), Logger (Pino)
│   └── modules/                  Domain services and Zod validation schemas
│
└── Database (prisma/schema.prisma)
    └── MongoDB via Prisma 6 ORM
```

### Request Lifecycle

```text
Client Component -> /api/* -> Next.js Route Handler -> createHandler Pipeline -> Service -> Prisma -> MongoDB
                                                                │
                                                   ┌────────────┴────────────┐
                                                   ▼                         ▼
                                            Upstash Redis               Better Auth
                                         (Rate Limit & Cache)        (Session & Security)
```

### `createHandler` Pipeline

Server endpoints run through `src/server/http/createHandler.ts`, which provides declarative, centralized request handling:

```ts
export const GET = createHandler(
  {
    auth: true,
    workspace: true,
    requireEntitlement: "hasAuditLogs",
    rateLimit: { limit: 60, windowSeconds: 60, byUser: true },
  },
  async ({ workspaceId, query, user }) => {
    const logs = await auditService.list(workspaceId, query);
    return success(logs);
  }
);
```

| Option | Description |
| --- | --- |
| `auth` | Enforces active session via Better Auth; rejects soft-deleted or deactivated users. |
| `workspace` | Resolves and verifies workspace ownership or Admin access; injects `workspaceId`. |
| `platformAdmin` | Restricts access exclusively to users with `platformRole === "ADMIN"`. |
| `requireEntitlement`| Validates user subscription tier entitlements (e.g. audit logs, document limits). |
| `rateLimit` | Enforces sliding/fixed window rate limits backed by Upstash Redis with bypass support. |

Every endpoint returns a standard unified response envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| **Frontend UI** | [React 19](https://react.dev/), [Base UI](https://base-ui.com/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Typography & Motion** | [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **Rich Text Editor** | [TipTap v3](https://tiptap.dev/) (React, StarterKit, DragHandle, BubbleMenu, Tables, Tasks) |
| **State Management** | [Redux Toolkit (RTK Query)](https://redux-toolkit.js.org/) |
| **Authentication** | [Better Auth](https://better-auth.com/) (Email/Password, Google OAuth, GitHub OAuth) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Prisma 6](https://www.prisma.io/) |
| **Cache & Rate Limiting** | [Upstash Redis](https://upstash.com/) (`@upstash/redis` REST SDK) |
| **Payments & Billing** | [Razorpay](https://razorpay.com/) (Subscriptions, Payment Orders, Webhooks, Ledger) |
| **Transactional Email** | [Resend](https://resend.com/) (Password Resets, Email Verification) |
| **Validation & Quality** | [Zod](https://zod.dev/), [Biome](https://biomejs.dev/) (Linter & Formatter), [TypeScript](https://www.typescriptlang.org/) |

---

## Subscription Plans & Entitlements

CodeVault implements a tiered entitlement model enforced at the API layer:

| Feature / Limit | Free Plan | Pro Plan | Max Plan |
| --- | :---: | :---: | :---: |
| **Maximum Workspaces** | 1 | 5 | Unlimited |
| **Maximum Documents** | 30 | Unlimited | Unlimited |
| **Version History Retention** | 7 Days | 90 Days | 365 Days |
| **Audit Logs Access** | ❌ | ✅ | ✅ |
| **Trash & Document Recovery** | ❌ | ✅ | ✅ |
| **Interactive Mermaid Diagrams** | ❌ | ✅ | ✅ |
| **CodeVault AI Copilot** | ❌ | ❌ | ✅ |
| **Admin Analytics & Metrics** | ❌ (Admins only) | ❌ (Admins only) | ❌ (Admins only) |

---

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **MongoDB**: A running MongoDB instance (Atlas cluster or local MongoDB 6+)
- **Upstash Redis**: An Upstash Redis REST database URL and Token
- **Package Manager**: `npm`

### Installation & Setup

1. **Clone the repository and install dependencies**:

   ```bash
   git clone https://github.com/Ashu6200/CodeVault.git
   cd CodeVault
   npm install
   ```

2. **Configure environment variables**:

   Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

3. **Initialize the database schema**:

   Sync the Prisma schema directly to your MongoDB database:

   ```bash
   npm run prisma:generate
   npm run prisma:db-push
   ```

4. **Seed sample data**:

   Populate the database with sample users, plans, workspaces, documents, versions, comments, audit logs, and settings:

   ```bash
   npm run db:seed
   ```

   > **Note**: To wipe the database and re-seed completely from scratch, use:
   > ```bash
   > npm run db:seed-reset
   > ```

5. **Start the development server**:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seeded Test Accounts

The seed script creates the platform administrator account:

| Account | Email | Password | Role | Plan |
| --- | --- | --- | --- | --- |
| **Platform Admin** | `admin@codevault.com` | `Admin@123456` | `ADMIN` | `MAX` |

*(Custom admin credentials can be configured via `ADMIN_EMAIL`, `ADMIN_PASSWORD`, etc. in `.env` before running the seed script).*

---

## Environment Variables

| Variable | Required | Description | Default / Example |
| --- | :---: | --- | --- |
| `DATABASE_URL` | **Yes** | MongoDB connection URI string | `mongodb+srv://user:pass@cluster.mongodb.net/codevault` |
| `UPSTASH_REDIS_REST_URL` | **Yes** | Upstash Redis REST API endpoint | `https://xxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Upstash Redis REST API token | `your-upstash-rest-token` |
| `BETTER_AUTH_SECRET` | **Yes** | Secret for signing auth session tokens | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | No | Base application URL for auth callbacks | `http://localhost:3000` |
| `CORS_ORIGIN` | No | Comma-separated list of trusted client origins | `http://localhost:3000` |
| `REQUIRE_EMAIL_VERIFICATION` | No | Enforces email verification before login | `false` |
| `RESEND_API_KEY` | No | Resend API key for transactional emails | `re_xxxxxxxxxxxx` |
| `EMAIL_FROM` | No | Sender email address for verification/resets | `CodeVault <no-reply@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth Client Secret | `GOCSPX-xxxx` |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth Application Client ID | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth Application Client Secret | `xxxxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_ID` | No | Razorpay API Key ID | `rzp_test_xxxx` |
| `RAZORPAY_KEY_SECRET` | No | Razorpay API Key Secret | `xxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | No | Secret for verifying Razorpay webhook signatures | `whsec_xxxx` |
| `RAZORPAY_PLAN_ID_PRO` | No | Razorpay Subscription Plan ID for Pro tier | `plan_xxxx` |
| `RAZORPAY_PLAN_ID_MAX` | No | Razorpay Subscription Plan ID for Max tier | `plan_xxxx` |
| `RATE_LIMIT_BYPASS_IPS` | No | Comma-separated IP addresses exempt from rate limits | `127.0.0.1` |
| `ENABLE_LOGGING` | No | Enable Pino application logger | `true` |
| `LOG_LEVEL` | No | Log output level (`info`, `warn`, `error`, `debug`) | `info` |

---

## API Surface

All API routes are served under `/api` and authenticate via Better Auth HTTP-only cookies:

### Authentication & Account (`/api/auth`, `/api/users`)
- `ALL /api/auth/[...all]` — Better Auth endpoints (sign-in, sign-up, sign-out, OAuth callbacks, email verification)
- `GET /api/auth/me` — Retrieve active session user
- `POST /api/auth/deactivate` — Soft-deactivate current user account
- `GET /api/auth/providers` — List enabled authentication providers
- `GET, PUT /api/users/profile` — Fetch or update user profile
- `POST /api/users/change-password` — Change account password
- `GET /api/users/sessions` — List active login sessions

### Workspaces (`/api/workspaces`)
- `GET /api/workspaces` — List user's workspaces
- `POST /api/workspaces` — Create a new workspace (enforces plan limit)
- `GET /api/workspaces/pinned` — Get pinned workspaces
- `GET /api/workspaces/slug/:slug` — Look up workspace by unique slug
- `GET, PUT, DELETE /api/workspaces/:workspaceId` — Retrieve, update, or delete a workspace
- `POST /api/workspaces/:workspaceId/pin` — Toggle workspace pinned status

### Documents, Trash & Versions (`/api/workspaces/:workspaceId/documents`)
- `GET /api/workspaces/:workspaceId/documents` — List documents in workspace
- `POST /api/workspaces/:workspaceId/documents` — Create document (enforces plan document cap)
- `GET /api/workspaces/:workspaceId/documents/tree` — Fetch hierarchical document navigation tree
- `GET, PUT, DELETE /api/workspaces/:workspaceId/documents/:documentId` — Retrieve, update, or soft-delete document
- `GET, DELETE /api/workspaces/:workspaceId/documents/trash` — List trashed documents or bulk empty trash
- `POST /api/workspaces/:workspaceId/documents/:documentId/restore` — Restore document from trash
- `DELETE /api/workspaces/:workspaceId/documents/:documentId/permanent` — Permanently purge document and its relations
- `GET /api/workspaces/:workspaceId/documents/:documentId/versions` — List snapshot versions for a document

### AI & Public Documentation Portal
- `POST /api/workspaces/:workspaceId/ai` — CodeVault Copilot AI generator (Gemini 1.5 Flash / context-aware fallback)
- `GET /api/public/documents/:workspaceSlug/:documentSlug` — Public unauthenticated document reader API

### Comments (`/api/workspaces/:workspaceId/comments`)
- `GET, POST /api/workspaces/:workspaceId/comments` — List or create threaded comments
- `PUT, DELETE /api/workspaces/:workspaceId/comments/:commentId` — Edit or delete comment
- `POST /api/workspaces/:workspaceId/comments/:commentId/resolve` — Toggle resolved state on a comment thread

### Search, Notifications & Audit
- `GET /api/search` — Search documents and workspaces with tag & query filters
- `GET /api/notifications` — List notifications for current user
- `GET /api/notifications/unread-count` — Count unread notifications
- `POST /api/notifications/mark-all-read` — Mark all notifications as read
- `POST /api/notifications/:id/read` — Mark single notification as read
- `GET /api/workspaces/:workspaceId/audit` — Retrieve workspace audit log entries (Pro/Max feature)

### Payments & Billing (`/api/payments`, `/api/billing`)
- `POST /api/payments/orders` — Create a Razorpay payment order
- `POST /api/payments/verify` — Cryptographically verify payment signature & capture transaction
- `POST /api/payments/webhooks` — Handle incoming Razorpay webhook events
- `POST /api/payments/reconcile` — Reconcile transactions against payment gateway
- `GET /api/payments/:id` — Retrieve payment order & ledger details

### Platform Administration (`/api/admin`)
- `GET /api/admin/metrics` — High-level platform statistics (users, active workspaces, revenue)
- `GET /api/admin/analytics` — Platform growth, user signups, and churn analytics
- `GET /api/admin/users` — Paginated user directory with role and plan filters
- `GET, PUT /api/admin/users/:userId` — View user details or update platform role/status
- `GET /api/admin/workspaces` — Platform workspace directory
- `POST /api/admin/workspaces/:workspaceId/suspend` — Suspend or reinstate a workspace
- `GET /api/admin/transactions` — Global transaction and double-entry ledger stream
- `GET, PUT /api/admin/settings` — Read or update global platform settings

### System Health
- `GET /health` — Liveness health check
- `GET /ready` — Readiness check verifying MongoDB and Redis connectivity

---

## Available Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `next dev` | Start development server on `localhost:3000` |
| `npm run build` | `next build` | Build production bundle (with React Compiler) |
| `npm start` | `next start` | Start production server |
| `npm run lint` | `biome check .` | Run Biome lint & code style checks |
| `npm run lint:fix` | `biome check --write .` | Automatically fix linting and style issues |
| `npm run format` | `biome format --write .` | Format codebase using Biome |
| `npm run typecheck` | `tsc --noEmit` | Validate TypeScript types without emitting files |
| `npm run prisma:generate`| `prisma generate` | Generate Prisma client bindings |
| `npm run prisma:db-push` | `prisma db push` | Push schema changes directly to MongoDB |
| `npm run prisma:studio`  | `prisma studio` | Open Prisma Studio database GUI |
| `npm run db:seed` | `tsx scripts/seed-users.ts` | Seed database with users, workspaces, docs & data |
| `npm run db:seed-reset` | `tsx scripts/seed-users.ts --reset` | Purge entire database and re-seed |

---

## Directory Structure

```text
CodeVault/
├── prisma/
│   └── schema.prisma              # MongoDB Prisma data models & enums
├── public/                        # Static assets, icons, logos
├── scripts/
│   └── seed-users.ts              # Database seeding script
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth pages (login, signup, password resets)
│   │   ├── admin/                 # Platform administration pages
│   │   ├── api/                   # Route handlers (REST API surface)
│   │   ├── dashboard/             # Core user dashboard (docs, workspaces, billing)
│   │   ├── layout.tsx             # Root layout with ThemeProvider & StoreProvider
│   │   └── page.tsx               # Marketing landing page
│   ├── components/
│   │   ├── admin/                 # Admin portal UI components
│   │   ├── billing/               # Checkout modals & subscription cards
│   │   ├── documents/             # VersionDiffViewer & document tools
│   │   ├── landing/               # Landing page hero, pricing, features, footer
│   │   ├── layout/                # Sidebar, Topbar, WorkspaceSwitcher
│   │   ├── search/                # Search dialog & CommandMenu
│   │   └── ui/                    # Base UI / shadcn style primitives
│   ├── features/                  # RTK Query API slice definitions
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utility helpers, email client, templates
│   ├── server/
│   │   ├── core/                  # Entitlements, standard error models
│   │   ├── http/                  # createHandler middleware, error formatters
│   │   ├── infrastructure/        # Prisma, Upstash Redis, Better Auth, Pino
│   │   └── modules/               # Domain business logic & Zod schemas
│   ├── store/                     # Redux Toolkit global store configuration
│   └── types/                     # Shared TypeScript interface definitions
├── biome.json                     # Biome formatting and linting configuration
├── next.config.ts                 # Next.js compiler & security header rules
├── package.json                   # Dependencies and npm scripts
└── tsconfig.json                  # TypeScript compiler options
```

---

## License

This project is licensed under the MIT License.
