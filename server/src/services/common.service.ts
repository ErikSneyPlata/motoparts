import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";

export async function nextCode(tx: Prisma.TransactionClient, kind: "SOL" | "OT" | "MOV" | "VEN") {
  const rows = await tx.$queryRaw<{ value: number }[]>`INSERT INTO "SequenceCounter" ("key", "value") VALUES (${kind}, 1) ON CONFLICT ("key") DO UPDATE SET "value" = "SequenceCounter"."value" + 1 RETURNING "value"`;
  const width = kind === "SOL" ? 3 : 4;
  return `${kind}-${String(rows[0].value).padStart(width, "0")}`;
}
export async function appendAudit(tx: Prisma.TransactionClient, input: { userId?: string | null; action: string; entity: string; entityId?: string | null; detail?: Prisma.InputJsonValue; ip?: string | null }) {
  return tx.auditLog.create({ data: { userId: input.userId ?? null, action: input.action, entity: input.entity, entityId: input.entityId ?? null, detail: input.detail, ip: input.ip ?? null } });
}
export function locationLabel(location: { warehouse: string; shelf: number; drawer: number }) {
  return `Bodega ${location.warehouse} / Estante ${location.shelf} / Gaveta ${String(location.drawer).padStart(2, "0")}`;
}
export async function availableForPart(partId: string, tx: typeof prisma = prisma) {
  const stocks = await tx.stock.findMany({ where: { partId }, select: { onHand: true, reserved: true } });
  return stocks.reduce((sum, stock) => sum + stock.onHand - stock.reserved, 0);
}
