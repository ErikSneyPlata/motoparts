import type { Request, Response } from "express";
import { app } from "./app.js";

const routeParam = "__mp_path";

export function handleVercelApiRequest(req: Request, res: Response) {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const routePath = requestUrl.searchParams.get(routeParam);

  if (routePath !== null) {
    const segments = routePath.split("/");
    if (!routePath || segments.some((segment) => !segment || segment === "." || segment === "..")) {
      return res.status(400).json({ error: "Ruta API inválida" });
    }

    requestUrl.pathname = `/api/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
    requestUrl.searchParams.delete(routeParam);
    req.url = `${requestUrl.pathname}${requestUrl.search}`;
  }

  return app(req, res);
}
