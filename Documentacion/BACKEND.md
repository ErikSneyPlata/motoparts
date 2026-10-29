# Backend — implementación

## Organización
`src/routes` declara endpoints y valida entradas, `src/services` contiene reglas transaccionales y auditoría, `src/middleware` aplica identidad y autorización, `src/db` configura Prisma y `prisma/` versiona esquema, migraciones y seed.

## Base técnica
Express 5, TypeScript, Zod, Prisma ORM 7 y PostgreSQL. Prisma usa `@prisma/adapter-pg` en runtime; `prisma.config.ts` toma `DIRECT_URL` para tareas de CLI/migración y el pool de aplicación se configura en `DATABASE_URL`.

## Autenticación y autorización
`POST /api/auth/login` verifica hash bcrypt y firma JWT HS256 con audiencia, emisor y vencimiento. `GET /api/auth/me` requiere token válido y usuario activo. Roles se obtienen desde la base de datos en cada petición; nunca se confía en el selector de rol del cliente. El login aplica limitación de intentos y no informa si el correo existe.

## Módulos HTTP
- `/api/auth`: login y consulta del usuario de la sesión.
- `/api`: marcas, modelos, manuales, sistemas, hotspots, repuestos, compatibilidad, QR, búsqueda global, dashboard y reportes.
- `/api/repair-orders`, `/api/bays`, `/api/workshop/summary`: órdenes, bahías y métricas del taller.
- `/api/requests`: creación con validación de compatibilidad y reserva, bandeja, transiciones, cancelación, validación QR, reabastecimiento y borrador a proveedor.
- `/api/inventory`: existencias, ubicaciones, alertas, entradas, salidas y kardex.
- `/api/sales`: ventas POS con descuento inmediato de stock.
- `/api/users`, `/api/audit`, `/api/suppliers`, `/api/purchase-orders`: administración y trazabilidad.
- `/api/health`: estado de proceso y conexión PostgreSQL.

Las reglas que afectan stock, ventas y entrega QR viven en transacciones de PostgreSQL con bloqueo de fila y auditoría. Las respuestas se serializan como DTO por rol, y las operaciones de escritura comprueban permiso en el servidor. El router del dashboard se monta en `/api`, por lo que sus permisos se aplican solo a sus rutas de panel e informes; no debe imponer autorización global a otros routers bajo ese prefijo.

## Límites de tráfico
Se configura confianza en el proxy de Render, límite general de 300 solicitudes por IP cada 15 minutos, login de 10 y validación QR de 30 en la misma ventana. Ajustar los límites al tráfico real y al escalado multiinstancia antes de producción.

## Datos demo
`prisma/seed.ts` es un seed repetible para usuarios y datos base. Todos usan `Demo2026*` en entorno local; deben reemplazarse y no se deben habilitar en producción.
