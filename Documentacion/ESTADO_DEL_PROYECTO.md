# MotoParts — Estado del proyecto

**Actualizado:** 2026-10-29  
**Entrega:** v1 académica funcional; ampliación de clientes propuesta para siguiente iteración.

## Arquitectura actual

Monorepo npm con `client/` (React, TypeScript, Vite, Tailwind, React Router, TanStack Query, Zustand) y `server/` (Node.js, Express, TypeScript, Prisma), PostgreSQL y migraciones versionadas. El despliegue previsto es frontend en Vercel, API en Render y base de datos en Supabase.

## Implementado en la v1

- Autenticación JWT, contraseñas bcrypt, roles, límites/cabeceras de seguridad, validación Zod y auditoría.
- Catálogo de marcas/modelos, manuales técnicos versionados con enlace HTTPS, sistemas y hotspots del despiece; consulta de compatibilidad.
- Órdenes de trabajo, bahías, solicitudes, reserva de existencias, transiciones/historial y validación QR.
- Inventario, ubicaciones, entradas/salidas, kardex, alertas y venta de mostrador con stock compartido.
- Dashboard e informes desde datos persistidos, usuarios, auditoría y datos de demostración.
- Interfaz responsive por rol, navegación adaptada, búsqueda global/en vivo, sugerencias para motos/repuestos y filtros de inventario.
- Índices PostgreSQL GIN con `pg_trgm` versionados para las búsquedas parciales.
- Documentación técnica de arquitectura, seguridad, esquema, flujos, despliegue, plan e historial.

## Pendientes operativos de v1

- Configurar credenciales y orígenes del entorno propio.
- Aplicar migraciones y seed únicamente en la base de desarrollo correspondiente; la migración `pg_trgm` aún debe aplicarse allí.
- Verificar flujos de extremo a extremo en navegador y dispositivos móviles, incluyendo roles y datos reales de prueba.
- Definir respaldos/restauración y revisar permisos antes del despliegue.

## Brecha detectada: clientes y contacto

La v1 no almacena clientes ni motos físicas con propietario. `MotorcycleModel` es el catálogo técnico; la orden solo guarda placa/modelo. Por eso una orden en espera de repuesto no ofrece nombre, teléfono, correo ni historial de contacto.

La recomendación está descrita en [REQUERIMIENTO_CLIENTES_Y_CONTACTO.md](REQUERIMIENTO_CLIENTES_Y_CONTACTO.md). Se propone una siguiente iteración con `Customer`, `CustomerMotorcycle`, `CustomerContactLog`, datos mínimos con autorización de contacto, acciones manuales de llamada/WhatsApp, acceso por rol y compatibilidad con órdenes históricas. La integración de mensajes automáticos queda como etapa opcional posterior.

**Estado de esa ampliación:** documentada, no implementada. Confirmar obligatoriedad del teléfono, permisos de consulta/edición y alcance de notificaciones antes de iniciar esquema, API e interfaz.

## Historial

El detalle de los cambios por fecha está en [REGISTRO_DE_DESARROLLO.md](REGISTRO_DE_DESARROLLO.md). Las decisiones de acceso y privacidad están en [SEGURIDAD.md](SEGURIDAD.md).
