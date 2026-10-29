# MotoParts — Flujos y reglas de negocio

## Solicitud y despacho
1. Mecánico selecciona una orden de trabajo y un repuesto compatible con el modelo/año.
2. El servidor valida compatibilidad y stock disponible (`onHand - reserved`).
3. Si hay stock, reserva la cantidad y crea SOL con historial. Si no, asigna «Espera reposición»; generar pedido crea un borrador interno.
4. Bodega cambia el estado a preparación. La entrega exige QR `MP:PART:<SKU>` que coincida con la pieza de la solicitud y la orden.
5. La confirmación en una transacción descuenta existencias, libera reserva, crea MOV y registra historial/auditoría. La operación debe ser idempotente.

## Venta de mostrador
El servidor valida rol, productos y disponibilidad; en una transacción crea venta/ítems, descuenta el mismo stock e inserta movimientos y auditoría.

## Stock y precios
- Agotado: 0; bajo: 1–5; en stock: 6 o más.
- Stock disponible = existencias − cantidad reservada.
- MECHANIC recibe solo precio taller. PVP/costo/margen solo SALES, MANAGER y ADMIN.

## Solicitud y estados
Pendiente → En preparación → Camino a bahía (o Listo para retiro en mostrador) → Entregada y validada con QR. Laterales: Espera reposición y Cancelada. Cada transición se valida en servidor y deja historial con actor y fecha. Urgentes primero.

## Datos de ejemplo
Las motos, repuestos, usuarios demo, solicitudes y referencias técnicas se derivan exactamente del prompt del proyecto. Las cifras de panel se calculan de consultas persistidas, no se codifican en la interfaz.

## Atención al cliente — pendiente de la siguiente iteración
La v1 no permite asociar una orden con datos de contacto del cliente. Se propone que las órdenes nuevas se vinculen a un cliente y una motocicleta física y que los contactos sobre diagnóstico/espera de repuestos se registren en un historial. En la primera etapa, las acciones de llamada o WhatsApp serán manuales; no se enviarán notificaciones automáticas. Las reglas de privacidad y la propuesta de permisos están en [Requerimiento de clientes y contacto](REQUERIMIENTO_CLIENTES_Y_CONTACTO.md).
