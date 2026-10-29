import { Router } from "express";
import { z } from "zod";
import { MovementType, Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit, availableForPart, nextCode } from "../services/common.service.js";

const router = Router();
router.use(authenticate, allowRoles(Role.ADMIN, Role.WAREHOUSE, Role.MANAGER));
const movementInput = z.object({ partId: z.string().min(1), quantity: z.number().int().positive().max(10000), reason: z.string().trim().min(3).max(300), locationId: z.string().min(1).optional() });
router.get("/locations", async (_req, res) => { const data = await prisma.warehouseLocation.findMany({ orderBy: [{ warehouse: "asc" }, { shelf: "asc" }, { drawer: "asc" }] }); res.json({ data }); });

router.get("/", async (req, res) => {
  const q = z.string().trim().max(120).optional().parse(req.query.q);
  const status = z.enum(["LOW", "OUT", "IN_STOCK"]).optional().parse(req.query.status);
  const parts = await prisma.part.findMany({ where: { isActive: true, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { oemCode: { contains: q, mode: "insensitive" } }, { brandName: { contains: q, mode: "insensitive" } }, { ean13: { contains: q, mode: "insensitive" } }] } : {}) }, include: { category: true, stocks: { include: { location: true } } }, orderBy: { name: "asc" } });
  const data = parts.map((part) => {
    const onHand = part.stocks.reduce((n, s) => n + s.onHand, 0); const reserved = part.stocks.reduce((n, s) => n + s.reserved, 0); const available = onHand - reserved;
    const canSeeSensitive = new Set<Role>([Role.ADMIN, Role.MANAGER, Role.SALES]).has(req.user!.role);
    return { id: part.id, sku: part.sku, name: part.name, category: part.category.name, priceWorkshop: Number(part.priceWorkshop), priceRetail: canSeeSensitive ? Number(part.priceRetail) : undefined, cost: canSeeSensitive ? Number(part.cost) : undefined, onHand, reserved, available, status: onHand === 0 ? "OUT" : onHand <= 5 ? "LOW" : "IN_STOCK", locations: part.stocks.map((s) => ({ id: s.locationId, warehouse: s.location.warehouse, shelf: s.location.shelf, drawer: s.location.drawer })) };
  }).filter((p) => !status || p.status === status);
  return res.json({ data });
});
router.get("/alerts", async (_req, res) => {
  const parts = await prisma.part.findMany({ where: { isActive: true }, include: { stocks: true }, orderBy: { name: "asc" } });
  const data = parts.map((p) => ({ id: p.id, sku: p.sku, name: p.name, onHand: p.stocks.reduce((n, s) => n + s.onHand, 0), available: p.stocks.reduce((n, s) => n + s.onHand - s.reserved, 0) })).filter((p) => p.onHand <= 5);
  res.json({ data });
});
router.get("/movements", async (req, res) => {
  const partId = z.string().optional().parse(req.query.partId); const from = z.coerce.date().optional().parse(req.query.from); const to = z.coerce.date().optional().parse(req.query.to);
  const data = await prisma.inventoryMovement.findMany({ where: { ...(partId ? { partId } : {}), ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, include: { part: { select: { sku: true, name: true } }, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 500 });
  res.json({ data });
});
router.post("/entries", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const input = movementInput.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const part = await tx.part.findUnique({ where: { id: input.partId } }); if (!part) throw Object.assign(new Error("Repuesto no encontrado"), { status: 404 });
    const stock = await tx.stock.findFirst({ where: { partId: part.id, ...(input.locationId ? { locationId: input.locationId } : {}) }, orderBy: { id: "asc" } });
    if (stock) await tx.stock.update({ where: { id: stock.id }, data: { onHand: { increment: input.quantity } } });
    else if (input.locationId) await tx.stock.create({ data: { partId: part.id, locationId: input.locationId, onHand: input.quantity } });
    else throw Object.assign(new Error("Selecciona una ubicación de bodega"), { status: 400 });
    const movement = await tx.inventoryMovement.create({ data: { code: await nextCode(tx, "MOV"), partId: part.id, type: MovementType.ENTRY, quantity: input.quantity, reason: input.reason, userId: req.user!.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "INVENTORY_ENTRY", entity: "InventoryMovement", entityId: movement.id, detail: { partId: part.id, quantity: input.quantity, reason: input.reason }, ip: req.ip });
    return movement;
  }, { isolationLevel: "Serializable" });
  res.status(201).json({ data: result });
});
router.post("/exits", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const input = movementInput.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; onHand: number; reserved: number }[]>`SELECT "id", "onHand", "reserved" FROM "Stock" WHERE "partId" = ${input.partId} ORDER BY ("onHand" - "reserved") DESC FOR UPDATE`;
    if (rows.reduce((n, r) => n + r.onHand - r.reserved, 0) < input.quantity) throw Object.assign(new Error("No hay stock disponible suficiente"), { status: 409 });
    let remaining = input.quantity;
    for (const row of rows) { const take = Math.min(remaining, row.onHand - row.reserved); if (take > 0) await tx.stock.update({ where: { id: row.id }, data: { onHand: { decrement: take } } }); remaining -= take; if (!remaining) break; }
    const movement = await tx.inventoryMovement.create({ data: { code: await nextCode(tx, "MOV"), partId: input.partId, type: MovementType.EXIT, quantity: input.quantity, reason: input.reason, userId: req.user!.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "INVENTORY_EXIT", entity: "InventoryMovement", entityId: movement.id, detail: { partId: input.partId, quantity: input.quantity, reason: input.reason }, ip: req.ip });
    return movement;
  }, { isolationLevel: "Serializable" });
  res.status(201).json({ data: result });
});
export default router;


