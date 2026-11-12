# Design: add-availability-rules

## Context

Ver `proposal.md` — Why. Hoy la disponibilidad es solo "no existe reserva confirmada que solape"; la tarifa es única por habitación. Requiere el campo `capacidad` de `extend-rooms-management`. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- Reglas de estancia mínima/máxima en disponibilidad y reservas.
- Filtro por ocupantes (basado en `capacidad`).
- Tarifas por temporada y por día de semana con cálculo del total por noches.
- Horarios de check-in/check-out que afecten la disponibilidad del día.

**Non-Goals:**
- Motor de tarifas dinámico (promociones, descuentos por antelación) ni contratos por canal.

## Decisions

- **Configuración de reglas por entorno (env):** `MIN_STAY_NIGHTS`, `MAX_STAY_NIGHTS`, `CHECK_IN_HOUR`, `CHECK_OUT_HOUR`.
  - Alternativa: tabla `Setting` key-value → más "configurable por admin" pero agrega otro CRUD; se difiere. Env es suficiente para el MVP y testeable con variables aisladas por test.
- **Tarifas — nuevos modelos:**
  - `Season { id, roomType, fechaInicio, fechaFin, tarifa }` (temporada base por tipo).
  - `WeekdayRate { id, roomType, diaSemana (0-6), tarifa }` (override por día).
  - Tarifa efectiva por noche: override `WeekdayRate` > temporada vigente > `Room.tarifa`. Sin superposición de temporadas (validación en service + índice compuesto).
  - Alternativa A: un solo modelo con JSON de overrides por temporada → menos consultas pero difícil de validar/consultar por día.
  - Alternativa B: precio por fecha precomputado → inflexible; descartada.
- **Cálculo del total:** `reservation.service` deja de usar `Room.tarifa` directa y agrega `getTarifaNoche(roomType, fecha)` por noche sobre el rango (nuevo `rate.service`). `business.service` (noches/total) se extiende para recibir la tarifa por noche.
- **Horarios en disponibilidad:** con fechas a granularidad de día, el horario solo importa en el día compartido:
  - Un `checkOut` posterior a `CHECK_OUT_HOUR` (late check-out) impide el check-in de otro huésped esa misma fecha.
  - Un `checkIn` anterior a `CHECK_IN_HOUR` (early check-in) impide el check-out de la noche anterior esa misma fecha.
  Se modela ampliando el predicado de solapamiento para considerar el turno del día, manteniendo el recambio estándar permitido.
- **Estancia y ocupantes:** en `validate()` de producción se valida `noches` contra min/max (sin duplicar la regla: `business.service` calcula noches una sola vez) y en la consulta de disponibilidad/creación se filtra por `capacidad >= ocupantes`.

## Risks / Trade-offs

- Precedencia de tarifas (día de semana vs temporada) es una regla de negocio con impacto financiero → Mitigación: centralizada en `rate.service` y cubierta con tests unitarios por día.
- Horarios del día añaden bordes al solapamiento → El predicado se extiende con pruebas específicas para early/late y recambio normal.
- Depende de `capacidad` (otro change) → Si se implementa antes, hay que backfill `capacidad=1` en los datos para no romper.
- Env como configuración impide cambiar reglas en runtime → Aceptado para MVP (relanzar para aplicar).

## Migration Plan

1. Agregar `estado`/`capacidad` para dosificar: primero merge de `extend-rooms-management`.
2. Crear `Season` y `WeekdayRate`; `prisma migrate dev --name add-availability-rules`.
3. Implementar `rate.service`, extender `business.service` y ajustar `availability.service`/`reservation.service`.
4. Tests: precedencia de tarifa, estancia min/max (422), ocupación vs capacidad, early/late check-out, recambio permitido.
5. Rollback: migración anterior; sin `Season`/`WeekdayRate` el sistema vuelve a `Room.tarifa`.

## Open Questions

- ¿Los límites de estancia aplican también al `PATCH` de reservas? La spec lo deja ambiguo; si aplica, la revalidación usa las mismas reglas (mismo service, bajo costo).