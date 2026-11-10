# Design: add-cross-cutting-features

## Context

Ver `proposal.md` — Why. El sistema gestiona reservas pero no tiene pagos/factura, reportes, health check ni auditoría. La arquitectura es `route → controller → service → repository` con Prisma+SQLite. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- Módulo de pagos vinculados a reservas y factura derivada.
- Reportes de ocupación, ingresos y reservas por tipo de habitación.
- `GET /health` y registro/consulta de auditoría (admin).

**Non-Goals:**
- Pasarela de pago externa (el pago se registra manualmente).
- Facturación fiscal completa (AFIP/CFDI) ni numeración por ente regulador; la numeración es local.
- Dashboards en tiempo real.

## Decisions

- **Pagos — nuevo modelo `Payment`:** `{ id, reservationId FK, monto Int, metodo (EFECTIVO|TARJETA|TRANSFERENCIA), pagadoEn DateTime, createdAt }`. Dinero en enteros (unidad base), igual que `Reservation.total`.
- **Factura derivada, no almacenada:** se genera bajo demanda a partir de la reserva (noches, tarifa aplicada, total) y sus pagos acumulados. `Invoice` no es tabla; `GET /reservations/{id}/invoices` arma el documento.
  - Alternativa A: tabla `Invoice` persistida y numeración secuencial al emitir → aporta cifrado contable, pero agrega estado y races de número. Se difiere; design simple por ahora.
- **Estado de pago derivado:** `PENDIENTE` si pagos = 0, `PARCIAL` si 0 < pagos < total, `PAGADA` si pagos ≥ total. No hay columna; se calcula al serializar la reserva.
- **Reportes — queries de agregación:** `reports.service/repository` usando `prisma.groupBy` / agregaciones SQL:
  - Ocupación: sumar noches de reservas en rango (considerando estados) sobre el total de habitaciones-noche.
  - Ingresos: suma de `Payment.pagadoEn` en el rango (y opcionalmente por reserva).
  - Por tipo: `groupBy room.tipo` para reservas en el rango.
  Endpoints `GET /reports/ocupacion`, `/reports/ingresos`, `/reports/reservas-por-tipo` con `checkIn`/`checkOut`.
- **Health check:** `GET /health` público (sin auth) que ejecuta `SELECT 1` contra la base vía Prisma (`$queryRaw`); `200 { status: 'ok', db: 'ok' }` o `503` con el componente afectado. No toca servicios.
- **Auditoría — modelo `AuditLog`:** `{ id, userId FK, accion, recurso, recursoId, detalle (JSON string), createdAt }`. Middleware/helper `audit()` invocado en las operaciones sensibles (crear/modificar/cancelar reservas; alta/edición/borrado de habitaciones y usuarios). `GET /audit` (admin) con filtros por usuario/acción/rango de fechas y paginación.
  - Alternativa: trigger de BD o evento externo → menos portable en SQLite y sin trazabilidad del actor para writes directos. Se elige captura en capa de servicio.
- **Dependencia entre modules:** los reportes usarán los estados del ciclo de vida (`extend-reservations-lifecycle`); se diseña la query tolerante a estados (solo cuenta confirmadas/en_curso/finalizadas).

## Risks / Trade-offs

- Factura derivada sin numeración persistente → Si el negocio exige numeración continua, migrar a tabla `Invoice`; costo moderado.
- Ingresos por `pagadoEn` pueden diferir del período de la reserva → Decisión explícita: los ingresos se reportan por fecha de cobro (métrica financiera estándar).
- Auditoría síncrona en el request agrega latencia → Aceptado; escritura simple, sin colas.
- Falta de índice en `Payment.pagadoEn` y `AuditLog.createdAt` degrada rangos grandes → Agregar `@@index([pagadoEn])` y `@@index([createdAt])`.

## Migration Plan

1. Crear `Payment` y `AuditLog`; `prisma migrate dev --name add-cross-cutting-features`.
2. Implementar `payment service/repository`, endpoints de pagos y generación de factura.
3. Implementar `reports.service/repository` y rutas; `health` en `app.js` antes del router de API.
4. Insertar llamadas `audit()` en los services sensibles.
5. Tests: pago total/parcial, estado derivado, reportes (ocupación/ingresos/por tipo), health 200/503, auditoría con roles.
6. Rollback: migración anterior; módulos quedan sin tablas y se retiran endpoints.

## Open Questions

- ¿Reembolsos? La spec cubre pagos positivos; reembolso (pago negativo) puede sumarse como un `metodo: REEMBOLSO` sin tocar specs.