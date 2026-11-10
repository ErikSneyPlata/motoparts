# Despliegue de MotoParts en Vercel y Supabase

## Arquitectura

El monorepo se despliega como un proyecto Vercel con frontend Vite (`client/dist`) y una función Node.js Express que atiende `/api/*` desde `api/[...path].ts`. Las llamadas del navegador usan el mismo dominio en producción y `http://localhost:4000/api` en desarrollo. El rewrite de la SPA excluye `/api/*` para conservar el enrutamiento de la función.

PostgreSQL está alojado en Supabase. Prisma genera el cliente durante el build de Vercel antes de compilar el frontend.

## Variables de entorno en Vercel

Configurar como variables sensibles de Production y Preview: `DATABASE_URL` (conexión runtime), `DIRECT_URL` (conexión directa usada por Prisma) y `JWT_SECRET`. Configurar `CLIENT_ORIGIN` con el dominio Vercel del proyecto. `NODE_ENV` se establece en `production`.

No guardar credenciales en el repositorio ni en variables `VITE_*`.

## Flujo de despliegue

Los cambios en `main` generan un despliegue ligado a GitHub. Las migraciones existentes se aplican con `npm run db:deploy`; `npm run db:migrate` es para desarrollo y puede proponer migraciones nuevas o detectar índices SQL manuales.

## Seguridad

La autorización de MotoParts se mantiene con JWT y RBAC en la API. La protección de despliegue de Vercel permanece activa según la política del equipo. Usar cuentas demo solo para demostración y cambiar las credenciales antes de producción.