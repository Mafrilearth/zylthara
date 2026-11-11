# SPEC-001 — Phase 1 Specification: Authentication Foundation

| Attribute | Value |
| :--- | :--- |
| **Document ID** | SPEC-001 |
| **Document Version** | 1.1.0 |
| **Application Version** | 0.2.0-alpha.1 |
| **Status** | Approved |
| **Date Established** | 2026-11-11 |
| **Execution Deadline** | 14 calendar days |
| **Document Owner** | Fauzul (Solo Developer) |
| **SSOT for** | Phase 1 & Phase 2 scope, acceptance criteria, constraints, security principles |

---

## 1. Definitions and Abbreviations

| Abbreviation | Expansion | Definition |
| :--- | :--- | :--- |
| **SSOT** | Single Source of Truth | One information, one location, one owner |
| **SoC** | Separation of Concerns | Separating responsibilities per component |
| **ADR** | Architecture Decision Record | Documented architecture decision |
| **RBAC** | Role-Based Access Control | Access control based on user roles |
| **RSC** | React Server Component | Server-rendered React component |
| **TLS** | Transport Layer Security | Cryptographic protocol for secure transmission |
| **PII** | Personally Identifiable Information | Data identifying an individual |
| **AC** | Acceptance Criterion | A single verifiable condition for phase completion |

---

## 2. Objective

Build the authentication foundation for Zylthara as a prerequisite for Phase 2 (Booking). Phase 1 does not include examination, scoring, certification, or payment.

---

## 3. Scope

### 3.1 In-Scope Features

| ID | Feature | Description | Actor |
| :--- | :--- | :--- | :--- |
| **F-01** | Register | Account registration with `email`, `password`, `name`. | Test Taker |
| **F-02** | Login | Authentication using `email` and `password`. | Test Taker |
| **F-03** | Logout | Termination of active session. | Test Taker |
| **F-04** | Protected Dashboard | Route `/dashboard` accessible only to authenticated users. | Test Taker |

### 3.2 Out-of-Scope Features

The following must not be implemented in Phase 1: password reset, email verification via link, OAuth, two-factor authentication (2FA), booking, examination, timer, scoring, certificate, payment, proctoring.

New feature ideas must be recorded in `docs/BACKLOG.md` and must not be implemented.

---

## 4. Acceptance Criteria

Phase 1 is complete if and only if all criteria are satisfied and verified.

| ID | Criterion | Verification Method |
| :--- | :--- | :--- |
| **AC-01** | Vercel URL is publicly accessible | Open URL in browser |
| **AC-02** | Registration succeeds with valid email | Fill form, submit, check DB |
| **AC-03** | Duplicate email rejected by server | Submit same email twice |
| **AC-04** | Password shorter than 8 characters rejected by server | Submit short password |
| **AC-05** | Login succeeds and redirects to `/dashboard` | Login, check redirect |
| **AC-06** | Logout terminates session | Logout, check session |
| **AC-07** | Access to `/dashboard` without login redirects to `/login` | Open URL without session |
| **AC-08** | Every register and login recorded in `AuditLog` with complete metadata | Query via Prisma Studio |
| **AC-09** | Code pushed to GitHub using Conventional Commits | Inspect commit history |
| **AC-10** | `docs/BACKLOG.md` contains at least 8 deferred items | Open file |

If 9 of 10 criteria are satisfied, Phase 1 is not complete.

---

## 5. Technical Constraints

### 5.1 Database Schema

Permitted tables in Phase 1, Phase 2, & Phase 3:

| Table | Function |
| :--- | :--- |
| `User` | Registered user data |
| `AuditLog` | Audit trail of critical actions |
| `Role` (enum) | User role: `STUDENT`, `ADMIN` |
| `Schedule` | Exam schedules created by Admin |
| `Booking` | Ticket bookings by test takers |
| `Passage` | Reading & listening passages |
| `Question` | Questions with choices and server-only answer key |
| `Attempt` | Exam session attempts by test takers |
| `Answer` | Test taker responses per question |

Prohibited tables: `Score`, `Certificate`, `Payment`, `ExamFlag`.

### 5.2 Tech Stack (Final, Immutable)

| Layer | Technology | Role |
| :--- | :--- | :--- |
| Language | TypeScript | Type foundation |
| Package Manager | pnpm | Dependency management |
| Framework | Next.js 15 (App Router) | Fullstack (RSC, Server Actions) |
| Styling | Tailwind CSS + shadcn/ui | Interface |
| Form & Validation | React Hook Form + Zod | Form state, SSOT validation |
| Database | Neon Postgres | SSOT for data |
| ORM | Prisma | Object-relational mapping |
| Authentication | Neon Managed Better Auth | Session management |
| Cache (ready, inactive) | Upstash Redis | Time authority (Phase 3) |
| Deployment | Vercel Hobby | Hosting |
| Dev Tool | Google Antigravity IDE | Agentic IDE |

### 5.3 Security Principles (Non-Deferrable)

| ID | Principle | Enforcement |
| :--- | :--- | :--- |
| **SEC-01** | Server-side validation with Zod in Server Actions | Zod invoked before any business logic |
| **SEC-02** | `answerKey` never transmitted to client | Response shape excludes `answerKey` |
| **SEC-03** | RBAC on every Server Action | `requireRole()` guard wraps protected actions |
| **SEC-04** | UUID v4 + soft delete (`deletedAt`) on all tables | Defined in `schema.prisma`; no hard deletes |
| **SEC-05** | Audit logging for critical actions | Server Action writes to `AuditLog` |
| **SEC-06** | Audit metadata completeness: `userId`, `action`, `createdAt`, `ipAddress`, `metadata` | Populated by audit helper |
| **SEC-07** | Audit log is append-only | Repository exposes only `create` and `findMany` |
| **SEC-08** | Encryption in transit (TLS) to Neon Postgres | `sslmode=require` in connection string |
| **SEC-09** | Password hashing delegated to Neon Managed Better Auth | App never reads/writes `password` directly |
| **SEC-10** | Data minimization: only necessary fields in scope | No extraneous PII collected |

Violation of any SEC principle results in Phase 1 being declared incomplete.

---

## 6. Related Documents

| Document | Role |
| :--- | :--- |
| `docs/DECISIONS.md` | SSOT for technical decision rationale |
| `CHANGELOG.md` | SSOT for version history |
| `docs/BACKLOG.md` | SSOT for deferred work |
| `prisma/schema.prisma` | SSOT for database structure |

SSOT Rule: the same information must not appear in two documents. If duplication is detected, one must be removed.

---

## 7. Revision History

| Version | Date | Change |
| :--- | :--- | :--- |
| 1.0.0 | 2026-11-11 | Initial version, approved |
| 1.1.0 | 2026-11-11 | Unlock Phase 2 database schema: permit `Schedule` and `Booking` |
