# MotoParts — Plan de implementación

## Fases de la v1
1. Fundamentos del monorepo, configuración de TypeScript, PostgreSQL/Supabase, Prisma, migraciones, semilla, autenticación, RBAC y layout por rol.
2. Marcas, modelos, manuales versionados, sistemas/despiece, compatibilidad y catálogo con protección de precios.
3. Órdenes de trabajo, solicitudes, reserva de stock, estados, historial y despacho con validación QR.
4. Inventario, entradas/salidas, alertas, kardex y transacciones atómicas.
5. Venta de mostrador con carrito, cobro y descuento inmediato del mismo stock.
6. Panel e informes calculados desde datos persistidos, incluido el reporte de 90 días y CSV.
7. Usuarios, auditoría y controles administrativos.
8. Diseño adaptable móvil, PWA preparada, estados de carga/vacío/error, revisión de seguridad y validación de los flujos de aceptación.
9. **Siguiente iteración propuesta:** clientes, motos físicas y contacto de servicio. Mantener registros históricos sin cliente; exigir los datos mínimos a nuevas órdenes; historial manual de llamadas/WhatsApp; DTOs/RBAC/auditoría y política de retención. Requiere cerrar las decisiones de [REQUERIMIENTO_CLIENTES_Y_CONTACTO.md](REQUERIMIENTO_CLIENTES_Y_CONTACTO.md) antes de tocar el esquema.

## Criterio de entrega
Cada fase debe dejar código ejecutable y documentación actualizada. Los datos visibles deben provenir de la API y la base de datos. El flujo demostrativo (Carlos → solicitud → Mateo → QR correcto → stock/kardex/auditoría → panel) debe mantenerse coherente de extremo a extremo.

## Decisiones vigentes
- PostgreSQL desde la v1, alojado en Supabase.
- Monorepo con `client/` y `server/` separados.
- Textos de interfaz en español; nombres técnicos, tablas, campos y API en inglés.
- No se guardan secretos en el repositorio.
