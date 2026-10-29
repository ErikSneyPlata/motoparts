import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit } from "../services/common.service.js";

const router = Router();
router.use(authenticate, allowRoles(Role.ADMIN));
const createSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254).toLowerCase(), password: z.string().min(12).max(128), role: z.nativeEnum(Role), specialty: z.string().trim().max(180).optional(), shift: z.string().trim().max(80).optional() });
router.get("/", async (_req, res) => { const data = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, specialty: true, isActive: true, shift: true, createdAt: true }, orderBy: { name: "asc" } }); res.json({ data }); });
router.post("/", async (req, res) => {
  const input = createSchema.parse(req.body); const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.$transaction(async (tx) => { const created = await tx.user.create({ data: { name: input.name, email: input.email, passwordHash, role: input.role, specialty: input.specialty, shift: input.shift } }); await appendAudit(tx, { userId: req.user!.id, action: "USER_CREATED", entity: "User", entityId: created.id, detail: { email: created.email, role: created.role }, ip: req.ip }); return created; });
  res.status(201).json({ data: { id: user.id, name: user.name, email: user.email, role: user.role, specialty: user.specialty, isActive: user.isActive, shift: user.shift } });
});
router.patch("/:id", async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(120).optional(), role: z.nativeEnum(Role).optional(), specialty: z.string().trim().max(180).nullable().optional(), shift: z.string().trim().max(80).nullable().optional(), isActive: z.boolean().optional() }).parse(req.body);
  const user = await prisma.$transaction(async (tx) => { const updated = await tx.user.update({ where: { id: req.params.id }, data: input, select: { id: true, name: true, email: true, role: true, specialty: true, isActive: true, shift: true } }); await appendAudit(tx, { userId: req.user!.id, action: "USER_UPDATED", entity: "User", entityId: updated.id, detail: input as never, ip: req.ip }); return updated; });
  res.json({ data: user });
});
export default router;

