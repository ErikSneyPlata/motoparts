# Requerimiento propuesto — Clientes y comunicación de servicio

**Estado:** brecha identificada; propuesta documentada para una siguiente iteración. No está implementada en la v1.

## Problema observado

El sistema registra el catálogo de modelos (`MotorcycleModel`) y la placa/modelo en la orden de trabajo, pero no registra la moto física como propiedad de un cliente ni los datos del cliente. Si una reparación queda esperando un repuesto, el taller no tiene nombre ni canal de contacto para informar el avance.

## Requerimiento funcional propuesto (RF06)

El sistema debe permitir registrar al cliente y su motocicleta física al crear una orden de trabajo, consultar esa información desde la orden y dejar trazabilidad de los contactos realizados durante el servicio, especialmente cuando la orden esté en espera de repuesto.

### Historia de usuario

Como asesor o mecánico del taller, quiero asociar una orden a un cliente y a su moto, y registrar cuándo lo contacté, para informarle el diagnóstico, la espera de una pieza y el avance de la reparación.

## Datos mínimos propuestos

- Cliente: nombre completo, teléfono de contacto requerido, correo opcional, canal preferido (llamada, WhatsApp o correo) y confirmación/fecha de autorización de contacto para asuntos del servicio.
- Motocicleta física: placa única, modelo del catálogo (`MotorcycleModel`), año y kilometraje opcional.
- Contacto de servicio: orden, usuario que contactó, canal, fecha/hora, resultado y nota breve.

La placa y el modelo que hoy están directamente en `RepairOrder` representan datos de la orden; `MotorcycleModel` es el catálogo técnico y no identifica una unidad física ni a su propietario.

## Flujos propuestos

1. Al crear una orden, buscar un cliente por teléfono o nombre; si no existe, registrarlo en un modal.
2. Asociar la moto física del cliente (placa, modelo, año) o registrarla si es su primera visita.
3. Cuando una solicitud pase a «Espera reposición» y la orden a «En espera de repuesto», mostrar el cliente y sus medios de contacto a personal autorizado.
4. Ofrecer acciones manuales «Llamar» y «Abrir WhatsApp» (sin enviar mensajes automáticamente en esta fase).
5. Registrar el contacto y su resultado en el historial de la orden. Al recibir/entregar la pieza, actualizar el estado de la orden y volver a contactar según el proceso del taller.

## Privacidad y autorización

- Recoger solo los datos necesarios para prestar el servicio y explicar el propósito al cliente.
- El API valida los campos y la autorización; registrar cambios y contactos en auditoría/historial.
- ADMIN y MANAGER pueden consultar los datos de contacto. MECHANIC solo los de órdenes asignadas. WAREHOUSE, SALES y consultas generales no reciben teléfono ni correo por defecto.
- Las respuestas de solicitudes, inventario, catálogo, búsqueda global y reportes no deben incluir datos personales del cliente.
- No guardar conversaciones completas ni credenciales; limitar la nota del contacto a información operativa.

## Criterios de aceptación propuestos

1. No se puede crear una nueva orden sin nombre del cliente y al menos un teléfono válido; correo es opcional.
2. La orden relaciona cliente, placa, modelo y año de la motocicleta física.
3. Al quedar esperando un repuesto, un usuario autorizado encuentra la orden y puede llamar/abrir WhatsApp desde el contacto registrado.
4. El usuario registra canal, fecha, resultado y nota; queda visible en el historial de la orden y la auditoría.
5. Una moto existente del mismo cliente puede seleccionarse en una visita posterior; la placa no se duplica entre clientes.
6. WAREHOUSE y SALES no reciben teléfono/correo en ninguna respuesta de API. El mecánico solo recibe los datos de sus órdenes asignadas.
7. Los registros históricos que no tienen cliente siguen consultables tras la migración; se pueden completar después sin inventar datos.

## Alcance por etapas

**Siguiente iteración (recomendada):** entidades `Customer`, `CustomerMotorcycle` y `CustomerContactLog`; formulario de cliente/moto al crear orden; detalle de contacto e historial; acciones de llamada/WhatsApp manuales; permisos y auditoría; migración compatible con órdenes antiguas.

**Futuro opcional:** notificaciones automáticas por WhatsApp/SMS/correo, plantillas, confirmaciones de entrega y preferencias avanzadas. Requiere elegir proveedor, costos, consentimiento y manejo de fallos; no se incluye en esta propuesta funcional inicial.

## Decisiones pendientes antes de implementar

- Confirmar si el teléfono debe ser obligatorio (recomendación: sí) y si se permitirá crear órdenes sin datos de cliente para casos excepcionales.
- Confirmar qué perfiles pueden ver y actualizar el contacto del cliente. La propuesta aplica mínimo privilegio.
- Definir quién crea/edita clientes: propuesta inicial ADMIN, MANAGER y MECHANIC para sus órdenes; bodega y ventas no.
- Confirmar si el alcance de la siguiente entrega incluye solo contacto manual o también integración automática con un proveedor.
