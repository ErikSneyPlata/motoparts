# MotoParts — Seguridad

## Principios
Aplicar mínimo privilegio, validación en el servidor, autorización por cada recurso y acción, registro auditable de escrituras y manejo seguro de secretos. La interfaz nunca es frontera de seguridad.

## Identidad y sesiones
- Contraseñas con bcrypt (factor de costo 12); nunca almacenar texto plano. Revaluar el factor con mediciones en el entorno de despliegue.
- JWT HS256 de 30 minutos, secreto por variable de entorno y validación de firma, emisor, audiencia y expiración. El token vive en memoria de la sesión del cliente; no se persiste en localStorage.
- No incluir tokens en URLs ni registrar credenciales o tokens en logs. Cookies `HttpOnly`, `Secure` y `SameSite` si se adopta sesión en cookie; definir protección CSRF acorde.
- Limitar intentos de inicio de sesión por IP y responder con errores genéricos que no revelen si existe un correo. El sistema audita el resultado del login sin registrar contraseñas ni tokens.

## Autorización y datos
- RBAC en middleware y servicios, con denegación por defecto.
- Calcular campos de respuesta según el rol en el backend: MECHANIC nunca recibe PVP, costo ni margen.
- Validar entrada y parámetros con Zod; consultas Prisma parametrizadas; limitar paginación, cuerpos JSON a 1 MB, tamaños y tipos de archivo.
- CORS con origen explícito de despliegue. Helmet, límite general de API y límites más estrictos para login y validación QR. Se confía en un proxy de despliegue para interpretar la IP cliente detrás de Render.
- **Propuesta para datos de clientes:** teléfono, correo y notas de contacto son datos personales. Mantenerlos en DTOs específicos de órdenes autorizadas; no incluirlos en listados de bodega/ventas, búsqueda global, reportes ni telemetría. ADMIN/MANAGER y mecánicos asignados tendrían acceso según necesidad operativa; los permisos finales se deben acordar antes de implementar.
- Solicitar autorización del cliente para contactarlo por asuntos del servicio y registrar el propósito/fecha. Auditar creación y cambios de datos/contactos. Definir retención, eliminación/anonimización y procedimiento para corregir datos antes de producción.

## Integridad y trazabilidad
- Transacciones para reserva/entrega/venta y actualización de stock; comprobar disponibilidad bajo concurrencia y rechazar cantidades inválidas.
- Idempotencia para confirmar QR, ventas y otras operaciones que descuentan inventario.
- Auditoría de autenticación y mutaciones, con actor, entidad, acción, fecha y detalles permitidos; no guardar contraseñas, tokens ni secretos.
- Validar que el SKU escaneado, la solicitud y el modelo/orden coincidan antes de entregar.

## Operación segura
- Secretos solo en almacenes de variables de entorno de Vercel/Render/Supabase; `.env` ignorado y `.env.example` sin valores reales.
- TLS en conexiones externas; acceso a base de datos limitado por entorno y credenciales con privilegios mínimos.
- Respaldos automáticos/verificados en Supabase y procedimiento documentado de restauración.
- Actualizar dependencias y revisar alertas; no exponer paneles de administración ni credenciales de servicio al cliente web.

## Validación de seguridad
Validar RBAC en rutas, filtrado de precios, autenticación, entradas inválidas, concurrencia de stock, QR incorrecto, reintentos y exposición accidental de datos antes del despliegue.
