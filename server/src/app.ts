import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { ZodError } from "zod";
import { Prisma } from "./generated/prisma/client.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import requestRoutes from "./routes/requests.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import userRoutes from "./routes/users.routes.js";
import workshopRoutes from "./routes/workshop.routes.js";
import supplierRoutes from "./routes/suppliers.routes.js";
import purchaseOrderRoutes from "./routes/purchase-orders.routes.js";
import { prisma } from "./db/prisma.js";
import searchRoutes from "./routes/search.routes.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api/requests/:id/validate-qr", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/api/health", async (_req, res) => { try { await prisma.$queryRaw`SELECT 1`; res.json({ status: "ok", database: "connected" }); } catch { res.status(503).json({ status: "unavailable", database: "disconnected" }); } });
app.use("/api/auth", authRoutes);
app.use("/api", searchRoutes);
app.use("/api", catalogRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/users", userRoutes);
app.use("/api", workshopRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use((_req, res) => res.status(404).json({ error: "Recurso no encontrado" }));
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ error: "Datos inválidos", details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })) });
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "El registro ya existe" });
    if (err.code === "P2025") return res.status(404).json({ error: "Registro no encontrado" });
  }
  const status = typeof err === "object" && err !== null && "status" in err && typeof err.status === "number" ? err.status : 500;
  if (status >= 500) console.error("Unhandled API error", err instanceof Error ? err.message : "unknown");
  return res.status(status).json({ error: status < 500 && err instanceof Error ? err.message : "Error interno del servidor" });
});




