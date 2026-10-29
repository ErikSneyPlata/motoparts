import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { appendAudit } from "../services/common.service.js";

const router = Router();
router.use(authenticate);
router.get("/", allowRoles(Role.ADMIN, Role.MANAGER), async (req, res) => {
  const userId = z.string().optional().parse(req.query.userId); const entity = z.string().max(100).optional().parse(req.query.entity); const from = z.coerce.date().optional().parse(req.query.from); const to = z.coerce.date().optional().parse(req.query.to);
  const data = await prisma.auditLog.findMany({ where: { ...(userId ? { userId } : {}), ...(entity ? { entity } : {}), ...(from || to ? { at: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, include: { user: { select: { name: true, email: true, role: true } } }, orderBy: { at: "desc" }, take: 500 });
  res.json({ data });
});
export default router;
