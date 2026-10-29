import { useSessionStore } from "./store/session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useSessionStore.getState().token;
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 401 && token) useSessionStore.getState().clearSession(); throw new ApiError(result.error || "No se pudo completar la solicitud", response.status); }
  return result as T;
}
export const send = <T = any>(path: string, body: unknown, method: "POST" | "PUT" | "PATCH" = "POST") => api<T>(path, { method, body: JSON.stringify(body) });
export const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
export const formatDate = (value: string | Date) => new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(value));
