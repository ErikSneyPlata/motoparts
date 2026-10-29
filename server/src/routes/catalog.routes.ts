import { Router } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import { Role, MovementType, Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit, availableForPart, locationLabel, nextCode } from "../services/common.service.js";

const router = Router();
router.use(authenticate);
const priceSensitive = new Set<Role>([Role.ADMIN, Role.SALES, Role.MANAGER]);
function partDto(part: any, role: Role) {
  const dto: Record<string, unknown> = {
    id: part.id, sku: part.sku, name: part.name, description: part.description, category: part.category?.name,
    brandName: part.brandName, oemCode: part.oemCode, ean13: part.ean13, photoUrl: part.photoUrl,
    priceWorkshop: Number(part.priceWorkshop), isActive: part.isActive,
    stock: part.stocks?.reduce((sum: number, row: any) => sum + row.onHand, 0) ?? 0,
    reserved: part.stocks?.reduce((sum: number, row: any) => sum + row.reserved, 0) ?? 0,
    available: part.stocks?.reduce((sum: number, row: any) => sum + row.onHand - row.reserved, 0) ?? 0,
    locations: part.stocks?.map((row: any) => locationLabel(row.location)) ?? [],
  };
  if (priceSensitive.has(role)) { dto.priceRetail = Number(part.priceRetail); dto.cost = Number(part.cost); dto.margin = Number(part.priceRetail) - Number(part.cost); }
  return dto;
}
const partInclude = { category: true, stocks: { include: { location: true } }, compatibilities: { include: { model: { include: { brand: true } } } } } as const;
const createPartSchema = z.object({ sku: z.string().trim().min(2).max(40).toUpperCase(), name: z.string().trim().min(2).max(180), description: z.string().trim().max(1000).optional(), categoryId: z.string().min(1), brandName: z.string().trim().max(80).optional(), oemCode: z.string().trim().max(80).optional(), ean13: z.string().trim().max(20).optional(), photoUrl: z.string().url().optional().or(z.literal("")), priceWorkshop: z.number().nonnegative(), priceRetail: z.number().nonnegative().optional(), cost: z.number().nonnegative().optional(), minStock: z.number().int().min(0).max(10000).default(5), initialStock: z.number().int().min(0).max(100000).default(0), locationId: z.string().optional(), compatibility: z.array(z.object({ modelId: z.string().min(1), yearFrom: z.number().int(), yearTo: z.number().int() })).default([]) });

router.get("/brands", async (_req, res) => res.json(await prisma.brand.findMany({ orderBy: { name: "asc" } })));
router.get("/categories", async (_req, res) => res.json({ data: await prisma.partCategory.findMany({ orderBy: { name: "asc" } }) }));
router.get("/models", async (req, res) => {
  const q = z.string().trim().max(100).optional().parse(req.query.q); const brand = z.string().trim().max(80).optional().parse(req.query.brand); const year = z.coerce.number().int().min(1950).max(2100).optional().parse(req.query.year);
  const models = await prisma.motorcycleModel.findMany({ where: { ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { brand: { name: { contains: q, mode: "insensitive" as const } } }] } : {}), ...(brand ? { brand: { name: { equals: brand, mode: "insensitive" as const } } } : {}), ...(year ? { yearFrom: { lte: year }, yearTo: { gte: year } } : {}) }, include: { brand: true }, orderBy: [{ brand: { name: "asc" } }, { name: "asc" }] });
  res.json({ data: models });
});
router.get("/models/:id", async (req, res) => {
  const model = await prisma.motorcycleModel.findUnique({ where: { id: req.params.id }, include: { brand: true, manuals: { where: { isCurrent: true }, orderBy: { validUntil: "desc" }, take: 1 }, systems: { include: { hotspots: { include: { part: { include: partInclude } }, orderBy: { number: "asc" } }, torques: true } } } });
  if (!model) return res.status(404).json({ error: "Motocicleta no encontrada" });
  const safeSystems = model.systems.map((system) => ({ ...system, hotspots: system.hotspots.map((spot) => ({ ...spot, part: spot.part ? partDto(spot.part, req.user!.role) : null })) }));
  const manual = model.manuals[0];
  return res.json({ ...model, systems: safeSystems, manual: manual ? { ...manual, expired: !!manual.validUntil && manual.validUntil < new Date() } : null });
});
router.post("/models/:id/manuals", allowRoles(Role.ADMIN), async (req, res) => {
  const input = z.object({ reference: z.string().trim().min(2).max(80), version: z.string().trim().min(1).max(40), validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((value) => new Date(`${value}T23:59:59.999-05:00`)).nullable().optional(), fileUrl: z.string().url().refine((value) => value.startsWith("https://"), "El enlace del manual debe usar HTTPS").nullable().optional() }).parse(req.body);
  const model = await prisma.motorcycleModel.findUnique({ where: { id: req.params.id as string }, select: { id: true } });
  if (!model) return res.status(404).json({ error: "Motocicleta no encontrada" });
  const manual = await prisma.$transaction(async (tx) => {
    await tx.manual.updateMany({ where: { modelId: model.id, isCurrent: true }, data: { isCurrent: false } });
    const created = await tx.manual.create({ data: { modelId: model.id, reference: input.reference, version: input.version, validUntil: input.validUntil, fileUrl: input.fileUrl, isCurrent: true } });
    await appendAudit(tx, { userId: req.user!.id, action: "MANUAL_CREATED_OR_UPDATED", entity: "Manual", entityId: created.id, detail: { modelId: model.id, reference: created.reference, version: created.version }, ip: req.ip });
    return created;
  });
  return res.status(201).json({ data: manual });
});
router.get("/models/:id/parts", async (req, res) => {
  const year = z.coerce.number().int().optional().parse(req.query.year);
  const parts = await prisma.part.findMany({ where: { isActive: true, compatibilities: { some: { modelId: req.params.id, ...(year ? { yearFrom: { lte: year }, yearTo: { gte: year } } : {}) } } }, include: partInclude, orderBy: { name: "asc" } });
  return res.json({ data: parts.map((part) => partDto(part, req.user!.role)) });
});
router.get("/parts/by-code/:code", async (req, res) => {
  const code = decodeURIComponent(req.params.code).replace(/^MP:PART:/, "");
  const part = await prisma.part.findFirst({ where: { OR: [{ sku: code }, { ean13: code }, { qrPayload: `MP:PART:${code}` }], isActive: true }, include: partInclude });
  if (!part) return res.status(404).json({ error: "No encontramos un repuesto con ese código" });
  return res.json({ data: partDto(part, req.user!.role) });
});
router.get("/parts", async (req, res) => {
  const query = z.string().trim().max(120).optional().parse(req.query.q); const category = z.string().trim().max(80).optional().parse(req.query.category); const modelId = z.string().optional().parse(req.query.modelId); const year = z.coerce.number().int().optional().parse(req.query.year); const page = z.coerce.number().int().min(1).default(1).parse(req.query.page); const take = z.coerce.number().int().min(1).max(48).default(24).parse(req.query.pageSize);
  const where: Prisma.PartWhereInput = { isActive: true, ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { sku: { contains: query, mode: "insensitive" } }, { oemCode: { contains: query, mode: "insensitive" } }, { ean13: { contains: query, mode: "insensitive" } }, { brandName: { contains: query, mode: "insensitive" } }] } : {}), ...(category ? { category: { name: category } } : {}), ...(modelId ? { compatibilities: { some: { modelId, ...(year ? { yearFrom: { lte: year }, yearTo: { gte: year } } : {}) } } } : {}) };
  const [total, parts] = await prisma.$transaction([prisma.part.count({ where }), prisma.part.findMany({ where, include: partInclude, orderBy: { name: "asc" }, skip: (page - 1) * take, take })]);
  return res.json({ data: parts.map((part) => partDto(part, req.user!.role)), page, pageSize: take, total, pages: Math.ceil(total / take) });
});
router.get("/parts/:id", async (req, res) => {
  const part = await prisma.part.findUnique({ where: { id: req.params.id as string }, include: partInclude }); if (!part) return res.status(404).json({ error: "Repuesto no encontrado" });
  return res.json({ data: partDto(part, req.user!.role), compatibility: part.compatibilities.map((c) => ({ modelId: c.modelId, model: `${c.model.brand.name} ${c.model.name}`, yearFrom: c.yearFrom, yearTo: c.yearTo })) });
});
router.get("/parts/:id/compatibility", async (req, res) => { const compatibility = await prisma.partCompatibility.findMany({ where: { partId: req.params.id as string }, include: { model: { include: { brand: true } } } }); res.json({ data: compatibility.map((c) => ({ modelId: c.modelId, model: `${c.model.brand.name} ${c.model.name}`, yearFrom: c.yearFrom, yearTo: c.yearTo })) }); });
router.get("/parts/:id/qr", allowRoles(Role.ADMIN, Role.MECHANIC, Role.WAREHOUSE, Role.SALES), async (req, res) => { const part = await prisma.part.findUnique({ where: { id: req.params.id as string }, select: { sku: true, qrPayload: true } }); if (!part) return res.status(404).json({ error: "Repuesto no encontrado" }); res.json({ sku: part.sku, payload: part.qrPayload, dataUrl: await QRCode.toDataURL(part.qrPayload, { margin: 1, width: 240 }) }); });
router.post("/parts", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const input = createPartSchema.parse(req.body); const part = await prisma.$transaction(async (tx) => {
    const created = await tx.part.create({ data: { sku: input.sku, name: input.name, description: input.description, categoryId: input.categoryId, brandName: input.brandName, oemCode: input.oemCode, ean13: input.ean13, photoUrl: input.photoUrl || null, priceWorkshop: input.priceWorkshop, priceRetail: req.user!.role === Role.ADMIN ? input.priceRetail ?? 0 : 0, cost: req.user!.role === Role.ADMIN ? input.cost ?? 0 : 0, minStock: input.minStock, qrPayload: `MP:PART:${input.sku}`, compatibilities: { create: input.compatibility } } });
    if (input.initialStock > 0) { if (!input.locationId) throw Object.assign(new Error("Selecciona una ubicación para el stock inicial"), { status: 400 }); await tx.stock.create({ data: { partId: created.id, locationId: input.locationId, onHand: input.initialStock } }); await tx.inventoryMovement.create({ data: { code: await nextCode(tx, "MOV"), partId: created.id, type: MovementType.ENTRY, quantity: input.initialStock, reason: "Stock inicial de creación", userId: req.user!.id } }); }
    await appendAudit(tx, { userId: req.user!.id, action: "PART_CREATED", entity: "Part", entityId: created.id, detail: { sku: created.sku, initialStock: input.initialStock }, ip: req.ip });
    return tx.part.findUniqueOrThrow({ where: { id: created.id }, include: partInclude });
  }, { isolationLevel: "Serializable" });
  return res.status(201).json({ data: partDto(part, req.user!.role) });
});
router.put("/parts/:id", allowRoles(Role.WAREHOUSE, Role.ADMIN), async (req, res) => {
  const raw = z.object({ sku: z.string().trim().min(2).max(40).toUpperCase().optional(), name: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(1000).nullable().optional(), categoryId: z.string().min(1).optional(), brandName: z.string().trim().max(80).nullable().optional(), oemCode: z.string().trim().max(80).nullable().optional(), ean13: z.string().trim().max(20).nullable().optional(), photoUrl: z.string().url().nullable().optional(), priceWorkshop: z.number().nonnegative().optional(), priceRetail: z.number().nonnegative().optional(), cost: z.number().nonnegative().optional(), minStock: z.number().int().min(0).max(10000).optional(), compatibility: z.array(z.object({ modelId: z.string().min(1), yearFrom: z.number().int(), yearTo: z.number().int() })).optional() }).parse(req.body); const { compatibility, ...fields } = raw; const input = fields;
  const part = await prisma.$transaction(async (tx) => {
    const updated = await tx.part.update({ where: { id: req.params.id as string }, data: { ...input, priceRetail: req.user!.role === Role.ADMIN ? input.priceRetail : undefined, cost: req.user!.role === Role.ADMIN ? input.cost : undefined } });
    if (compatibility) { await tx.partCompatibility.deleteMany({ where: { partId: updated.id } }); await tx.partCompatibility.createMany({ data: compatibility.map((c) => ({ partId: updated.id, ...c })) }); }
    await appendAudit(tx, { userId: req.user!.id, action: "PART_UPDATED", entity: "Part", entityId: updated.id, detail: { sku: updated.sku }, ip: req.ip });
    return tx.part.findUniqueOrThrow({ where: { id: updated.id }, include: partInclude });
  }, { isolationLevel: "Serializable" });
  res.json({ data: partDto(part, req.user!.role) });
});
router.get("/parts/:id/availability", async (req, res) => res.json({ available: await availableForPart(req.params.id) }));
export default router;


