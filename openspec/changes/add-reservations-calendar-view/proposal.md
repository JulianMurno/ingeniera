## Why

La sección Reservas del panel solo ofrece un listado paginado, que oculta la dimensión temporal: para saber qué habitaciones están libres un día concreto el personal debe cruzar filtros y rangos mentalmente. Una vista calendario muestra de un vistazo la ocupación por habitación y fecha, reduce el riesgo de solapamientos y facilita detectar huecos y habitaciones en mantenimiento.

## What Changes

- Se agrega en la sección Reservas del panel un selector de vista con dos opciones: **Listado** (la vista actual) y **Calendario** (nueva).
- La vista Calendario es una grilla con fechas en el eje X y habitaciones/cabañas en el eje Y.
- Cada celda (habitación × fecha) se muestra según el estado de esa noche: **disponible**, **reservada** o **en mantenimiento**.
- Una reserva que abarca varias noches se representa de forma continua a lo largo de sus fechas; las reservas canceladas o no-show no ocupan la celda.
- La vista incluye navegación de rango de fechas (anterior, siguiente, hoy), un rango visible por defecto y una leyenda de estados.
- Las celdas reservadas enlazan al detalle de la reserva.
- Se agrega un endpoint de lectura dedicado que devuelve las habitaciones y las reservas que se solapan con un rango de fechas, para alimentar la vista sin depender de la paginación del listado.

## Capabilities

### New Capabilities

- `reservations-calendar`: vista calendario del panel de reservas para el personal (selector de vista, ejes, estados de celda, navegación de rango, leyenda y enlaces al detalle).

### Modified Capabilities

- `reservations`: se agrega una consulta de lectura de reservas por rango de fechas orientada al calendario (habitaciones + reservas vigentes que se solapan con el rango).

## Impact

- **Backend:** nueva ruta `GET /api/v1/reservations/calendar` (debe declararse antes de `/:id`), controller, servicio, método de repositorio y esquema Zod de query (`desde`, `hasta`). Sin migración de base de datos.
- **Frontend:** `src/frontend/app/reservas/page.js` incorpora el selector de vista; nuevo componente de calendario. Se reutilizan los componentes y tokens del design system existente; sin dependencias nuevas.
- **Tests:** test de integración del endpoint nuevo (camino feliz, rango inválido, autenticación) y unitario de la derivación de estado de celda si se extrae a un módulo.
- **Documentación:** OpenAPI/Swagger del endpoint nuevo.
