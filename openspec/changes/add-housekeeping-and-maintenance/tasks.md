# tasks.md — add-housekeeping-and-maintenance

> Rama sugerida: `feat/housekeeping-maintenance`. Se puede implementar en paralelo a `add-cross-cutting-features`; los puntos de contacto y cómo resolverlos están en `design.md` § Integración en paralelo.

## 1. Modelo de datos y configuración

- [ ] 1.1 Crear `HousekeepingTask { id, roomId FK, tipo, estado, asignadoAId FK User?, fechaProgramada, observaciones?, creadoEn, actualizadoEn }` y `MaintenanceTicket { id, roomId FK, tipo, prioridad, estado, descripcion, resolucion?, reportadoPorId FK User, asignadoAId FK User?, creadoEn, actualizadoEn, resueltoEn? }` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [ ] 1.2 Agregar `@@index([roomId, estado])` y `@@index([estado, fechaProgramada])` en `HousekeepingTask`, y `@@index([roomId, estado])` y `@@index([estado, prioridad])` en `MaintenanceTicket`; verificar que la migración los incluye.
- [ ] 1.3 Configurar `HOUSEKEEPING_BLOCK_CHECKIN` en `.env.example`, `.env` y un `src/config/housekeepingRules.js` con el patrón de `src/config/availabilityRules.js`; verificar que se lee con default `false` en los tests.

## 2. Housekeeping

- [ ] 2.1 Implementar `housekeeping.service`/`repository` con alta de tarea y la tabla de transiciones válidas (`PENDIENTE → EN_PROCESO → LIMPIA → EN_INSPECCION → INSPECCION_OK|INSPECCION_FALLA`, más `CANCELADA` y `INSPECCION_FALLA → EN_PROCESO`); verificar con tests unitarios que una transición inválida devuelve `409` y que los estados terminales no se mueven.
- [ ] 2.2 Implementar `getEstadoLimpieza(roomId)` derivado de la última tarea no cancelada (`LIMPIA`, `EN_PROCESO`, `SUCIA`, `PENDIENTE`; `PENDIENTE` si no hay tareas); verificar con tests unitarios cada estado de origen, incluida `INSPECCION_FALLA → SUCIA`.
- [ ] 2.3 Implementar `POST /housekeeping/tasks` (solo `ADMINISTRADOR`, rechaza `409` si la habitación no existe), `GET /housekeeping/tasks` con filtros `estado`/`tipo`/`roomId`/`asignadoAId`/`fecha` y paginación, y `PATCH /housekeeping/tasks/{id}` con las reglas por rol (reclamar, tomar, completar e inspeccionar; programar, asignar a otro y cancelar solo `ADMINISTRADOR`); verificar tests `201`, `200`, `403`, `404` y `409`.
- [ ] 2.4 Implementar `GET /rooms/{id}/housekeeping` (historial de tareas e incidencias de la habitación, orden descendente) y `GET /housekeeping/resumen` (conteo por estado y carga por asignatario para una fecha); verificar tests `200`, `404` para habitación inexistente y `422` para fecha inválida.
- [ ] 2.5 Implementar la regla de bloqueo de check-in en `POST /reservations/{id}/check-in`: si `HOUSEKEEPING_BLOCK_CHECKIN` está activa y la habitación no está `LIMPIA`, responder `409` con código `HABITACION_NO_LIMPIA`; verificar tests con la regla activa (bloquea) y apagada (no bloquea, comportamiento actual).
- [ ] 2.6 Exponer el estado de limpieza y la cantidad de incidencias abiertas en el detalle de la habitación; verificar test de `GET /rooms/{id}` que incluye `limpieza` e `incidenciasAbiertas`.

## 3. Mantenimiento

- [ ] 3.1 Implementar `POST /maintenance/tickets` (cualquier rol autenticado; `422` para tipo o prioridad inválidos, `404` si la habitación no existe) y `GET /maintenance/tickets` con filtros `estado`/`prioridad`/`roomId`/`tipo` y paginación; verificar tests `201`, `200`, `404` y `422`.
- [ ] 3.2 Implementar `GET /maintenance/tickets/{id}` y `PATCH /maintenance/tickets/{id}` con las transiciones `ABIERTO → EN_PROCESO → RESUELTO` y `ABIERTO|EN_PROCESO → CANCELADO` (cancelar solo `ADMINISTRADOR`), exigiendo `resolucion` no vacía al resolver; verificar tests de cada transición, de `422` sin `resolucion` y de `403` al cancelar como `RECEPCIONISTA`.
- [ ] 3.3 Al resolver un ticket, crear automáticamente una `HousekeepingTask` de tipo `INSPECCION` para la habitación, de forma idempotente (no duplicar si ya hay una inspección `PENDIENTE` o `EN_INSPECCION`); verificar con un test que reintentar el cierre no genera una segunda tarea.
- [ ] 3.4 Verificar que cancelar un ticket no genera tarea de inspección; verificar test del estado del ticket y de las tareas de la habitación.

## 4. Cierre

- [ ] 4.1 Documentar en `src/docs/index.js` los endpoints de housekeeping y mantenimiento y el parámetro de configuración; verificar que `/api/docs` los refleja.
- [ ] 4.2 Actualizar README con el flujo operativo (programar → limpiar → inspeccionar) y la variable `HOUSEKEEPING_BLOCK_CHECKIN`; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.
- [ ] 4.3 (Opcional, solo si `add-cross-cutting-features` ya está mergeado) llamar `audit()` en las transiciones de limpieza y en el alta/cierre de tickets; verificar un test de auditoría. Si no está mergeado, dejarlo pendiente para integrarlo después.