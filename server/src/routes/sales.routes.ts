import { Router } from "express";
import { z } from "zod";
import { MovementType, PaymentMethod, Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit, nextCode } from "../services/common.service.js";

const router = Router();
router.use(authenticate);
const saleSchema = z.object({ paymentMethod: z.nativeEnum(PaymentMethod), items: z.array(z.object({ partId: z.string().min(1), quantity: z.number().int().min(1).max(100) })).min(1).max(100) });
router.post("/", allowRoles(Role.SALES, Role.ADMIN), async (req, res) => {
  const input = saleSchema.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    let total = 0; const saleItems: { partId: string; quantity: number; unitPrice: number }[] = [];
    for (const line of input.items) {
      const part = await tx.part.findUnique({ where: { id: line.partId } }); if (!part || !part.isActive) throw Object.assign(new Error("Uno de los repuestos no está disponible"), { status: 404 });
      const rows = await tx.$queryRaw<{ id: string; onHand: number; reserved: number }[]>`SELECT "id", "onHand", "reserved" FROM "Stock" WHERE "partId" = ${part.id} ORDER BY ("onHand" - "reserved") DESC FOR UPDATE`;
      if (rows.reduce((n, row) => n + row.onHand - row.reserved, 0) < line.quantity) throw Object.assign(new Error(`Stock disponible insuficiente para ${part.sku}`), { status: 409 });
      let remaining = line.quantity;
      for (const row of rows) { const take = Math.min(remaining, row.onHand - row.reserved); if (take > 0) await tx.stock.update({ where: { id: row.id }, data: { onHand: { decrement: take } } }); remaining -= take; if (!remaining) break; }
      const unitPrice = Number(part.priceRetail); total += unitPrice * line.quantity; saleItems.push({ partId: part.id, quantity: line.quantity, unitPrice });
    }
    const sale = await tx.sale.create({ data: { code: await nextCode(tx, "VEN"), sellerId: req.user!.id, total, paymentMethod: input.paymentMethod, items: { create: saleItems } } });
    for (const line of saleItems) await tx.inventoryMovement.create({ data: { code: await nextCode(tx, "MOV"), partId: line.partId, type: MovementType.EXIT, quantity: line.quantity, reason: `Venta ${sale.code}`, userId: req.user!.id, saleId: sale.id } });
    await appendAudit(tx, { userId: req.user!.id, action: "SALE_CREATED", entity: "Sale", entityId: sale.id, detail: { code: sale.code, total, items: saleItems }, ip: req.ip });
    return sale;
  }, { isolationLevel: "Serializable" });
  res.status(201).json({ data: result });
});
router.get("/", allowRoles(Role.SALES, Role.MANAGER, Role.ADMIN), async (req, res) => {
  const from = z.coerce.date().optional().parse(req.query.from); const to = z.coerce.date().optional().parse(req.query.to);
  const data = await prisma.sale.findMany({ where: { ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, include: { seller: { select: { name: true } }, items: { include: { part: { select: { sku: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 500 });
  res.json({ data });
});
export default router;
