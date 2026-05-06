import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

type AuditInput = {
  userId?: string;
  action: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  actorEmail?: string;
  details?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  meta?: Prisma.InputJsonValue;
  ipAddress?: string;
};

export async function createAuditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      actorEmail: input.actorEmail,
      action: input.action,
      category: input.category ?? input.entityType ?? "system",
      entityType: input.entityType,
      entityId: input.entityId,
      details: (input.details ?? input.metadata ?? input.meta ?? null) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
    },
  });
}

export const writeAuditLog = createAuditLog;
export const auditLog = createAuditLog;
