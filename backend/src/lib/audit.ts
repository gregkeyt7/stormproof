import { prisma } from "./prisma";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

type AuditInput = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: JsonValue;
  ipAddress?: string;
};

export async function auditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details ?? undefined,
      ipAddress: input.ipAddress,
    },
  });
}
