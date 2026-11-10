# Proposal: add-cross-cutting-features

## Why

El sistema registra reservas pero no cobra, no factura ni informa sobre la operación, y no tiene health check ni trazabilidad de los cambios realizados por el personal. Como está, no puede sostener la operación diaria ni auditarse.

## What Changes

- **Pagos**: registro de pagos vinculados a una reserva (parcial/total, método y fecha) y generación de factura.
- **Reportes/estadísticas**: ocupación, ingresos y reservas por tipo de habitación en un rango de fechas.
- **Health check**: endpoint `GET /health` que reporta estado de la API y de la base de datos.
- **Auditoría**: registro de operaciones sensibles (quién y qué cambió en reservas, habitaciones y usuarios).

## Capabilities

### New Capabilities

- `payments`: pagos y facturación asociados a reservas.
- `reports`: reportes de ocupación, ingresos y reservas por tipo de habitación.
- `operations`: health check y auditoría de operaciones sensibles.

### Modified Capabilities

Ninguna.

## Impact

- `prisma/schema.prisma`: nuevos modelos `Payment`/`Invoice` y `AuditLog`.
- Nuevos módulos de `routes`/`controllers`/`services` y middleware de auditoría.
- Documentación OpenAPI/Swagger.
- Los reportes dependen de los estados del ciclo de vida de `extend-reservations-lifecycle`.