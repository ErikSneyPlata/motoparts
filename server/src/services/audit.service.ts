import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

type DbClient = PrismaClient | Prisma.TransactionClient;
export async function recordAudit(db: DbClient, input: { userId?: string | null; action: string; entity: string; entityId?: string | null; detail?: Prisma.InputJsonValue; ip?: string | null }) {
  return db.auditLog.create({ data: { userId: input.userId ?? null, action: input.action, entity: input.entity, entityId: input.entityId ?? null, detail: input.detail, ip: input.ip ?? null } });
}
