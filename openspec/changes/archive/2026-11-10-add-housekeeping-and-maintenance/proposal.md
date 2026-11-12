# Proposal: add-housekeeping-and-maintenance

## Why

El hotel no tiene forma de saber si una habitación está limpia, quién la tiene asignada ni qué averías tiene. La disponibilidad solo mira reservas (`extend-rooms-management` agrega `Room.estado` para el mantenimiento) y `extend-reservations-lifecycle` permite hacer check-in de cualquier reserva sin importar el estado real de la habitación. En la práctica eso significa check-in a una habitación sin limpiar, con averías sin registrar y sin responsable de housekeeping ni historial de intervenciones.

## What Changes

- Tareas de limpieza por habitación (limpieza de salida, limpieza profunda, lencería e inspección) con estados, asignación a un usuario del personal y fecha programada.
- Estado de limpieza de la habitación **derivado** de sus tareas (sin agregar estados a `Room.estado`) y visible en el detalle de la habitación.
- Regla opcional de bloqueo del check-in cuando la habitación no está limpia (`HOUSEKEEPING_BLOCK_CHECKIN`), definida por configuración para no romper el ciclo de vida ya implementado.
- Incidencias y tickets de mantenimiento por habitación (tipo, prioridad, estado, resolución) que, al resolverse, generan una tarea de inspección para devolver la habitación a servicio.
- Panel operativo de housekeeping (tareas por estado, carga por asignatario) e historial de limpieza e incidencias por habitación.

## Capabilities

### New Capabilities

- `housekeeping`: tareas de limpieza e inspección por habitación, estado de limpieza derivado y panel operativo.
- `maintenance`: registro y seguimiento de incidencias/tickets de mantenimiento por habitación.

### Modified Capabilities

- `rooms`: el detalle de la habitación expone su estado de limpieza derivado y si tiene incidencias abiertas.
- `reservations`: el check-in puede bloquearse cuando la habitación no está limpia, según configuración.

## Impact

- `prisma/schema.prisma`: nuevos modelos `HousekeepingTask` y `MaintenanceTicket` con sus índices. Sin cambios en `Room` ni en `Reservation`.
- Nuevos módulos `routes`/`controllers`/`services`/`repositories`/`schemas` de `housekeeping` y `maintenance`, registrados en `src/routes/index.js`.
- `src/config/housekeepingRules.js` (aún de reglas) + `.env.example` y `.env`.
- Documentación OpenAPI/Swagger (`src/docs/index.js`) y README.
- Depende de `extend-rooms-management` y `extend-reservations-lifecycle` (ya implementados) para `Room.estado` y el endpoint de check-in. No depende de `add-cross-cutting-features`: se puede implementar en paralelo.