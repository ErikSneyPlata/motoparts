import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Correo o contraseña inválidos" });
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && user.isActive && await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid || !user) {
    await prisma.auditLog.create({ data: { action: "LOGIN_FAILED", entity: "User", detail: { email }, ip: req.ip } });
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: "30m", algorithm: "HS256", issuer: "motoparts-api", audience: "motoparts-client" });
  await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN_SUCCESS", entity: "User", entityId: user.id, ip: req.ip } });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, specialty: user.specialty, shift: user.shift } });
});

router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true, specialty: true, shift: true } });
  if (!user) return res.status(401).json({ error: "Sesión inválida" });
  return res.json({ user });
});

export default router;
