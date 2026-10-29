import { Router } from "express";
import { z } from "zod";
import { Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { locationLabel } from "../services/common.service.js";
const router = Router();
router.get("/search", authenticate, async (req, res) => {
  const q = z.string().trim().min(1).max(120).parse(req.query.q);
  const role = req.user!.role;
  const [parts, models, orders] = await Promise.all([
    prisma.part.findMany({ where: { isActive: true, OR: [{ sku: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { oemCode: { contains: q, mode: "insensitive" } }, { brandName: { contains: q, mode: "insensitive" } }, { ean13: { contains: q, mode: "insensitive" } }] }, include: { stocks: { include: { location: true } }, category: true }, take: 8, orderBy: { name: "asc" } }),
    prisma.motorcycleModel.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { brand: { name: { contains: q, mode: "insensitive" } } }] }, include: { brand: true }, take: 8, orderBy: [{ brand: { name: "asc" } }, { name: "asc" }] }),
    new Set<Role>([Role.ADMIN, Role.MANAGER, Role.MECHANIC, Role.WAREHOUSE]).has(role) ? prisma.repairOrder.findMany({ where: { ...(role === Role.MECHANIC ? { mechanicId: req.user!.id } : {}), OR: [{ plate: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] }, include: { model: { include: { brand: true } }, bay: true }, take: 8, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
  ]);
  const canSeeSensitive = new Set<Role>([Role.ADMIN, Role.MANAGER, Role.SALES]).has(role);
  res.json({ data: { parts: parts.map((p) => ({ id: p.id, sku: p.sku, name: p.name, category: p.category.name, priceWorkshop: Number(p.priceWorkshop), ...(canSeeSensitive ? { priceRetail: Number(p.priceRetail), cost: Number(p.cost) } : {}), available: p.stocks.reduce((n, s) => n + s.onHand - s.reserved, 0), locations: p.stocks.map((s) => locationLabel(s.location)) })), models: models.map((m) => ({ id: m.id, name: `${m.brand.name} ${m.name}`, yearFrom: m.yearFrom, yearTo: m.yearTo })), orders: orders.map((o) => ({ id: o.id, code: o.code, plate: o.plate, model: `${o.model.brand.name} ${o.model.name}`, bay: o.bay.code })) } });
});
export default router;
