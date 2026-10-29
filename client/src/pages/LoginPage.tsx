import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { send } from "../api";
import { useSessionStore } from "../store/session";
import type { SessionUser } from "../types";
import { demoUsers } from "../components/Shell";

export function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const setSession = useSessionStore((s) => s.setSession); const location = useLocation(); const navigate = useNavigate();
  useEffect(() => { const demo = new URLSearchParams(location.search).get("demo"); if (demo && import.meta.env.DEV) { setEmail(demo); setPassword("Demo2026*"); void handleLogin(demo, "Demo2026*"); } }, [location.search]);
  async function handleLogin(overrideEmail = email, overridePassword = password) {
    setBusy(true); setError("");
    try { const result = await send<{token:string;user:SessionUser}>("/auth/login", { email: overrideEmail, password: overridePassword }); setSession(result.token, result.user); navigate(result.user.role === "MANAGER" ? "/dashboard" : result.user.role === "SALES" ? "/sales" : result.user.role === "WAREHOUSE" ? "/requests" : "/workshop", { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : "No fue posible iniciar sesión"); }
    finally { setBusy(false); }
  }
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b0b0d] p-5"><div className="pointer-events-none absolute -left-32 top-0 size-[500px] rounded-full bg-orange-600/10 blur-[140px]"/><div className="pointer-events-none absolute -right-32 bottom-0 size-[400px] rounded-full bg-red-800/10 blur-[140px]"/><section className="relative w-full max-w-[460px] rounded-2xl border border-[#2a2a30] bg-[#141417] p-6 shadow-2xl sm:p-9"><div className="flex size-12 items-center justify-center rounded-xl bg-orange-500 text-[#0b0b0d]"><Wrench size={24}/></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.28em] text-orange-500">MotoParts / Solutions S.A.S.</p><h1 className="mt-3 text-3xl font-black tracking-tight">Acceso al sistema</h1><p className="mt-2 text-sm leading-6 text-zinc-400">Sistema Integral de Gestión de Repuestos y Diagnóstico<br/>Sede Principal · Bucaramanga, Santander</p>
    <form className="mt-8 space-y-4" onSubmit={(e)=>{e.preventDefault();void handleLogin();}}><label className="block text-xs font-semibold text-zinc-300">Correo electrónico<input required type="email" autoComplete="username" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-[#0c0c0e] px-4 text-sm outline-none transition focus:border-orange-500" placeholder="nombre@motoparts.local"/></label><label className="block text-xs font-semibold text-zinc-300">Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-[#0c0c0e] px-4 text-sm outline-none transition focus:border-orange-500" placeholder="••••••••••••"/></label>{error&&<p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}<button disabled={busy} className="min-h-12 w-full rounded-lg bg-orange-500 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-orange-400 disabled:opacity-60">{busy?"Validando acceso…":"Iniciar sesión"}</button></form>
    {import.meta.env.DEV&&<div className="mt-7 border-t border-zinc-800 pt-5"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Accesos rápidos de demostración</p><div className="grid grid-cols-2 gap-2">{demoUsers.map((u)=><button key={u.email} onClick={()=>{setEmail(u.email);setPassword("Demo2026*");void handleLogin(u.email,"Demo2026*");}} className="min-h-11 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-left text-xs text-zinc-300 transition hover:border-orange-500/60 hover:text-white">{u.name}<span className="mt-1 block text-[10px] text-zinc-600">{u.role}</span></button>)}</div><p className="mt-3 text-[10px] text-zinc-600">Contraseña demo local: Demo2026*</p></div>}
  </section><p className="absolute bottom-4 text-[10px] tracking-wide text-zinc-700">MotoParts Solutions S.A.S. · Bucaramanga · COT</p></main>;
}
