# MotoParts — Arquitectura

## Objetivo
Sistema Integral de Gestión de Repuestos y Diagnóstico para MotoParts Solutions S.A.S. La v1 integra operación de taller, catálogo, solicitudes, inventario, ventas, reportes y auditoría.

## Arquitectura elegida
Monorepo con aplicaciones separadas: `client/` (React, TypeScript, Vite) y `server/` (Node.js, Express, TypeScript, Prisma). Cada aplicación administra sus dependencias y proceso de despliegue; el repositorio mantiene una sola fuente de verdad para contratos y documentación.

## Persistencia
PostgreSQL como base principal desde la v1, gestionada en Supabase. Prisma será la capa de acceso. Las escrituras de inventario y solicitudes usarán transacciones y restricciones de base de datos para evitar stock negativo y dobles entregas. Se documentarán migraciones, variables y estrategia de respaldo.

## Despliegue propuesto
Frontend estático en Vercel; API Node en Render; PostgreSQL administrado por Supabase. Las URLs, secretos y cadenas de conexión se configurarán por entorno. Esta distribución conserva la experiencia de despliegue conocida y evita tratar SQLite local como almacenamiento efímero en producción.

## Límites de módulos
- Cliente: páginas, componentes, rutas, estado de sesión, validación de formularios y cliente HTTP.
- Servidor: rutas REST bajo `/api`, controladores delgados, servicios de dominio, validación Zod, autenticación, autorización, auditoría y Prisma.
- Base de datos: usuarios/roles, motos/manuales, repuestos/compatibilidades, ubicaciones/stock, movimientos, órdenes, solicitudes, ventas y auditoría.
- Brecha para siguiente iteración: CRM de clientes y motos físicas, asociado a órdenes de trabajo, con contactos trazables y acceso restringido a datos personales. Ver [Requerimiento de clientes y contacto](REQUERIMIENTO_CLIENTES_Y_CONTACTO.md).

## Documentos relacionados
- [Estado del proyecto](ESTADO_DEL_PROYECTO.md)
- [Requerimiento de clientes y contacto](REQUERIMIENTO_CLIENTES_Y_CONTACTO.md)
- [Plan de implementación](PLAN_IMPLEMENTACION.md)
- [Seguridad](SEGURIDAD.md)
- [Flujos y reglas de negocio](FLUJOS_Y_REGLAS.md)
- [Base de datos](BASE_DE_DATOS.md)
- [Operación y despliegue](OPERACION_Y_DESPLIEGUE.md)
