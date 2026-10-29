import { Router } from "express";
import { RequestStatus, RepairStatus, Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
function cotStartOfDay(now = new Date()) { const local = new Date(now.getTime() - 5 * 60 * 60 * 1000); local.setUTCHours(0, 0, 0, 0); return new Date(local.getTime() + 5 * 60 * 60 * 1000); }
router.get("/dashboard/summary", allowRoles(Role.ADMIN, Role.MANAGER), async (_req, res) => {
  const today = cotStartOfDay();
  const [activeBays, activeOrders, pendingRequests, deliveredToday, lowStockParts, requests, delivered] = await Promise.all([
    prisma.serviceBay.count({ where: { status: { not: "AVAILABLE" } } }),
    prisma.repairOrder.count({ where: { status: { in: [RepairStatus.OPEN, RepairStatus.DIAGNOSIS, RepairStatus.IN_PROGRESS, RepairStatus.WAITING_PARTS] } } }),
    prisma.partRequest.count({ where: { status: { in: [RequestStatus.PENDING, RequestStatus.PREPARING, RequestStatus.TO_BAY, RequestStatus.READY_FOR_PICKUP] } } }),
    prisma.partRequest.count({ where: { status: RequestStatus.DELIVERED, qrValidatedAt: { gte: today } } }),
    prisma.part.findMany({ where: { isActive: true }, include: { stocks: true } }),
    prisma.partRequest.findMany({ where: { status: { in: [RequestStatus.PENDING, RequestStatus.PREPARING, RequestStatus.TO_BAY, RequestStatus.READY_FOR_PICKUP, RequestStatus.RESTOCK_WAIT] } }, include: { part: true, repairOrder: { include: { model: { include: { brand: true } }, bay: true, mechanic: { select: { name: true } } } }, requestedBy: { select: { name: true } } }, orderBy: [{ priority: "desc" }, { createdAt: "asc" }], take: 8 }),
    prisma.partRequest.findMany({ where: { status: RequestStatus.DELIVERED, qrValidatedAt: { not: null } }, select: { createdAt: true, qrValidatedAt: true }, take: 300 }),
  ]);
  const avgMinutes = delivered.length ? Math.round(delivered.reduce((sum, item) => sum + (item.qrValidatedAt!.getTime() - item.createdAt.getTime()) / 60000, 0) / delivered.length) : 0;
  const lowStock = lowStockParts.filter((p) => p.stocks.reduce((n, s) => n + s.onHand, 0) <= 5).length;
  res.json({ data: { activeBays, activeOrders, pendingRequests, deliveredToday, averageDispatchMinutes: avgMinutes, lowStockParts: lowStock, requests: requests.map((r) => ({ id: r.id, code: r.code, status: r.status, priority: r.priority, quantity: r.quantity, sku: r.part.sku, partName: r.part.name, plate: r.repairOrder.plate, orderCode: r.repairOrder.code, model: `${r.repairOrder.model.brand.name} ${r.repairOrder.model.name}`, bay: r.repairOrder.bay.code, mechanic: r.repairOrder.mechanic.name, requestedBy: r.requestedBy.name, createdAt: r.createdAt })) } });
});
router.get("/reports/slow-movers", allowRoles(Role.ADMIN, Role.MANAGER), async (req, res) => {
  const days = Math.min(3650, Math.max(1, Number(req.query.days) || 90)); const since = new Date(Date.now() - days * 86400000);
  const parts = await prisma.part.findMany({ where: { isActive: true }, include: { category: true, movements: { orderBy: { createdAt: "desc" }, take: 1 }, stocks: true }, orderBy: { name: "asc" } });
  const data = parts.filter((p) => !p.movements[0] || p.movements[0].createdAt < since).map((p) => ({ id: p.id, sku: p.sku, name: p.name, category: p.category.name, lastMovementAt: p.movements[0]?.createdAt ?? null, daysWithoutMovement: p.movements[0] ? Math.floor((Date.now() - p.movements[0].createdAt.getTime()) / 86400000) : null, onHand: p.stocks.reduce((n, s) => n + s.onHand, 0), priceWorkshop: Number(p.priceWorkshop) }));
  res.json({ data, days, since });
});
router.get("/reports/top-requested", allowRoles(Role.ADMIN, Role.MANAGER), async (_req, res) => {
  const grouped = await prisma.partRequest.groupBy({ by: ["partId"], _sum: { quantity: true }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 });
  const parts = await prisma.part.findMany({ where: { id: { in: grouped.map((g) => g.partId) } }, select: { id: true, sku: true, name: true } });
  res.json({ data: grouped.map((g) => ({ ...parts.find((p) => p.id === g.partId), requests: g._count.id, quantity: g._sum.quantity ?? 0 })) });
});
router.get("/reports/turnover", allowRoles(Role.ADMIN, Role.MANAGER), async (_req, res) => {
  const parts = await prisma.part.findMany({ where: { isActive: true }, include: { movements: { where: { type: "EXIT", createdAt: { gte: new Date(Date.now() - 90 * 86400000) } } }, stocks: true }, orderBy: { name: "asc" } });
  res.json({ data: parts.map((p) => ({ sku: p.sku, name: p.name, exits90Days: p.movements.reduce((n, m) => n + m.quantity, 0), stock: p.stocks.reduce((n, s) => n + s.onHand, 0) })).sort((a, b) => b.exits90Days - a.exits90Days) });
});
router.get("/reports/sales-vs-workshop", allowRoles(Role.ADMIN, Role.MANAGER), async (_req, res) => {
  const [sales, workshopRequests] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true }, _count: { id: true } }),
    prisma.inventoryMovement.findMany({
      where: { type: "EXIT", requestId: { not: null } },
      include: { part: { select: { priceWorkshop: true } } },
    }),
  ]);
  res.json({ data: { counterSales: { total: Number(sales._sum.total ?? 0), transactions: sales._count.id }, workshop: { total: workshopRequests.reduce((sum, m) => sum + Number(m.part.priceWorkshop) * m.quantity, 0), movements: workshopRequests.length } } });
});
router.get("/reports/slow-movers.csv", allowRoles(Role.ADMIN, Role.MANAGER), async (_req, res) => {
  const parts = await prisma.part.findMany({ where: { isActive: true }, include: { movements: { orderBy: { createdAt: "desc" }, take: 1 }, stocks: true } });
  const since = Date.now() - 90 * 86400000; const filtered = parts.filter((p) => !p.movements[0] || p.movements[0].createdAt.getTime() < since);
  const rows = ["SKU,Repuesto,Último movimiento,Stock", ...filtered.map((p) => `"${p.sku}","${p.name.replaceAll('"', '""')}","${p.movements[0]?.createdAt.toISOString() ?? "Sin movimientos"}",${p.stocks.reduce((n, s) => n + s.onHand, 0)}`)];
  res.type("text/csv; charset=utf-8").attachment("repuestos-sin-movimiento-90-dias.csv").send("\uFEFF" + rows.join("\r\n"));
});
export default router;
