<div align="center">

# Zylthara

**Institutional Test Integrity Engine**

[![Phase](https://img.shields.io/badge/Phase_1-In_Progress-orange?style=flat-square)]()
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)]()
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)]()
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E699?style=flat-square&logo=neon)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)]()

*A portfolio build. Not an ETS product.*

</div>

---

## Overview

Zylthara is a computer-based English proficiency examination platform for institutional use. It is built in verified phases; Phase 1 — authentication — is currently in progress.

**Scope of Phase 1:** register, login, logout, and a role-gated dashboard, with server-side validation and append-only audit logging.

**Definition of done:** all ten acceptance criteria in [`SPEC.md`](./SPEC.md) pass.

---

## Status

| Item | Value |
| :--- | :--- |
| Phase | 1 — Authentication Foundation |
| State | In Progress |
| Version | `0.1.0-alpha.1` |
| Next milestone | All AC-01…AC-10 verified |

---

## Feature Matrix

| Capability | Phase | Status |
| :--- | :--- | :--- |
| Account registration | 1 | In Progress |
| Session-based login | 1 | In Progress |
| Session termination | 1 | In Progress |
| Role-gated dashboard | 1 | In Progress |
| Immutable audit trail | 1 | In Progress |
| Schedule management | 2 | Planned |
| Seat booking with quota | 2 | Planned |
| Three-section test engine | 3 | Planned |
| Server-authoritative timer | 3 | Planned |
| ITP-style score conversion | 4 | Planned |
| Verifiable certificate | 5 | Planned |
| Sandbox payment | 5 | Planned |
| Anti-cheat event logging | 6 | Planned |

---

## Quick Start

**Requires:** Node.js ≥ 20, pnpm ≥ 9, a free Neon account.

```bash
git clone https://github.com/fauzul/zylthara.git
cd zylthara
pnpm install
cp .env.example .env.local        # fill in both Neon URLs
pnpm prisma migrate dev --name init
pnpm dev
```

App runs at `http://localhost:3000`.

### Environment Variables

| Name | Used by |
| :--- | :--- |
| `DATABASE_URL` | The running app (pooled) |
| `DATABASE_URL_UNPOOLED` | Prisma CLI only (direct) |

Commit `.env.example`; never commit `.env.local`.

---

## Stack

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| Language | TypeScript | One type system end to end |
| Framework | Next.js App Router | RSC and Server Actions in one codebase |
| UI | Tailwind + shadcn/ui | Owned, editable primitives |
| Forms | React Hook Form + Zod | One schema shared by client and server |
| Database | Neon Postgres | Serverless Postgres, free tier |
| ORM | Prisma | Typed queries; migrations in Git |
| Auth | Neon Better Auth | Sessions stored with application data |
| Cache | Upstash Redis | Idle until Phase 3 (timers) |
| Hosting | Vercel Hobby | Zero-config Next.js deploys |

---

## Design Rules

| Rule | Enforced by |
| :--- | :--- |
| One source of truth per fact | Zod schemas, `schema.prisma`, `SPEC.md` |
| Server owns clock, score, log | Server Actions, append-only repository |
| Phase ends only when its checklist passes | `SPEC.md` acceptance criteria |

---

## Layout

```
zylthara/
├── src/
│   ├── app/
│   │   ├── (auth)/            register, login
│   │   ├── (dashboard)/       protected area
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── actions/           Server Actions
│   │   ├── validations/       Zod schemas
│   │   └── audit.ts           append-only writer
│   └── components/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .agents/                   Antigravity IDE config
├── AGENTS.md
├── SPEC.md
├── DECISIONS.md
├── CHANGELOG.md
├── BACKLOG.md
└── README.md
```

---

## Documentation

| File | Owns |
| :--- | :--- |
| [`SPEC.md`](./SPEC.md) | Scope, acceptance criteria, security rules |
| [`DECISIONS.md`](./DECISIONS.md) | Architecture rationale (ADR) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release history |
| [`BACKLOG.md`](./BACKLOG.md) | Deferred features |
| [`AGENTS.md`](./AGENTS.md) | AI operating rules |

One fact, one file. Overlap is a bug.

---

## Roadmap

| Phase | Theme | Completes when |
| :--- | :--- | :--- |
| 1 | Authentication | AC-01…AC-10 pass |
| 2 | Booking | A seat can be reserved and verified |
| 3 | Examination | Three sections run under a server clock |
| 4 | Scoring | A scaled score is computed and reviewable |
| 5 | Credential | A verifiable certificate is issued |
| 6+ | Hardening | Proctoring, payments, desktop client |

---

## Legal

```
Zylthara is an independent portfolio build.

Not affiliated with, endorsed by, or approved by Educational Testing
Service (ETS). TOEFL® and TOEFL ITP® are registered trademarks of ETS.
Zylthara imitates the ITP format for study and demonstration only.

All data is synthetic. No real examination results, personal records,
or certificates are stored or processed.

Non-commercial use only.
```

---

## License

MIT © 2026 Fauzul