# Proposal: add-availability-rules

## Why

La disponibilidad solo responde a "¿existe una reserva confirmada que solape el rango?". No modela estancia mínima/máxima, ocupación por habitación, tarifas por temporada ni horarios de ingreso/egreso, que son reglas habituales de operación de un hotel.

## What Changes

- Reglas de estancia mínima y máxima (noches) aplicadas en la consulta de disponibilidad y al crear/modificar reservas.
- Filtro de disponibilidad por cantidad de ocupantes, usando la capacidad de la habitación.
- Tarifas diferenciadas por temporada y por día de semana, reflejadas en disponibilidad y en el total de las reservas.
- Horarios de check-in/check-out que afectan la disponibilidad del día (p. ej. late check-out o early check-in).

## Capabilities

### New Capabilities

- `rates`: tarifas por temporada y por día de semana asociadas a un tipo de habitación.

### Modified Capabilities

- `availability`: reglas de estancia mínima/máxima, filtro por cantidad de ocupantes y horarios de check-in/check-out que afectan la disponibilidad.

## Impact

- `prisma/schema.prisma`: nuevos modelos de tarifa/temporada o campos de tarifa por día de semana; posibles campos de horarios de check-in/check-out.
- `availability.service` y `reservation.service`: aplicar reglas y calcular totales con la tarifa vigente.
- Documentación OpenAPI/Swagger.
- El filtro por ocupantes depende del campo `capacidad` de `extend-rooms-management`.