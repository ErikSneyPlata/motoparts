import { Router } from "express";
import { z } from "zod";
import { PurchaseOrderStatus, Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit } from "../services/common.service.js";
const router = Router();
router.use(authenticate, allowRoles(Role.ADMIN, Role.WAREHOUSE, Role.MANAGER));
router.get("/", async (_req, res) => { const data = await prisma.purchaseOrder.findMany({ include: { supplier: true, creator: { select: { name: true } }, items: { include: { part: { select: { sku: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 }); res.json({ data }); });
router.post("/", allowRoles(Role.ADMIN, Role.WAREHOUSE), async (req, res) => {
  const input = z.object({ supplierId: z.string().optional(), supplierName: z.string().trim().min(2).max(150).optional(), items: z.array(z.object({ partId: z.string().min(1), quantity: z.number().int().positive().max(10000) })).min(1).max(100) }).parse(req.body);
  const order = await prisma.$transaction(async (tx) => {
    let supplierId = input.supplierId;
    if (!supplierId) { const supplier = await tx.supplier.create({ data: { name: input.supplierName || "Proveedor pendiente de asignación" } }); supplierId = supplier.id; }
    const created = await tx.purchaseOrder.create({
      data: { supplierId, createdBy: req.user!.id, status: PurchaseOrderStatus.DRAFT, items: { create: input.items } },
      include: { supplier: true, items: { include: { part: { select: { sku: true, name: true } } } } },
    });
    await appendAudit(tx, { userId: req.user!.id, action: "PURCHASE_ORDER_CREATED", entity: "PurchaseOrder", entityId: created.id, detail: { supplierId, itemCount: input.items.length, status: "DRAFT" }, ip: req.ip });
    return created;
  }, { isolationLevel: "Serializable" });
  res.status(201).json({ data: order });
});
export default router;
