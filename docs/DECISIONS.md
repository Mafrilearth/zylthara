# DECISIONS — Architecture Decision Records

| Attribute            | Value                        |
| :------------------- | :--------------------------- |
| **Document ID**      | DECISIONS-001                |
| **Document Version** | 1.0.0                        |
| **Status**           | Approved                     |
| **Date Established** | 2026-11-11                   |
| **SSOT for**         | Technical decision rationale |

---

## ADR-001: Only Three Tables in Phase 1

| Field            | Value                                                                                                       |
| :--------------- | :---------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                    |
| **Date**         | 2026-11-11                                                                                                  |
| **Context**      | Phase 1 is limited to authentication. Creating tables for future phases would introduce speculative schema. |
| **Decision**     | Only `User`, `AuditLog`, and enum `Role` exist in Phase 1. All other tables are deferred.                   |
| **Consequences** | Positive: no schema rework, clear separation. Negative: Phase 2 requires new migrations, which is expected. |

---

## ADR-002: UUID and Soft Delete for All Tables

| Field            | Value                                                                                                 |
| :--------------- | :---------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                              |
| **Date**         | 2026-11-11                                                                                            |
| **Context**      | Audit trail and distributed-system readiness require stable identifiers and non-destructive deletion. |
| **Decision**     | All primary keys use UUID v4. All tables include `deletedAt`. Hard deletes prohibited.                |
| **Consequences** | Positive: data recoverable, audit intact. Negative: queries must filter `deletedAt IS NULL`.          |

---

## ADR-003: Timer Authority in Redis, Not Client

| Field            | Value                                                                                             |
| :--------------- | :------------------------------------------------------------------------------------------------ |
| **Status**       | Accepted (enforced in Phase 3)                                                                    |
| **Date**         | 2026-11-11                                                                                        |
| **Context**      | Examination timer must be immune to client-side manipulation.                                     |
| **Decision**     | Authoritative timer will use Upstash Redis TTL. Client only displays countdown from server state. |
| **Consequences** | Positive: timer cannot be paused or altered. Negative: requires Redis, already provisioned.       |

---

## ADR-004: Audit Log as Append-Only

| Field            | Value                                                                                                      |
| :--------------- | :--------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                   |
| **Date**         | 2026-11-11                                                                                                 |
| **Context**      | Audit logs must be trustworthy and tamper-evident.                                                         |
| **Decision**     | `AuditLog` is append-only. Application code exposes only `create` and `findMany`. No `update` or `delete`. |
| **Consequences** | Positive: log integrity preserved. Negative: corrections must be appended, not edited.                     |

---

## Revision History

| Version | Date       | Change          |
| :------ | :--------- | :-------------- |
| 1.0.0   | 2026-11-11 | Initial version |
