# Registro de desarrollo

## 2026-10-29 — Brecha de clientes y comunicación de servicio
- Identificado: el esquema relaciona órdenes con placa/modelo y catálogo técnico, pero no tiene clientes ni motos físicas registradas con propietario; no hay contacto para avisar sobre esperas de repuestos.
- Documentado RF06 e historia de usuario, campos mínimos, relación cliente–moto–orden, historial manual de contactos, permisos propuestos, privacidad y criterios de aceptación en `REQUERIMIENTO_CLIENTES_Y_CONTACTO.md`.
- Actualizados arquitectura, base de datos, seguridad, flujos y plan. Se creó `ESTADO_DEL_PROYECTO.md` con implementado, pendiente operativo y siguiente iteración.
- Estado: documentación/propuesta únicamente. No se modificaron Prisma, APIs ni interfaz; falta confirmar teléfono obligatorio, permisos de consulta/edición y si se desea envío automático o solo registro/manual.

## 2026-10-29 — Búsqueda en vivo, sugerencias e índices
- El buscador global y la página de resultados ahora consultan repuestos, motos y órdenes mientras se escribe y despliegan coincidencias con navegación directa.
- Despiece & Motos ofrece una lista inmediata de modelos encontrados; el catálogo de repuestos ofrece sugerencias seleccionables, ambos con estados de carga/error/sin resultados y breve debounce.
- Inventario ahora filtra por estado de stock además del texto y busca por SKU, nombre, OEM, marca y EAN. La búsqueda global/catálogo amplió sus campos a OEM, marca y EAN.
- Añadida migración PostgreSQL `pg_trgm` con índices GIN para búsquedas parciales en repuestos, modelos y órdenes. Aplicar con `npm run db:migrate`; revisar permisos de extensión en el servidor PostgreSQL.
- Verificación: compilación de cliente y servidor completada. No se ejecutó migración contra una base conectada ni pruebas automatizadas.

## 2026-10-28 — Búsqueda de modelos y manuales técnicos
- Corregido el buscador de Despiece & Motos: ya no precarga Yamaha FZ 2.0 FI; al escribir una búsqueda nueva, descarta la ficha anterior. Se puede abrir un modelo desde la lista de resultados, y filtrar compatibilidad por año opcional.
- Despiece: las pestañas llevan a su sección; el selector cambia el sistema y los puntos numerados seleccionan la pieza para ver disponibilidad, ubicación y precio taller.
- Añadida gestión ADMIN de versiones de manual desde la ficha de moto, con vigencia, enlace HTTPS opcional y registro de auditoría. Un manual nuevo sustituye al vigente anterior.
- Verificación: compilación de cliente y servidor completada.

## 2026-10-28 — Ajustes responsive de navegación y panel
- Sidebar de escritorio: navegación con desplazamiento vertical propio, cabecera y tarjeta del usuario fijas, para mantener disponibles las rutas del administrador en ventanas de poca altura.
- Navegación móvil: menú «Más» con altura máxima y desplazamiento interno; el contenido principal queda limitado al viewport.
- Panel gerencial: tarjetas KPI pasan a una columna en anchuras muy estrechas y dos columnas desde 360 px; se permite el ajuste de textos largos dentro de tarjetas.
- Verificación pendiente: compilación de cliente. La inspección visual en navegador no pudo continuar porque la herramienta de control detuvo la sesión al no poder verificar con seguridad la URL activa.

## 2026-10-28 — Inicio de v1
- Decisión: monorepo npm con `client/` y `server/` independientes.
- Decisión: PostgreSQL desde la primera migración, con Supabase como proveedor previsto.
- Documentación creada: arquitectura, seguridad, reglas, modelo de datos, plan y despliegue.
- Esqueleto creado: Vite/React/Tailwind, Express/TypeScript, Prisma ORM 7 y esquema inicial relacional.
- Seguridad inicial: helmet, CORS por origen, límite de JSON, rate limit de login, RBAC middleware, JWT con audiencia/emisor, hash bcrypt y auditoría de login.
- Seed inicial: usuarios, modelos, categorías, repuestos, ubicaciones/stock, compatibilidades, manual FZ 2.0, despiece de frenos, bahías y solicitudes de demostración.
- Implementado: API de autenticación, catálogo técnico, órdenes/bahías, solicitudes, reservas y despacho QR, kardex, inventario, POS, reportes, usuarios y auditoría.
- Implementado: interfaz responsive en español con navegación por rol, acceso demo, catálogo, taller, despiece, scanner QR/cámara e ingreso manual, inventario, POS, panel, reportes y administración.
- Migración inicial PostgreSQL creada con restricciones SQL para integridad de stock, precios, cantidades y manual vigente.
- Verificación: `npm run db:generate` y `npm run build` completaron correctamente para servidor y cliente. No se ejecutaron pruebas automatizadas.
- Pulido UX: aumenté contraste de acciones secundarias, acento de iconos y foco de teclado; los botones con tooltip muestran también su etiqueta, los iconos solos tienen nombre accesible y el formulario de inventario adapta el texto del botón a la acción.
- Pendiente de configuración del proyecto: credenciales propias de Supabase, aplicar migración y seed sobre una base de desarrollo conectada, configurar secretos/orígenes del despliegue y hacer revisión funcional en navegador/dispositivos.

## Convenciones
Registrar aquí decisiones que cambien arquitectura, reglas implementadas, cambios de esquema y cualquier limitación detectada. No guardar secretos ni datos de acceso.
