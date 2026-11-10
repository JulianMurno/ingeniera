# Design: extend-reservations-lifecycle

## Context

Ver `proposal.md` — Why. `Reservation` tiene `guestId`, `roomId`, `checkIn`, `checkOut`, `noches`, `total`, `estado` (solo `CONFIRMADA`/`CANCELADA`). La creación valida solapamiento en transacción. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- Ciclo de vida `CONFIRMADA → EN_CURSO → FINALIZADA`, con `CANCELADA` y `NO_SHOW`.
- Ocupantes por reserva con validación contra capacidad, validación temporal (pasado/antelación/duración).
- Código de confirmación único, notas, motivo y multa de cancelación.
- Envío de emails de confirmación/cancelación.

**Non-Goals:**
- Motor de emails robusto (colas, retries, templates renderizadas) ni endpoints de suscripción.

## Decisions

- **Estados:** `estado` pasa a aceptar `CONFIRMADA | EN_CURSO | FINALIZADA | CANCELADA | NO_SHOW`. Máquina de transiciones validada en service (no solo en esquema):
  - `CONFIRMADA → EN_CURSO` (check-in), `EN_CURSO → FINALIZADA` (check-out), `CONFIRMADA → CANCELADA`, `CONFIRMADA → NO_SHOW`. Cualquier otra transición → `409`.
  - Alternativa: estados como enum de Prisma → Prisma en SQLite no soporta enums nativos; se mantiene string con validación central.
- **Nuevos campos en `Reservation`:** `adultos Int @default(1)`, `menores Int @default(0)`, `codigo String @unique`, `notas String?`, `motivoCancelacion String?`, `multaCancelacion Int @default(0)`.
  - `codigo` se genera en service (`HR-` + 6 caracteres aleatorios) con reintento ante colisión.
- **Check-in/Check-out:** nuevos endpoints `POST /reservations/{id}/checkin` y `/checkout`; liberan/ocupan según estado sin tocar la lógica de solapamiento de creación.
- **No-show:** `POST /reservations/{id}/no-show`; libera el rango de la misma forma que la cancelación (se reutiliza la transacción de liberación).
- **Validación temporal:** en `reservation.service` sobre la fecha (sin hora): `checkIn >= hoy`, antelación ≥ `MIN_ADVANCE_NIGHTS`, duración ≤ `MAX_STAY_NIGHTS` (env). Se aplica en create y update. Las reglas de antelación/duración son compartidas con `add-availability-rules` (ambas usan las mismas env).
- **Ocupación/antioverbooking:** al crear/actualizar, el service suma ocupantes de las reservas confirmadas solapadas de la misma habitación y verifica `≤ Room.capacidad`; la confirmación que supere la capacidad → `409`.
- **Notificaciones:** nuevo `notifications.service` con interfaz `sendEmail(to, subject, body)` y transporte configurable:
  - Por defecto en tests/desarrollo: transporte "log" (no requiere SMTP ni nueva dependencia).
  - Con `SMTP_URL` definida: transporte SMTP (se agrega `nodemailer` como dependencia).
  Permite cumplir la spec `notifications` sin romper los tests aislados.

## Risks / Trade-offs

- Comunicación de estado vía string invita a datos corruptos → Mitigación: validación única en `state` helper + transiciones explícitas.
- Enviar emails dentro del request (síncrono) puede hacer lento el create/cancel → Trade-off aceptado; la interfaz permite migrar a cola después.
- `NO_SHOW` como estado terminal fijo pierde el caso "apareció tarde" → Bajo riesgo; puede re-abrirse a `EN_CURSO` en el futuro.

## Migration Plan

1. Agregar campos y ampliar validación de `estado`; `prisma migrate dev --name extend-reservations-lifecycle`.
2. Backfill: asignar `codigo` a reservas existentes (script único de migración de datos).
3. Implementar transiciones (checkin/checkout/no-show), ocupantes y validación temporal en `reservation.service`; `notifications.service` con transporte log/SMTP.
4. Reutilizar la validación de disponibilidad existente (transacción) para las liberaciones.
5. Tests: máquina de estados (transición inválida 409), ocupación vs capacidad, pasado/antelación/duración (422), código único, email en create/cancel.
6. Rollback: migración anterior; los estados nuevos quedan inalcanzables.

## Open Questions

- ¿Multa de cancelación: porcentaje del total o monto fijo, y quién lo configura? Se deja `multaCancelacion` calculable por una fórmula simple (env) sin tocar specs ni diseño.