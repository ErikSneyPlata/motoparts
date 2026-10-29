import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import type { Role } from "../generated/prisma/client.js";

declare global { namespace Express { interface Request { user?: { id: string; role: Role; name: string } } } }

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Autenticación requerida" });
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ["HS256"], issuer: "motoparts-api", audience: "motoparts-client" });
    if (typeof payload === "string" || typeof payload.sub !== "string") return res.status(401).json({ error: "Sesión inválida" });
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, name: true, isActive: true } });
    if (!user?.isActive) return res.status(401).json({ error: "Sesión inválida" });
    req.user = { id: user.id, role: user.role, name: user.name };
    next();
  } catch { res.status(401).json({ error: "Sesión inválida o expirada" }); }
}

export function allowRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Autenticación requerida" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "No tienes permiso para esta acción" });
    next();
  };
}

