# Proposal: extend-reservations-lifecycle

## Why

Una reserva solo puede estar `CONFIRMADA` o `CANCELADA`: no existe el ciclo real de una estadía (check-in, en curso, check-out), no se registran los ocupantes, no hay código de confirmación para el huésped ni avisos por email, se pueden crear reservas en el pasado y no se controla el abuso de cancelaciones ni el riesgo de overbooking.

## What Changes

- Nuevos estados del ciclo de vida: `CONFIRMADA → EN_CURSO (check-in) → FINALIZADA (check-out)`, con endpoints para cada transición.
- Manejo de "no-show" (marcar reserva como no presentado) y política antioverbooking.
- Campos de ocupantes (adultos/menores) por reserva.
- Validación de fecha de la reserva (no en el pasado) y límites de antelación y de duración.
- Notas de reserva, motivo y multa de cancelación, y código de confirmación único para el huésped.
- Notificaciones por email en confirmación y cancelación.

## Capabilities

### New Capabilities

- `notifications`: envío de emails de confirmación y cancelación de reservas.

### Modified Capabilities

- `reservations`: ciclo de vida completo (check-in/check-out), manejo de no-show y antioverbooking, ocupantes por reserva, validación de fechas/límites, notas, motivo y multa de cancelación y código de confirmación.

## Impact

- `prisma/schema.prisma`: modelo `Reservation` gana estados adicionales, ocupantes, notas, motivo/multa de cancelación y código de confirmación.
- Nuevos endpoints de transición de estado en `reservation.routes`/`controller`/`service`.
- Documentación OpenAPI/Swagger.
- Los reportes de `add-cross-cutting-features` dependen de estos estados.