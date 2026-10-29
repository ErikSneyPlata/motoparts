# Actualizaciones de arquitectura y operación

## Decisiones de despliegue
- Frontend Vite: Vercel, raíz del repositorio y salida `client/dist` (`vercel.json`).
- API Express persistente: Render (`render.yaml`).
- PostgreSQL: Supabase. `DATABASE_URL` usa la conexión de aplicación/session pooler; `DIRECT_URL` la conexión directa para migraciones. Copia las cadenas reales desde Supabase y guárdalas como secretos.
- El API carga `server/.env` desde el directorio del workspace; parte de `server/.env.example`. Vite usa `VITE_API_URL` durante la compilación para apuntar al dominio HTTPS de la API. En local se define en `client/.env` a partir de `client/.env.example`.

## Comandos de base de datos
- Desarrollo: `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`.
- Despliegue: `npm run db:deploy` aplica migraciones versionadas sin recrearlas.
- El seed es exclusivo de entornos de desarrollo/demo; no se ejecuta automáticamente en producción.

## Seguridad PWA
El service worker cachea solo la carcasa estática (raíz, manifest e icono). Las rutas `/api/` y los datos autenticados nunca se almacenan en caché.
