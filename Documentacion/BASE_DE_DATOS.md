# MotoParts — Base de datos

## Tecnología
PostgreSQL administrado por Supabase y Prisma ORM. La URL de conexión directa se reserva para migraciones/administración; la aplicación puede usar el pooler de Supabase según el entorno y la configuración de Prisma. No se confirma ninguna URL o clave real en el repositorio.

## Dominios del esquema
- Identidad: User, roles, estado y datos de turno.
- Catálogo técnico: Brand, MotorcycleModel, Manual, SystemGroup, ExplodedHotspot, TorqueSpec.
- Repuestos: PartCategory, Part, PartCompatibility.
- Inventario: WarehouseLocation, Stock, InventoryMovement, Supplier, PurchaseOrder e ítems.
- Taller: ServiceBay, RepairOrder, PartRequest, RequestStatusHistory.
- Ventas: Sale y SaleItem.
- Control: AuditLog.

## Brecha y ampliación propuesta
La v1 todavía no tiene entidades `Customer` ni una moto física asociada a su propietario. `MotorcycleModel` es catálogo técnico; `RepairOrder.plate` y `modelId` describen la moto atendida, pero no permiten recuperar el contacto del cliente. La siguiente iteración propone `Customer`, `CustomerMotorcycle` y `CustomerContactLog`, enlazando la orden con una moto y conservando `CustomerMotorcycle.modelId` hacia el catálogo. Ver [requerimiento propuesto](REQUERIMIENTO_CLIENTES_Y_CONTACTO.md).

La migración debe dejar asociación opcional para órdenes históricas; la API exigirá cliente/moto en las órdenes nuevas. Se mantendrán teléfono/correo fuera de respuestas de bodega, ventas y búsquedas generales. No se modificará el esquema hasta acordar el alcance y los permisos.

## Integridad
La migración inicial está en `server/prisma/migrations/20261028000000_init/migration.sql`. Incluye claves foráneas, unicidad de SKU/códigos legibles y restricciones SQL para precios/cantidades no negativos, reservas que no superan existencias y un único manual vigente por modelo. Las transacciones serializables y bloqueos de filas protegen reservas, ventas y entregas concurrentes. SOL/MOV/OT se generan mediante contadores atómicos en PostgreSQL.

## Migraciones y seed
Las migraciones Prisma son la fuente versionada del esquema; la migración conserva restricciones PostgreSQL personalizadas además del DDL generado por Prisma. El seed es repetible, crea usuarios demo con hash bcrypt, ocho bahías, motos, repuestos, compatibilidades, ubicaciones, solicitudes e historial de ejemplo. No se debe ejecutar seed contra producción.

## Respaldo y recuperación
Configurar respaldos de Supabase según el plan, documentar retención y restauración, y probar recuperación antes de depender de la base para operación real.
