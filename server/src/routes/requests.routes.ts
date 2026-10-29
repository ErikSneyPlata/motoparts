import { Router } from "express";
import { z } from "zod";
import { Prisma, RequestPriority, RequestStatus, Role, MovementType } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit, nextCode } from "../services/common.service.js";

const router = Router();
router.use(authenticate);
const createSchema = z.object({ repairOrderId: z.string().min(1), partId: z.string().min(1), quantity: z.number().int().min(1).max(100), priority: z.nativeEnum(RequestPriority).default(RequestPriority.NORMAL), notes: z.string().trim().max(1000).optional(), digitalSignature: z.string().trim().max(200).optional() });
const heldStatuses: RequestStatus[] = [RequestStatus.PENDING, RequestStatus.PREPARING, RequestStatus.TO_BAY, RequestStatus.READY_FOR_PICKUP];
async function reserveStock(tx: Prisma.TransactionClient, partId: string, quantity: number) {
  const rows = await tx.$queryRaw<{ id: string; onHand: number; reserved: number }[]>`SELECT "id", "onHand", "reserved" FROM "Stock" WHERE "partId" = ${partId} ORDER BY ("onHand" - "reserved") DESC FOR UPDATE`;
  const available = rows.reduce((sum, row) => sum + row.onHand - row.reserved, 0);
  if (available < quantity) return false;
  let remaining = quantity;
  for (const row of rows) {
    const take = Math.min(remaining, row.onHand - row.reserved);
    if (take > 0) await tx.stock.update({ where: { id: row.id }, data: { reserved: { increment: take } } });
    remaining -= take;
    if (remaining === 0) break;
  }
  return true;
}
async function releaseReservation(tx: Prisma.TransactionClient, partId: string, quantity: number) {
  const rows = await tx.$queryRaw<{ id: string; reserved: number }[]>`SELECT "id", "reserved" FROM "Stock" WHERE "partId" = ${partId} AND "reserved" > 0 ORDER BY "reserved" DESC FOR UPDATE`;
  let remaining = quantity;
  for (const row of rows) {
    const take = Math.min(remaining, row.reserved);
    if (take > 0) await tx.stock.update({ where: { id: row.id }, data: { reserved: { decrement: take } } });
    remaining -= take;
    if (remaining === 0) break;
  }
}

router.get("/", allowRoles(Role.ADMIN, Role.MANAGER, Role.WAREHOUSE, Role.MECHANIC), async (req, res) => {
  const status = z.nativeEnum(RequestStatus).optional().parse(req.query.status); const modelId = z.string().optional().parse(req.query.modelId);
  const mine = req.query.mine === "true" || req.user!.role === Role.MECHANIC;
  const where = { ...(status ? { status } : {}), ...(modelId ? { repairOrder: { modelId } } : {}), ...(mine ? { requestedById: req.user!.id } : {}) };
  const requests = await prisma.partRequest.findMany({ where, include: { part: { include: { stocks: { include: { location: true } } } }, repairOrder: { include: { model: { include: { brand: true } }, bay: true, mechanic: { select: { id: true, name: true } } } }, requestedBy: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } }, histories: { orderBy: { at: "asc" }, include: { user: { select: { name: true } } } } }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }] });
  return res.json({ data: requests.map((r) => ({ ...r, part: { id: r.part.id, sku: r.part.sku, name: r.part.name, priceWorkshop: Number(r.part.priceWorkshop), stock: r.part.stocks.reduce((n, row) => n + row.onHand, 0), reserved: r.part.stocks.reduce((n, row) => n + row.reserved, 0), locations: r.part.stocks.map((row) => `Bodega ${row.location.warehouse} / Estante ${row.location.shelf} / Gaveta ${String(row.location.drawer).padStart(2, "0")}`) } })) });
});
router.post("/", allowRoles(Role.MECHANIC, Role.ADMIN), async (req, res) => {
  const input = createSchema.parse(req.body);
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.repairOrder.findUnique({ where: { id: input.repairOrderId }, include: { model: true } });
    if (!order) throw Object.assign(new Error("La orden de trabajo no existe"), { status: 404 });
    if (req.user!.role === Role.MECHANIC && order.mechanicId !== req.user!.id) throw Object.assign(new Error("La orden no está asignada a tu usuario"), { status: 403 });
    const part = await tx.part.findUnique({ where: { id: input.partId }, include: { compatibilities: true } });
    if (!part || !part.isActive) throw Object.assign(new Error("El repuesto no está disponible"), { status: 404 });
    const compatible = part.compatibilities.some((c) => c.modelId === order.modelId && c.yearFrom <= order.model.yearTo && c.yearTo >= order.model.yearFrom);
    if (!compatible) throw Object.assign(new Error("Este repuesto no es compatible con el modelo de la orden de trabajo"), { status: 409 });
    const enough = await reserveStock(tx, part.id, input.quantity);
    const status = enough ? RequestStatus.PENDING : RequestStatus.RESTOCK_WAIT;
    const code = await nextCode(tx, "SOL");
    const request = await tx.partRequest.create({ data: { code, repairOrderId: order.id, partId: part.id, quantity: input.quantity, priority: input.priority, notes: input.notes, digitalSignature: input.digitalSignature, status, requestedById: req.user!.id, histories: { create: { fromStatus: null, toStatus: status, userId: req.user!.id } } }, include: { part: { select: { sku: true, name: true } }, repairOrder: { select: { code: true, plate: true } } } });
    await appendAudit(tx, { userId: req.user!.id, action: "REQUEST_CREATED", entity: "PartRequest", entityId: request.id, detail: { code, partSku: part.sku, quantity: input.quantity, status }, ip: req.ip });
    return request;
  }, { isolationLevel: "Serializable" });
  return res.status(201).json({ data: created });
});
router.patch("/:id/status", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const toStatus = z.nativeEnum(RequestStatus).parse(req.body?.status);
  if (([RequestStatus.DELIVERED, RequestStatus.CANCELLED, RequestStatus.RESTOCK_WAIT] as RequestStatus[]).includes(toStatus)) return res.status(400).json({ error: "Usa la acción específica para entregar, cancelar o esperar reposición" });
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.partRequest.findUnique({ where: { id: req.params.id as string } });
    if (!current) throw Object.assign(new Error("Solicitud no encontrada"), { status: 404 });
    const allowed: Record<string, RequestStatus[]> = {
      [RequestStatus.PENDING]: [RequestStatus.PREPARING],
      [RequestStatus.PREPARING]: [RequestStatus.TO_BAY, RequestStatus.READY_FOR_PICKUP],
      [RequestStatus.TO_BAY]: [], [RequestStatus.READY_FOR_PICKUP]: [],
    };
    if (!allowed[current.status]?.includes(toStatus)) throw Object.assign(new Error("El cambio de estado no está permitido"), { status: 409 });
    const updated = await tx.partRequest.update({ where: { id: current.id }, data: { status: toStatus, assignedToId: req.user!.id } });
    await tx.requestStatusHistory.create({ data: { requestId: current.id, fromStatus: current.status, toStatus, userId: req.user!.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "REQUEST_STATUS_CHANGED", entity: "PartRequest", entityId: current.id, detail: { from: current.status, to: toStatus }, ip: req.ip });
    return updated;
  }, { isolationLevel: "Serializable" });
  res.json({ data: result });
});
router.post("/:id/validate-qr", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const scanned = z.string().trim().min(1).max(160).parse(req.body?.code).replace(/^MP:PART:/, "");
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.partRequest.findUnique({ where: { id: req.params.id as string }, include: { part: true, repairOrder: { include: { model: true } } } });
    if (!request) throw Object.assign(new Error("Solicitud no encontrada"), { status: 404 });
    if (request.status !== RequestStatus.TO_BAY && request.status !== RequestStatus.READY_FOR_PICKUP) throw Object.assign(new Error("La solicitud no está lista para entrega"), { status: 409 });
    if (scanned !== request.part.sku) throw Object.assign(new Error("El QR no coincide con el repuesto solicitado. No se realizó ningún descuento."), { status: 409 });
    const compatible = await tx.partCompatibility.findFirst({ where: { partId: request.partId, modelId: request.repairOrder.modelId, yearFrom: { lte: request.repairOrder.model.yearTo }, yearTo: { gte: request.repairOrder.model.yearFrom } } });
    if (!compatible) throw Object.assign(new Error("El repuesto escaneado no es compatible con la moto de la orden"), { status: 409 });
    const rows = await tx.$queryRaw<{ id: string; onHand: number; reserved: number }[]>`SELECT "id", "onHand", "reserved" FROM "Stock" WHERE "partId" = ${request.partId} ORDER BY "onHand" DESC FOR UPDATE`;
    const available = rows.reduce((sum, row) => sum + row.onHand, 0);
    const reserved = rows.reduce((sum, row) => sum + row.reserved, 0);
    if (available < request.quantity || reserved < request.quantity) throw Object.assign(new Error("El inventario reservado ya no está disponible; solicita revisión a bodega"), { status: 409 });
    let remaining = request.quantity;
    for (const row of rows) {
      const take = Math.min(remaining, row.onHand, row.reserved);
      if (take > 0) await tx.stock.update({ where: { id: row.id }, data: { onHand: { decrement: take }, reserved: { decrement: take } } });
      remaining -= take;
      if (remaining === 0) break;
    }
    const code = await nextCode(tx, "MOV");
    const movement = await tx.inventoryMovement.create({ data: { code, partId: request.partId, type: MovementType.EXIT, quantity: request.quantity, reason: `Entrega QR ${request.code}`, userId: req.user!.id, requestId: request.id } });
    const updated = await tx.partRequest.update({ where: { id: request.id }, data: { status: RequestStatus.DELIVERED, qrValidatedAt: new Date(), assignedToId: req.user!.id } });
    await tx.requestStatusHistory.create({ data: { requestId: request.id, fromStatus: request.status, toStatus: RequestStatus.DELIVERED, userId: req.user!.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "REQUEST_QR_DELIVERED", entity: "PartRequest", entityId: request.id, detail: { requestCode: request.code, scannedSku: scanned, movementCode: code, quantity: request.quantity }, ip: req.ip });
    return { request: updated, movement };
  }, { isolationLevel: "Serializable" });
  res.json({ data: result });
});
router.post("/:id/cancel", async (req, res) => {
  if (!new Set<Role>([Role.MECHANIC, Role.ADMIN]).has(req.user!.role)) return res.status(403).json({ error: "No tienes permiso para cancelar solicitudes" });
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.partRequest.findUnique({ where: { id: req.params.id as string } });
    if (!current) throw Object.assign(new Error("Solicitud no encontrada"), { status: 404 });
    if (req.user!.role === Role.MECHANIC && current.requestedById !== req.user!.id) throw Object.assign(new Error("Solo puedes cancelar tus propias solicitudes"), { status: 403 });
    if (([RequestStatus.DELIVERED, RequestStatus.CANCELLED] as RequestStatus[]).includes(current.status)) throw Object.assign(new Error("Esta solicitud ya no se puede cancelar"), { status: 409 });
    if (heldStatuses.includes(current.status)) await releaseReservation(tx, current.partId, current.quantity);
    const updated = await tx.partRequest.update({ where: { id: current.id }, data: { status: RequestStatus.CANCELLED } });
    await tx.requestStatusHistory.create({ data: { requestId: current.id, fromStatus: current.status, toStatus: RequestStatus.CANCELLED, userId: req.user!.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "REQUEST_CANCELLED", entity: "PartRequest", entityId: current.id, ip: req.ip });
    return updated;
  }, { isolationLevel: "Serializable" });
  res.json({ data: result });
});
router.post("/:id/recheck-stock", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.partRequest.findUnique({ where: { id: req.params.id as string } });
    if (!current || current.status !== RequestStatus.RESTOCK_WAIT) throw Object.assign(new Error("La solicitud no está esperando reposición"), { status: 409 });
    if (!await reserveStock(tx, current.partId, current.quantity)) throw Object.assign(new Error("Todavía no hay existencias suficientes para esta solicitud"), { status: 409 });
    const request = await tx.partRequest.update({ where: { id: current.id }, data: { status: RequestStatus.PENDING, assignedToId: req.user!.id } });
    await tx.requestStatusHistory.create({ data: { requestId: current.id, fromStatus: RequestStatus.RESTOCK_WAIT, toStatus: RequestStatus.PENDING, userId: req.user!.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "REQUEST_RESTOCK_RESERVED", entity: "PartRequest", entityId: current.id, detail: { code: current.code }, ip: req.ip });
    return request;
  }, { isolationLevel: "Serializable" });
  res.json({ data: updated });
});
router.post("/:id/generate-purchase-order", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const input = z.object({ supplierId: z.string().min(1).optional() }).parse(req.body ?? {});
  const current = await prisma.partRequest.findUnique({ where: { id: req.params.id as string }, include: { part: true } });
  if (!current || current.status !== RequestStatus.RESTOCK_WAIT) return res.status(409).json({ error: "Solo se generan pedidos para solicitudes en espera de reposición" });
  let supplierId = input.supplierId;
  if (!supplierId) { const supplier = await prisma.supplier.upsert({ where: { id: "demo-supplier" }, update: {}, create: { id: "demo-supplier", name: "Proveedor pendiente de asignación" } }); supplierId = supplier.id; }
  const order = await prisma.purchaseOrder.create({ data: { supplierId, createdBy: req.user!.id, items: { create: { partId: current.partId, quantity: current.quantity } } } });
  await prisma.auditLog.create({ data: { userId: req.user!.id, action: "PURCHASE_ORDER_DRAFT_CREATED", entity: "PurchaseOrder", entityId: order.id, detail: { requestCode: current.code }, ip: req.ip } });
  res.status(201).json({ data: order });
});
export default router;




