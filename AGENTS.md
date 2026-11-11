# AGENTS.md — Project Constitution & Operating Rules

## 1. Project Identity

- **Project**: Zylthara — Institutional Test Integrity Engine (Showcase Edition).
- **Current Phase**: Phase 2 — Booking System.
- **Primary Goal**: Build a rock-solid authentication and exam schedule booking system (register, login, logout, protected dashboard, schedule management, and ticket booking).

## 2. Immutable Tech Stack

| Layer | Technology |
| :--- | :--- |
| Language | TypeScript |
| Framework | Next.js 15 (App Router) |
| Database | Neon Postgres |
| ORM | Prisma |
| Auth | Neon Managed Better Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Cache (ready, inactive) | Upstash Redis |
| Deployment | Vercel Hobby |

Do NOT suggest or use any other framework, database, or library.

## 3. Active Phase Hard Constraints (The "Do NOT" List)

- **Database Tables**: Only `User`, `AuditLog`, `Schedule`, `Booking`, and enum `Role` are permitted. Creating any other table (e.g., `Attempt`, `Question`, `Score`, `Certificate`, `Payment`, `ExamFlag`) is a CRITICAL FAILURE.
- **Features**: Implement ONLY authentication (register, login, logout, protected dashboard), Admin CRUD for schedules, and Test Taker booking of schedules/tickets. Any other feature request must be added to `docs/BACKLOG.md` and NOT implemented.
- **Scope Creep**: Never start a new feature, refactor, or add a dependency without explicit user approval.

## 4. Mandatory Security & Quality Gates (SEC-01 to SEC-10)

Every code change must adhere to these non-negotiable principles:

1. **SEC-01 — Server-Side Validation (Zod)**: All Server Actions must validate input with Zod. Client input is never trusted.
2. **SEC-02 — No `answerKey` Exposure**: The `answerKey` field must NEVER be included in any API response or client-side code.
3. **SEC-03 — RBAC**: Every Server Action must check user role via `requireRole()`.
4. **SEC-04 — UUID & Soft Delete**: All tables use UUID primary keys and `deletedAt` for soft deletion.
5. **SEC-05 — Audit Logging**: Every critical action (register, login, logout, schedule creation, booking) must create an `AuditLog` entry.
6. **SEC-06 — Audit Metadata Completeness**: Each `AuditLog` entry must contain `userId`, `action`, `createdAt`, `ipAddress`, and `metadata`.
7. **SEC-07 — Append-Only Audit**: The `AuditLog` repository must expose only `create` and `findMany`. No `update` or `delete`.
8. **SEC-08 — TLS**: All database connections use `sslmode=require`.
9. **SEC-09 — Password Hashing**: Delegated to Neon Managed Better Auth. Application code never reads or writes `password` directly.
10. **SEC-10 — Data Minimization**: Only collect necessary data strictly in scope for the active phase.

## 5. Source of Truth (SSOT) References

| Concern | Document |
| :--- | :--- |
| Scope & acceptance criteria | `docs/SPEC.md` |
| Architecture decisions | `docs/DECISIONS.md` |
| Deferred work | `docs/BACKLOG.md` |
| Database structure | `prisma/schema.prisma` |
| Release history | `CHANGELOG.md` |

No information may be duplicated across documents. If duplication is found, one copy is removed.

## 6. Response Format for Code Tasks

When asked to build a feature, respond in this exact order:

1. **Spec** — one sentence: which feature and which acceptance criterion (AC-ID) it satisfies.
2. **Plan** — 3–5 numbered steps.
3. **Code** — file paths and full content.
4. **Verify** — exact steps the user must click or run to verify.
5. **Stop** — do not begin the next feature until the user confirms verification.

## 7. Forbidden Actions

- Creating files outside the agreed structure.
- Adding dependencies not listed in Section 2.
- Modifying `CHANGELOG.md`, `docs/SPEC.md`, `docs/DECISIONS.md`, or `docs/BACKLOG.md` without explicit user instruction.
- Proposing alternative frameworks or architecture.
- Starting Phase 3 work while Phase 2 criteria are unverified.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ (resolved from this file's directory; in monorepos the next package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by next dev — verify at node_modules/next/dist/server/lib/generate-agent-files.js. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
