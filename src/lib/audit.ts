import { prisma } from "@/lib/prisma";

export type AuditMetadata =
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null;

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: AuditMetadata;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Append-only Audit Log Repository (SEC-05, SEC-06, SEC-07, ADR-004)
 * Non-negotiable: Exposes only `createAuditLog` and `findAuditLogs`.
 * No update or delete operations are permitted.
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  return await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      metadata: (params.metadata as any) ?? undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}

export async function findAuditLogs(params?: {
  userId?: string;
  action?: string;
  take?: number;
  skip?: number;
}) {
  return await prisma.auditLog.findMany({
    where: {
      ...(params?.userId ? { userId: params.userId } : {}),
      ...(params?.action ? { action: params.action } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: params?.take ?? 50,
    skip: params?.skip ?? 0,
  });
}
