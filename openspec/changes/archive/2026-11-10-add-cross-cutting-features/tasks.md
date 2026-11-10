# tasks.md â€” add-cross-cutting-features

## 1. Modelo de datos

- [x] 1.1 Crear `Payment { id, reservationId FK, monto Int, metodo, pagadoEn DateTime, createdAt }` y `AuditLog { id, userId FK, accion, recurso, recursoId, detalle String?, createdAt }` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [x] 1.2 Agregar `@@index([pagadoEn])` en `Payment` y `@@index([createdAt])` en `AuditLog`; verificar que la migraciÃ³n los incluye.

## 2. Pagos y factura

- [x] 2.1 Implementar `POST /reservations/{id}/payments` validando `monto > 0`, mÃ©todo y fecha; verificar tests de pago total (`PAGADA`) y pago parcial (saldo pendiente).
- [x] 2.2 Derivar en el detalle de la reserva el estado de pago (`PENDIENTE`/`PARCIAL`/`PAGADA`) y el saldo; verificar test con sumas de pagos.
- [x] 2.3 Implementar `GET /reservations/{id}/invoices` generando la factura a partir de noches, tarifa, total y pagos; verificar tests `200` y `404` para reserva inexistente.

## 3. Reportes

- [x] 3.1 Implementar `GET /reports/ocupacion` con rango de fechas (noches ocupadas y porcentaje); verificar tests `200` y `422` para rango invÃ¡lido.
- [x] 3.2 Implementar `GET /reports/ingresos` sumando pagos por `pagadoEn` en el rango; verificar test `200`.
- [x] 3.3 Implementar `GET /reports/reservas-por-tipo` con desglose por tipo de habitaciÃ³n; verificar test `200`.
- [x] 3.4 Contar solo reservas en estados vigentes (`CONFIRMADA`/`EN_CURSO`/`FINALIZADA`) en los reportes; verificar test de tolerancia a estados del ciclo de vida.

## 4. Salud y auditorÃ­a

- [x] 4.1 Implementar `GET /health` pÃºblico que verifique la base con `SELECT 1`; verificar test `200` y simulaciÃ³n de base caÃ­da con `503`.
- [x] 4.2 Implementar el helper `audit()` y llamarlo en operaciones sensibles (crear/modificar/cancelar reservas y gestionar habitaciones/usuarios); verificar test que registra autor, acciÃ³n, recurso y fecha.
- [x] 4.3 Implementar `GET /audit` (solo `ADMINISTRADOR`) con filtros por usuario/acciÃ³n/rango y paginaciÃ³n; verificar tests `200` y `403` a recepcionista.

## 5. Cierre

- [x] 5.1 Documentar en `src/docs/index.js` los mÃ³dulos de pagos, reportes, salud y auditorÃ­a; verificar que `/api/docs` los refleja.
- [x] 5.2 Actualizar README; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.