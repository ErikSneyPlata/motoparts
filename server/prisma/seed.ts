import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, RequestPriority, RequestStatus, BayStatus, RepairStatus, MovementType, PaymentMethod } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });
const passwordHash = await bcrypt.hash("Demo2026*", 12);
const users = [
  ["Laura Mendoza", "laura.mendoza@motoparts.local", Role.ADMIN, null],
  ["Ricardo Herrera", "ricardo.herrera@motoparts.local", Role.MANAGER, null],
  ["Sofía Castaño", "sofia.castano@motoparts.local", Role.SALES, null],
  ["Mateo Silva", "mateo.silva@motoparts.local", Role.WAREHOUSE, "Bodeguero Principal"],
  ["David Moreno", "david.moreno@motoparts.local", Role.WAREHOUSE, null],
  ["Carlos Ruiz", "carlos.ruiz@motoparts.local", Role.MECHANIC, "Especialista en Inyección Electrónica Bosch & Keihin · 4.95"],
  ["Mario Vega", "mario.vega@motoparts.local", Role.MECHANIC, null],
  ["Andrés Pardo", "andres.pardo@motoparts.local", Role.MECHANIC, null],
  ["Javier Gómez", "javier.gomez@motoparts.local", Role.MECHANIC, null],
  ["Wilson Soler", "wilson.soler@motoparts.local", Role.MECHANIC, null],
  ["Julián Prada", "julian.prada@motoparts.local", Role.MECHANIC, null],
] as const;
const userByEmail = new Map<string, { id: string; name: string; role: Role }>();
for (const [name, email, role, specialty] of users) {
  const user = await db.user.upsert({ where: { email }, update: { name, role, specialty, passwordHash, isActive: true }, create: { name, email, role, specialty, passwordHash, shift: "Turno activo" } });
  userByEmail.set(email, user);
}
const getUser = (email: string) => userByEmail.get(email)!;

const modelSeed = [
  ["Yamaha", "FZ 2.0 FI", 2016, 2024, 149, 13, "Blue Core EFI"], ["Yamaha", "FZ16", 2011, 2015, 153, 14, "Inyección electrónica"], ["Yamaha", "Fazer 2.0", 2016, 2024, 149, 13, "Blue Core EFI"], ["Yamaha", "FZ25", 2017, 2024, 249, 20, "Inyección electrónica"], ["Yamaha", "MT-03", 2016, 2024, 321, 41, "Inyección electrónica"], ["Bajaj", "Pulsar NS 200", 2012, 2024, 199, 23, "Triple bujía"], ["Honda", "CB 125F", 2015, 2024, 124, 10, "PGM-FI"], ["AKT", "NKD 125", 2004, 2024, 124, 10, "Carburador"], ["Suzuki", "Gixxer 150 FI", 2016, 2024, 155, 13, "Inyección electrónica"], ["KTM", "Duke 200 NG", 2012, 2024, 199, 25, "Inyección electrónica"], ["Bajaj", "Pulsar 180 UG", 2010, 2024, 178, 17, "DTS-i"], ["Honda", "CB190R", 2015, 2024, 184, 16, "PGM-FI"], ["Honda", "XR 150L", 2014, 2024, 149, 12, "Carburador"], ["AKT", "AK 125 EVO", 2008, 2024, 124, 10, "Carburador"], ["Yamaha", "Fazer 250", 2011, 2017, 249, 20, "Inyección electrónica"],
] as const;
const modelByName = new Map<string, { id: string; brand: string; name: string }>();
for (const [brandName, name, yearFrom, yearTo, displacementCc, powerHp, technology] of modelSeed) {
  const brand = await db.brand.upsert({ where: { name: brandName }, update: {}, create: { name: brandName } });
  const model = await db.motorcycleModel.upsert({ where: { brandId_name: { brandId: brand.id, name } }, update: { yearFrom, yearTo, displacementCc, powerHp, technology }, create: { brandId: brand.id, name, yearFrom, yearTo, displacementCc, powerHp, technology } });
  modelByName.set(name, { id: model.id, brand: brandName, name });
}
const categories = ["Frenos & Discos", "Motor & Culata", "Transmisión & Cadena", "Suspensión", "Eléctrico & Encendido", "Filtros & Aceites"];
const categoryByName = new Map<string, string>();
for (const name of categories) { const c = await db.partCategory.upsert({ where: { name }, update: {}, create: { name } }); categoryByName.set(name, c.id); }
const partSeed = [
  { sku: "FRE-0142", name: "Pastillas de Freno Delanteras Sinterizadas Alto Rendimiento", category: "Frenos & Discos", brandName: "Nissin", oemCode: "2FB-F5805-00", workshop: 78500, retail: 85000, cost: 56000, qty: 4, warehouse: "A", shelf: 3, drawer: 12, compat: [["FZ 2.0 FI", 2016, 2024], ["FZ16", 2011, 2015], ["Fazer 2.0", 2016, 2024], ["FZ25", 2017, 2024]] },
  { sku: "KIT-9920", name: "Kit de Arrastre Reforzado 428H", category: "Transmisión & Cadena", workshop: 142000, retail: 158000, cost: 105000, qty: 12, warehouse: "B", shelf: 1, drawer: 5, compat: [["Pulsar NS 200", 2012, 2024], ["Pulsar 180 UG", 2010, 2024]] },
  { sku: "FIL-0021", name: "Filtro de Aceite Alto Flujo", category: "Filtros & Aceites", workshop: 22000, retail: 25000, cost: 14000, qty: 28, warehouse: "A", shelf: 1, drawer: 4, compat: [["CB 125F", 2015, 2024], ["CB190R", 2015, 2024], ["XR 150L", 2014, 2024]] },
  { sku: "DIS-0310", name: "Disco de Freno Delantero 282 mm", category: "Frenos & Discos", workshop: 165000, retail: 185000, cost: 122000, qty: 0, warehouse: "A", shelf: 2, drawer: 8, compat: [["FZ 2.0 FI", 2016, 2024], ["FZ25", 2017, 2024], ["Fazer 250", 2011, 2017]] },
  { sku: "GUA-3105", name: "Cable de Embrague Reforzado Original", category: "Transmisión & Cadena", workshop: 18500, retail: 22000, cost: 11500, qty: 15, warehouse: "C", shelf: 2, drawer: 7, compat: [["NKD 125", 2004, 2024], ["AK 125 EVO", 2008, 2024]] },
  { sku: "BUJ-8812", name: "Bujía NGK Iridium CPR8EA-9", category: "Eléctrico & Encendido", brandName: "NGK", workshop: 34000, retail: 39000, cost: 24000, qty: 3, warehouse: "A", shelf: 2, drawer: 18, compat: [["FZ 2.0 FI", 2016, 2024], ["Pulsar NS 200", 2012, 2024], ["Gixxer 150 FI", 2016, 2024]] },
  { sku: "MOT-7100-4T", name: "Aceite Sintético Motul 7100 10W40 4T", category: "Filtros & Aceites", brandName: "Motul", workshop: 59000, retail: 68000, cost: 42000, qty: 28, warehouse: "A", shelf: 2, drawer: 14, compat: [["FZ 2.0 FI", 2016, 2024], ["FZ16", 2011, 2015], ["MT-03", 2016, 2024]] },
  { sku: "RET-4301-WP", name: "Retenes Horquilla Delantera 43 mm", category: "Suspensión", workshop: 76500, retail: 88000, cost: 51000, qty: 6, warehouse: "C", shelf: 4, drawer: 4, compat: [["MT-03", 2016, 2024], ["Duke 200 NG", 2012, 2024]] },
  { sku: "LIQ-BOS-04", name: "Líquido de Frenos Bosch DOT 4 (500 ml)", category: "Frenos & Discos", brandName: "Bosch", workshop: 32000, retail: 37000, cost: 22000, qty: 8, warehouse: "A", shelf: 2, drawer: 20, compat: [["FZ 2.0 FI", 2016, 2024], ["FZ16", 2011, 2015], ["Pulsar NS 200", 2012, 2024]] },
];
const partBySku = new Map<string, { id: string; sku: string; name: string }>();
for (const p of partSeed) {
  const part = await db.part.upsert({ where: { sku: p.sku }, update: { name: p.name, priceWorkshop: p.workshop, priceRetail: p.retail, cost: p.cost, qrPayload: `MP:PART:${p.sku}`, isActive: true }, create: { sku: p.sku, name: p.name, categoryId: categoryByName.get(p.category)!, brandName: p.brandName, oemCode: p.oemCode, priceWorkshop: p.workshop, priceRetail: p.retail, cost: p.cost, qrPayload: `MP:PART:${p.sku}` } });
  partBySku.set(p.sku, part);
  const location = await db.warehouseLocation.upsert({ where: { warehouse_shelf_drawer: { warehouse: p.warehouse, shelf: p.shelf, drawer: p.drawer } }, update: {}, create: { warehouse: p.warehouse, shelf: p.shelf, drawer: p.drawer } });
  await db.stock.upsert({ where: { partId_locationId: { partId: part.id, locationId: location.id } }, update: { onHand: p.qty }, create: { partId: part.id, locationId: location.id, onHand: p.qty } });
  for (const [modelName, yearFrom, yearTo] of p.compat as unknown as [string, number, number][]) { const model = modelByName.get(modelName); if (model) await db.partCompatibility.upsert({ where: { partId_modelId_yearFrom: { partId: part.id, modelId: model.id, yearFrom } }, update: { yearTo }, create: { partId: part.id, modelId: model.id, yearFrom, yearTo } }); }
}

const fz = modelByName.get("FZ 2.0 FI")!;
const manual = await db.manual.findFirst({ where: { modelId: fz.id, reference: "YAM-FZ20-REV4" } });
if (!manual) await db.manual.create({ data: { modelId: fz.id, reference: "YAM-FZ20-REV4", version: "REV4", validUntil: new Date("2027-12-31T23:59:59-05:00"), isCurrent: true } });
const system = await db.systemGroup.upsert({ where: { id: "seed-fz20-brakes" }, update: { name: "Sistema de Frenos Delantero & Trasero" }, create: { id: "seed-fz20-brakes", modelId: fz.id, name: "Sistema de Frenos Delantero & Trasero" } });
const hotspotSeed = [[1, "Pastillas delanteras", "FRE-0142", 0.25, 0.34], [2, "Pinza / Caliper", "FRE-0142", 0.43, 0.48], [3, "Disco 282 mm", "DIS-0310", 0.63, 0.52], [4, "Émbolo & Retenes", "RET-4301-WP", 0.51, 0.69], [5, "Manguera líquido DOT-4", "LIQ-BOS-04", 0.76, 0.31]] as const;
for (const [number, label, sku, x, y] of hotspotSeed) await db.explodedHotspot.upsert({ where: { systemGroupId_number: { systemGroupId: system.id, number } }, update: { label, x, y, partId: partBySku.get(sku)!.id }, create: { systemGroupId: system.id, number, label, x, y, partId: partBySku.get(sku)!.id } });
const torques = [["Tornillos soporte caliper (M8)", "35 Nm"], ["Perno pasador de pastillas", "18 Nm"], ["Tornillo racor banjo (M10)", "26 Nm"], ["Líquido recomendado", "Yamalube Brake Fluid DOT 4"]] as const;
for (const [label, value] of torques) if (!(await db.torqueSpec.findFirst({ where: { systemGroupId: system.id, label } }))) await db.torqueSpec.create({ data: { systemGroupId: system.id, label, value } });

for (let i = 1; i <= 8; i++) { const code = `B${i}`; await db.serviceBay.upsert({ where: { code }, update: {}, create: { code, status: BayStatus.AVAILABLE } }); }
await db.stock.updateMany({ data: { reserved: 0 } });
const orderSeed = [
  { code: "OT-1084", plate: "WXY-45F", model: "FZ 2.0 FI", bay: "B2", mechanic: "carlos.ruiz@motoparts.local", desc: "Diagnóstico de freno delantero", sku: "FRE-0142", request: "SOL-402", status: RequestStatus.PENDING, priority: RequestPriority.URGENT },
  { code: "OT-1082", plate: "KML-88E", model: "Pulsar NS 200", bay: "B4", mechanic: "andres.pardo@motoparts.local", desc: "Mantenimiento de transmisión", sku: "KIT-9920", request: "SOL-403", status: RequestStatus.PENDING, priority: RequestPriority.NORMAL },
  { code: "OT-1086", plate: "QZP-34D", model: "NKD 125", bay: "B1", mechanic: "javier.gomez@motoparts.local", desc: "Revisión de embrague", sku: "GUA-3105", request: "SOL-405", status: RequestStatus.RESTOCK_WAIT, priority: RequestPriority.NORMAL },
  { code: "OT-1079", plate: "LMN-19C", model: "CB 125F", bay: "B3", mechanic: "mario.vega@motoparts.local", desc: "Servicio preventivo", sku: "FIL-0021", request: "SOL-400", status: RequestStatus.PREPARING, priority: RequestPriority.NORMAL },
  { code: "OT-1075", plate: "RTS-12G", model: "Gixxer 150 FI", bay: "B5", mechanic: "wilson.soler@motoparts.local", desc: "Afinación y encendido", sku: "BUJ-8812", request: "SOL-399", status: RequestStatus.TO_BAY, priority: RequestPriority.NORMAL },
  { code: "OT-1072", plate: "KLO-77D", model: "MT-03", bay: "B2", mechanic: "carlos.ruiz@motoparts.local", desc: "Mantenimiento general", sku: "MOT-7100-4T", request: "SOL-398", status: RequestStatus.DELIVERED, priority: RequestPriority.NORMAL },
  { code: "OT-1068", plate: "BGT-99A", model: "Duke 200 NG", bay: "B1", mechanic: "javier.gomez@motoparts.local", desc: "Servicio de suspensión", sku: "RET-4301-WP", request: "SOL-396", status: RequestStatus.DELIVERED, priority: RequestPriority.NORMAL },
  { code: "OT-1064", plate: "PQR-82C", model: "FZ16", bay: "B4", mechanic: "andres.pardo@motoparts.local", desc: "Servicio frenos", sku: "LIQ-BOS-04", request: "SOL-395", status: RequestStatus.DELIVERED, priority: RequestPriority.NORMAL },
] as const;
for (const o of orderSeed) {
  const model = modelByName.get(o.model)!; const mechanic = getUser(o.mechanic); const bay = await db.serviceBay.findUniqueOrThrow({ where: { code: o.bay } }); const part = partBySku.get(o.sku)!;
  if (o.status !== RequestStatus.DELIVERED) await db.serviceBay.update({ where: { id: bay.id }, data: { status: BayStatus.OCCUPIED, mechanicId: mechanic.id } });
  const isDelivered = o.status === RequestStatus.DELIVERED; const oldDays = o.request === "SOL-398" ? 2 : o.request === "SOL-396" ? 1 : o.request === "SOL-395" ? 7 : 0; const historicAt = new Date(Date.now() - oldDays * 86400000);
  const order = await db.repairOrder.upsert({ where: { code: o.code }, update: { status: isDelivered ? RepairStatus.COMPLETED : RepairStatus.IN_PROGRESS }, create: { code: o.code, plate: o.plate, modelId: model.id, bayId: bay.id, mechanicId: mechanic.id, description: o.desc, status: isDelivered ? RepairStatus.COMPLETED : RepairStatus.IN_PROGRESS, createdAt: historicAt } });
  const req = await db.partRequest.upsert({ where: { code: o.request }, update: { status: o.status, priority: o.priority }, create: { code: o.request, repairOrderId: order.id, partId: part.id, quantity: o.request === "SOL-398" ? 2 : 1, priority: o.priority, status: o.status, requestedById: mechanic.id, assignedToId: o.status === RequestStatus.DELIVERED ? getUser("mateo.silva@motoparts.local").id : undefined, qrValidatedAt: isDelivered ? historicAt : undefined, createdAt: historicAt } });
  const hist = await db.requestStatusHistory.findFirst({ where: { requestId: req.id, toStatus: req.status } });
  if (!hist) await db.requestStatusHistory.create({ data: { requestId: req.id, fromStatus: null, toStatus: req.status, userId: mechanic.id } });
    if (([RequestStatus.PENDING, RequestStatus.PREPARING, RequestStatus.TO_BAY] as RequestStatus[]).includes(o.status)) {
    const stock = await db.stock.findFirst({ where: { partId: part.id } }); if (stock) await db.stock.update({ where: { id: stock.id }, data: { reserved: { increment: req.quantity } } });
  }
}

const movementSamples = [
  ["MOV-8901", "FRE-0142", MovementType.ENTRY, 8, "Recepción de proveedor", 120], ["MOV-8902", "KIT-9920", MovementType.ENTRY, 10, "Compra de inventario", 105], ["MOV-8903", "FIL-0021", MovementType.ENTRY, 18, "Recepción de proveedor", 60], ["MOV-8904", "DIS-0310", MovementType.EXIT, 2, "Venta mostrador", 96], ["MOV-8905", "GUA-3105", MovementType.ENTRY, 12, "Compra de inventario", 43], ["MOV-8906", "BUJ-8812", MovementType.EXIT, 2, "Salida taller", 24], ["MOV-8907", "MOT-7100-4T", MovementType.EXIT, 3, "Venta mostrador", 12], ["MOV-8910", "MOT-7100-4T", MovementType.EXIT, 2, "Solicitud SOL-398", 2], ["MOV-8908", "RET-4301-WP", MovementType.EXIT, 1, "Solicitud SOL-396", 1], ["MOV-8909", "LIQ-BOS-04", MovementType.EXIT, 1, "Solicitud SOL-395", 7]
] as const;
for (const [code, sku, type, quantity, reason, daysAgo] of movementSamples) await db.inventoryMovement.upsert({ where: { code }, update: {}, create: { code, partId: partBySku.get(sku)!.id, type, quantity, reason, userId: getUser("mateo.silva@motoparts.local").id, createdAt: new Date(Date.now() - daysAgo * 86400000) } });

const salesSeed = [
  { code: "VEN-2001", daysAgo: 32, sku: "FIL-0021", quantity: 2, payment: PaymentMethod.CASH },
  { code: "VEN-2002", daysAgo: 18, sku: "MOT-7100-4T", quantity: 1, payment: PaymentMethod.CARD },
  { code: "VEN-2003", daysAgo: 4, sku: "BUJ-8812", quantity: 1, payment: PaymentMethod.TRANSFER },
] as const;
for (const saleData of salesSeed) {
  const part = partBySku.get(saleData.sku)!;
  const price = Number((await db.part.findUniqueOrThrow({ where: { id: part.id } })).priceRetail);
  const sale = await db.sale.upsert({ where: { code: saleData.code }, update: {}, create: { code: saleData.code, sellerId: getUser("sofia.castano@motoparts.local").id, total: price * saleData.quantity, paymentMethod: saleData.payment, createdAt: new Date(Date.now() - saleData.daysAgo * 86400000), items: { create: { partId: part.id, quantity: saleData.quantity, unitPrice: price } } } });
  const movementCode = saleData.code === "VEN-2001" ? "MOV-8911" : saleData.code === "VEN-2002" ? "MOV-8912" : "MOV-8913";
  await db.inventoryMovement.upsert({ where: { code: movementCode }, update: {}, create: { code: movementCode, partId: part.id, type: MovementType.EXIT, quantity: saleData.quantity, reason: `Venta ${sale.code}`, userId: getUser("sofia.castano@motoparts.local").id, saleId: sale.id, createdAt: new Date(Date.now() - saleData.daysAgo * 86400000) } });
}
for (const [requestCode, movementCode] of [["SOL-398", "MOV-8910"], ["SOL-396", "MOV-8908"], ["SOL-395", "MOV-8909"]] as const) {
  const request = await db.partRequest.findUnique({ where: { code: requestCode } });
  if (request) await db.inventoryMovement.updateMany({ where: { code: movementCode }, data: { requestId: request.id } });
}
const oldPart = partBySku.get("RET-4301-WP" )!;
for (let i = 0; i < 4; i++) {
  const code = `HIST-${i + 1}`;
  if (!(await db.auditLog.findFirst({ where: { entityId: code } }))) await db.auditLog.create({ data: { userId: getUser("laura.mendoza@motoparts.local").id, action: "SEED_HISTORY", entity: "DemoHistory", entityId: code, detail: { marker: "seeded-report-history", partId: oldPart.id }, at: new Date(Date.now() - (100 + i) * 86400000) } });
}

for (const [key, value] of [["SOL", 405], ["OT", 1086], ["MOV", 8913], ["VEN", 2003]] as const) await db.sequenceCounter.upsert({ where: { key }, update: {}, create: { key, value } });
console.info(`Seed listo: ${users.length} usuarios demo, ${modelSeed.length} motos, ${partSeed.length} repuestos y 8 órdenes/solicitudes.`);
await db.$disconnect();






