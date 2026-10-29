import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";
const router = Router();
router.get("/", authenticate, async (_req, res) => res.json({ data: await prisma.supplier.findMany({ orderBy: { name: "asc" } }) }));
export default router;
