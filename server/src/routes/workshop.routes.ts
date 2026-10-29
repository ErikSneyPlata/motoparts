import { Router } from "express";
import { z } from "zod";
import { RepairStatus, Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit, nextCode } from "../services/common.service.js";

const router = Router();
router.use(authenticate, allowRoles(Role.ADMIN, Role.MECHANIC, Role.MANAGER));

router.get("/workshop/summary", async (req, res) => {
  const scoped = req.user!.role === Role.MECHANIC ? { requestedById: req.user!.id } : {};
  const local = new Date(Date.now() - 5 * 60 * 60 * 1000); local.setUTCHours(0, 0, 0, 0); const start = new Date(local.getTime() + 5 * 60 * 60 * 1000);
  const [activeBays, pendingRequests, deliveredToday, requests, delivered] = await Promise.all([
    prisma.serviceBay.count({ where: { status: { not: "AVAILABLE" } } }),
    prisma.partRequest.count({ where: { ...scoped, status: { in: ["PENDING", "PREPARING", "TO_BAY", "READY_FOR_PICKUP"] } } }),
    prisma.partRequest.count({ where: { ...scoped, status: "DELIVERED", qrValidatedAt: { gte: start } } }),
    prisma.partRequest.findMany({ where: { ...scoped, status: { in: ["PENDING", "PREPARING", "TO_BAY", "READY_FOR_PICKUP", "RESTOCK_WAIT"] } }, include: { part: { select: { sku: true, name: true } }, repairOrder: { include: { model: { include: { brand: true } }, bay: true } } }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }], take: 8 }),
    prisma.partRequest.findMany({ where: { ...scoped, status: "DELIVERED", qrValidatedAt: { not: null } }, select: { createdAt: true, qrValidatedAt: true }, take: 100 }),
  ]);
  const averageDispatchMinutes = delivered.length ? Math.round(delivered.reduce((sum, row) => sum + (row.qrValidatedAt!.getTime() - row.createdAt.getTime()) / 60000, 0) / delivered.length) : 0;
  res.json({ data: { activeBays, pendingRequests, deliveredToday, averageDispatchMinutes, requests } });
});
router.get("/bays", async (_req, res) => {
  const data = await prisma.serviceBay.findMany({ include: { mechanic: { select: { id: true, name: true } }, repairOrders: { where: { status: { notIn: [RepairStatus.COMPLETED, RepairStatus.CANCELLED] } }, take: 1, include: { model: { include: { brand: true } } } } }, orderBy: { code: "asc" } });
  res.json({ data });
});
router.get("/repair-orders", async (req, res) => {
  const mechanicOnly = req.user!.role === Role.MECHANIC;
  const data = await prisma.repairOrder.findMany({ where: mechanicOnly ? { mechanicId: req.user!.id } : {}, include: { model: { include: { brand: true } }, bay: true, mechanic: { select: { name: true } }, requests: { include: { part: { select: { sku: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 });
  res.json({ data });
});
router.post("/repair-orders", allowRoles(Role.ADMIN, Role.MECHANIC), async (req, res) => {
  const input = z.object({ plate: z.string().trim().min(4).max(12).transform((v) => v.toUpperCase()), modelId: z.string().min(1), bayId: z.string().min(1), description: z.string().trim().min(5).max(1000), mileageKm: z.number().int().positive().optional(), mechanicId: z.string().optional() }).parse(req.body);
  const created = await prisma.$transaction(async (tx) => {
    let mechanicId = req.user!.id;
    if (req.user!.role === Role.ADMIN) {
      if (!input.mechanicId) throw Object.assign(new Error("Selecciona el mecánico responsable"), { status: 400 });
      const mechanic = await tx.user.findFirst({ where: { id: input.mechanicId, role: Role.MECHANIC, isActive: true } });
      if (!mechanic) throw Object.assign(new Error("El mecánico seleccionado no está activo"), { status: 400 });
      mechanicId = mechanic.id;
    }
    const bay = await tx.serviceBay.findUnique({ where: { id: input.bayId } });
    if (!bay || bay.status !== "AVAILABLE") throw Object.assign(new Error("La bahía seleccionada no está disponible"), { status: 409 });
    const order = await tx.repairOrder.create({ data: { code: await nextCode(tx, "OT"), plate: input.plate, modelId: input.modelId, bayId: input.bayId, mechanicId, description: input.description, mileageKm: input.mileageKm, status: RepairStatus.OPEN } });
    await tx.serviceBay.update({ where: { id: input.bayId }, data: { status: "OCCUPIED", mechanicId } });
    await appendAudit(tx, { userId: req.user!.id, action: "REPAIR_ORDER_CREATED", entity: "RepairOrder", entityId: order.id, detail: { code: order.code, plate: order.plate, mechanicId }, ip: req.ip });
    return order;
  }, { isolationLevel: "Serializable" });
  res.status(201).json({ data: created });
});
export default router;
