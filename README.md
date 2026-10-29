# MotoParts Solutions S.A.S.

Sistema Integral de Gestión de Repuestos y Diagnóstico. Monorepo de frontend y API con PostgreSQL administrado por Supabase.

## Estructura

- `client/`: React, TypeScript, Vite y Tailwind.
- `server/`: Express, TypeScript, Prisma ORM y PostgreSQL.
- `Documentacion/`: decisiones, reglas, seguridad, modelo de datos y operación.
- `motoparts disenio stitch/`: referencias visuales originales.

## Requisitos

Node.js 22.12 o superior y npm. Crea una base PostgreSQL en Supabase o usa una instancia local de PostgreSQL para desarrollo.

## Configuración local

1. Copia `server/.env.example` como `server/.env` y configura `DATABASE_URL`, `DIRECT_URL` y un `JWT_SECRET` aleatorio de 32 caracteres o más. Copia `client/.env.example` como `client/.env`; en local conserva `VITE_API_URL=http://localhost:4000/api`.
2. Ejecuta `npm install`.
3. Ejecuta `npm run db:generate` y `npm run db:migrate`.
4. Ejecuta `npm run db:seed` para cargar datos demo.
5. Ejecuta `npm run dev`; cliente en `http://localhost:5173`, API en `http://localhost:4000/api`.

Las credenciales demo usan la contraseña `Demo2026*` (solo para desarrollo). Correos: `carlos.ruiz@motoparts.local`, `mateo.silva@motoparts.local`, `sofia.castano@motoparts.local`, `ricardo.herrera@motoparts.local` y `laura.mendoza@motoparts.local`. El seed también crea a David Moreno y los demás mecánicos. Nunca ejecutes ni conserves estas credenciales en producción.

## Supabase

Usa una conexión de aplicación compatible con el pool configurado en `DATABASE_URL` y la conexión directa en `DIRECT_URL` para migraciones. Los valores reales se gestionan como secretos del entorno, nunca dentro del cliente ni en Git. Consulta `Documentacion/OPERACION_Y_DESPLIEGUE.md`.

## Despliegue

Frontend estático en Vercel, API Node persistente en Render y PostgreSQL en Supabase. Configura CORS y variables en cada entorno y aplica migraciones revisadas antes de desplegar.

