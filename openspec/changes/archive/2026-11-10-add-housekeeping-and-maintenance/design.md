# Design: add-housekeeping-and-maintenance

## Context

Ver `proposal.md` — Why. Hoy `Room.estado` (`DISPONIBLE`/`MANTENIMIENTO`, de `extend-rooms-management`) describe la disponibilidad comercial y `availability.service` la usa como filtro; no hay ninguna noción de limpieza ni de avería. `extend-reservations-lifecycle` resuelve el check-in sin mirar la habitación. Arquitectura `route → controller → service → repository` con Prisma + SQLite, roles `ADMINISTRADOR`/`RECEPCIONISTA`, dinero y fechas según `openspec/project.md`. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- Tareas de limpieza e inspección por habitación, con estados, asignación y fecha programada.
- Estado de limpieza **derivado** (fuente única de verdad: las tareas), visible en la habitación y en un panel operativo.
- Incidencias/tickets de mantenimiento por habitación, con cierre que dispara reinspección.
- Bloqueo del check-in por habitación no limpia, apagable por configuración.
- Minimizar el solapamiento de archivos con `add-cross-cutting-features` (se implementan en ramas distintas).

**Non-Goals:**
- Nuevo rol `HOUSEKEEPER` (implicaría tocar auth y la gestión de usuarios ya implementada) ni planificación por cobertura de personal.
- Integración con OTAs ni canales externos, payroll, contratistas de limpieza ni compras de insumos.
- Automatización de asignación de tareas por tipo de habitación o historial de productivity en tiempo real.
- Persistir un snapshot de limpieza en `Room` (ver decisión 1).

## Decisions

- **No tocar `Room.estado`; el estado de limpieza es derivado.** `housekeeping.service.getEstadoLimpieza(roomId)` toma la última tarea no cancelada de la habitación (orden por `fechaProgramada` y luego `actualizadoEn`) y devuelve:
  - `LIMPIA` si la última está `LIMPIA` o `INSPECCION_OK`
  - `EN_PROCESO` si la última está `EN_PROCESO` o `EN_INSPECCION`
  - `SUCIA` si la última está `INSPECCION_FALLA`
  - `PENDIENTE` si la última está `PENDIENTE` o si la habitación no tiene tareas
  - Alternativa A: columna `Room.estadoLimpieza` actualizada por las transiciones → denormalizada, puede quedar desincronizada respecto de las tareas y obliga a escribir en dos modelos.
  - Alternativa B: sumar `LIMPIA`/`SUCIA` a `Room.estado` → mezcla un concepto operativo con el comercial que ya usa `availability.service` y obligaría a revisar los filtros de disponibilidad ya implementados; además es el archivo que peor mergea entre ramas. Descartada.
- **Dos modelos, no un "work order" único:**
  - `HousekeepingTask { id, roomId FK, tipo (LIMPIEZA|LIMPIEZA_PROFUNDA|LINNERIA|INSPECCION), estado, asignadoAId FK User?, fechaProgramada, observaciones?, creadoEn, actualizadoEn }`
  - `MaintenanceTicket { id, roomId FK, tipo (FUGA|AVERIA|ELECTRICA|LIMPIEZA_REACTIVA|OTRO), prioridad (BAJA|MEDIA|ALTA|URGENTE), estado (ABIERTO|EN_PROCESO|RESUELTO|CANCELADO), descripcion, resolucion?, reportadoPorId FK User, asignadoAId FK User?, creadoEn, actualizadoEn, resueltoEn? }`
  - Alternativa: un único modelo con `tipo` discriminante → menos tablas pero mezcla dos ciclos de vida distintos (rutina diaria correctiva vs. incidente con resolución) y duplica estados vacíos. Se separan porque housekeeping y mantenimiento se consultan y auditan por separado.
- **Asignación a `User` sin rol nuevo:** `asignadoAId` referencia `User` (cualquier rol activo). Un `RECEPCIONISTA` puede reclamar una tarea sin asignar, tomarla, completarla e inspeccionar; el `ADMINISTRADOR` además programa tareas, asigna a otro, cancela y gestiona la configuración operativa. Nota: `User.activo = false` impide asignar trabajo (se filtra en el service). Alternativa: rol `HOUSEKEEPER` → obliga a modificar `users`/`auth` ya implementados y a enumerar el rol en varios lugares; se difiere.
- **Transiciones válidas de tarea** (cualquier otra responde `409` con código de conflicto):
  - `PENDIENTE → EN_PROCESO | CANCELADA`
  - `EN_PROCESO → LIMPIA | CANCELADA`
  - `LIMPIA → EN_INSPECCION | CANCELADA`
  - `EN_INSPECCION → INSPECCION_OK | INSPECCION_FALLA`
  - `INSPECCION_FALLA → EN_PROCESO` (re-limpieza)
  - terminales: `INSPECCION_OK`, `CANCELADA`
  La tabla de transiciones vive en `housekeeping.service` (única fuente) y se valida en el service, no en el controller.
- **Bloqueo de check-in por configuración:** `HOUSEKEEPING_BLOCK_CHECKIN` (default `false`) leída en `src/config/housekeepingRules.js`, con el mismo patrón que `src/config/availabilityRules.js`. Con la regla activa, `POST /reservations/{id}/check-in` responde `409` (`HABITACION_NO_LIMPIA`) si el estado derivado no es `LIMPIA`; si está apagada, el check-in se comporta como hoy. Alternativa: tabla `Setting` key-value → otro CRUD y otro módulo; se difiere por coherencia con el resto de reglas ya resueltas por env.
- **Cerrar un ticket genera reinspección:** al pasar un ticket a `RESUELTO` se crea una `HousekeepingTask` de tipo `INSPECCION` para la misma habitación. Es idempotente: si ya existe una `INSPECCION` en `PENDIENTE`/`EN_INSPECCION` para esa habitación, no se crea otra (evita duplicados al reintentar el cierre). Cancelar el ticket no genera reinspección.
- **El ticket no modifica `Room.estado`:** abrir un ticket marca la habitación como "con incidencia" en las consultas, pero poner la habitación en `MANTENIMIENTO` sigue siendo una decisión explícita del administrador (respeta el módulo ya implementado y evita que una incidencia menor saque una habitación de la venta sin que nadie lo decida).
- **Panel e historial:** `GET /housekeeping/tasks` con filtros `estado`, `tipo`, `roomId`, `asignadoAId`, `fecha` y paginación; `GET /housekeeping/resumen` con conteo por estado y carga por asignatario para una fecha (agregaciones con `groupBy`, sin tabla de snapshots); `GET /rooms/{id}/housekeeping` devuelve tareas e incidencias de la habitación ordenadas por fecha descendente.
- **Índices:** `HousekeepingTask`: `@@index([roomId, estado])`, `@@index([estado, fechaProgramada])`, `@@index([asignadoAId, estado])`. `MaintenanceTicket`: `@@index([roomId, estado])`, `@@index([estado, prioridad])`.

## Integration in parallel

Este change se implementa en su rama (`feat/housekeeping-maintenance`) y convive con `add-cross-cutting-features` (`feat/cross-cutting`). Puntos de contacto y cómo resolverlos:

| Punto | Conflicto | Resolución |
| --- | --- | --- |
| `prisma/schema.prisma` | Ambos agregan modelos | Modelos nuevos al final del archivo; migraciones independientes. Al mergear: regenerar migración y correr `npm run prisma:generate` + `npm test`. |
| `src/routes/index.js` | Ambos registran rutas | Altura aditiva (`router.use` nuevos al final); conflicto trivial de merge. |
| `src/docs/index.js` | Ambos agregan bloques de paths | Altura aditiva; misma resolución. |
| `POST /reservations/{id}/check-in` | `reservations` vs. `add-cross-cutting-features` (que no toca reservas) | Solo este change lo modifica; si `add-cross-cutting-features` cambia la misma función, rebasear y reaplicar la regla del check-in (2 líneas). |
| `audit()` de `operations` | Solo existe si pagos/auditoría ya está mergeado | Punto opcional: si no está, se omite; si está, se agregan llamadas en las transiciones de limpieza y en el alta/cierre de tickets. |

## Risks / Trade-offs

- Estado de limpieza derivado ⇒ una consulta extra por habitación (última tarea) → se resuelve con el índice `[roomId, estado]` y, en listados, con `include` de la última tarea; si el volumen lo exige, se cachea por request.
- Derivar `PENDIENTE` para habitaciones sin tareas significa que una habitación recién dada de alta nunca está "limpia" → es el comportamiento deseado para el check-in, y el panel muestra `PENDIENTE` como "sin limpiar" para que la primera limpieza quede agendada.
- La tabla de transiciones hardcodeada en el service no permite flujos a medida por hotel → aceptable para el MVP; un flujo configurable por tipo de habitación se difiere.
- `HOUSEKEEPING_BLOCK_CHECKIN=false` por defecto ⇒ el bloqueo queda desactivado hasta que el hotel lo habilite → deliberado: evita romper el módulo de ciclo de vida ya implementado y sus tests.
- Sin rol `HOUSEKEEPER`, la receptionist también puede limpiar/reclamar tareas → aceptable; el reporte por asignatario permite después medir cargas.

## Migration Plan

1. Crear `HousekeepingTask` y `MaintenanceTicket`; `npm run prisma:migrate -- --name add-housekeeping-and-maintenance` y `npm run prisma:generate`.
2. Implementar `housekeeping.service`/`repository` (tareas, transiciones, derivación del estado de limpieza) y sus endpoints.
3. Implementar `maintenance.service`/`repository` (tickets, cierre con reinspección) y sus endpoints.
4. Integrar el bloqueo de check-in detrás de `HOUSEKEEPING_BLOCK_CHECKIN` y exponer el estado de limpieza en el detalle de habitación.
5. Tests: derivación del estado, transiciones válidas e inválidas (`409`), roles (`403`), bloqueo de check-in con la regla activa y apagada, reinspección idempotente, filtros y paginación, resumen.
6. Rollback: migración anterior; se retiran endpoints y `src/config/housekeepingRules.js`, y el sistema vuelve al estado actual.

## Open Questions

- ¿El resumen de housekeeping debe medir tiempos de ejecución (para cobrar a una empresa de limpieza)? La spec no lo pide; si se pide, se agrega `inicioReal`/`finReal` a la tarea y se calcula en el mismo `GET /housekeeping/resumen`.
- ¿Las tareas de tipo `LINNERIA` llevan conteo de sets (unidades por habitación)? Queda fuera; se modelaría como `cantidad` en la tarea si aparece el requerimiento.