# Flujo de trabajo del desarrollo

1. Actualizar esquema y migración Prisma al cambiar datos persistidos.
2. Implementar regla en servicio backend; validar rol y entrada en servidor.
3. Registrar auditoría dentro de la misma transacción cuando sea una mutación de negocio.
4. Exponer respuesta DTO que filtre campos sensibles por rol.
5. Consumir endpoint en cliente con React Query y mostrar carga, vacío y error.
6. Actualizar esta documentación y el registro de desarrollo.
7. Antes de producción: revisar permisos, integridad de stock, variables, respaldos y comportamiento responsive.

## Convenciones de acciones en la interfaz
- Las acciones principales usan acento naranja; secundarias mantienen borde/fondo de alto contraste y sus iconos usan acento naranja.
- Una acción que solo muestra icono debe tener `title` y `aria-label`; cuando el control usa el componente `Button`, la etiqueta del `title` también se presenta junto al icono.
- Formularios describen la acción que se ejecutará (por ejemplo, crear repuesto, registrar entrada o registrar salida). Las acciones destructivas se diferencian con estilo rojo.
- Los controles de filtros indican el valor activo con selección visible; cerrar sesión, cerrar avisos y controles +/- llevan nombres accesibles.

## Convenciones responsive
- El sidebar de escritorio ocupa el viewport vertical y mantiene su encabezado y usuario anclados; la lista de navegación tiene desplazamiento vertical propio.
- El menú móvil «Más» tiene altura máxima ligada al viewport y desplazamiento interno para que todas las rutas sigan accesibles.
- El shell y sus contenedores no deben superar el ancho disponible; cuadrículas y tarjetas deben permitir reducirse (`min-width: 0`). Las tablas anchas usan desplazamiento horizontal dentro de su panel.
- Revisar el panel gerencial en 390 px y en anchuras inferiores antes de dar por cerrado un cambio de layout.

## Manuales técnicos
- ADMIN puede registrar una nueva versión desde la ficha del modelo. Al guardarla, la versión anterior deja de ser vigente y la nueva queda registrada en auditoría.
- El campo de archivo acepta un enlace HTTPS a un PDF público o a almacenamiento autorizado. El cliente muestra «Abrir manual» solo si existe ese enlace; no se cargan archivos al servidor de la aplicación.
- Para almacenamiento privado, entregar enlaces firmados desde un servicio backend antes de desplegar en producción.

## Búsquedas y filtros
- Los campos de texto consultan con una pausa corta mientras se escribe; las sugerencias muestran estado de carga, coincidencias y vacío, y permiten abrir el elemento seleccionado.
- La búsqueda global relaciona repuestos, motos y órdenes según los permisos del rol. Las páginas de catálogo e inventario agregan sus filtros propios sin reemplazar el criterio de búsqueda.
- En PostgreSQL, una migración habilita `pg_trgm` y agrega índices GIN para las búsquedas parciales (`ILIKE`/contains) de piezas, modelos y órdenes. Al aplicar la migración, confirmar que el usuario de base de datos pueda habilitar la extensión.

## Criterios de seguridad del flujo
El cliente puede mejorar la experiencia, pero el servidor valida compatibilidad, stock, transiciones, rol y precios. Las mutaciones que cambian stock se hacen atómicamente e incluyen historial y auditoría.
