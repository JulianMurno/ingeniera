# tasks.md — add-hotel-extras-and-charges

> Rama sugerida: `feat/hotel-extras-and-charges`. Se puede implementar en paralelo a `add-cross-cutting-features` y a `add-housekeeping-maintenance`; los puntos de contacto y cómo resolverlos están en `design.md` § Integración en paralelo.

## 1. Modelo de datos y catálogo base

- [ ] 1.1 Crear `HotelExtra { id, codigo @unique, nombre, categoria, precio, unidad, activo, descripcion?, creadoEn }` y `ExtraCharge { id, reservationId FK, extraId FK, cantidad, precioUnitario, importe, estado, nota?, registradoPorId FK User, anuladoPorId FK User?, anuladoEn?, creadoEn }` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [ ] 1.2 Agregar `@@index([reservationId, estado])`, `@@index([extraId, creadoEn])` y `@@index([estado])` en `ExtraCharge`; verificar que la migración los incluye.
- [ ] 1.3 Sembrar en `prisma/seed.js` el catálogo base (room service, lavandería, minibar, parking y late check-out) con precios de ejemplo y sin auto-cargar cargos; verificar que `npm run prisma:seed` corre y que volver a correrlo no duplica entradas.

## 2. Catálogo de servicios (ADMINISTRADOR)

- [ ] 2.1 Implementar `extra.service`/`repository` con el listado del catálogo con filtros `categoria`/`activo` y paginación, donde un usuario con rol `RECEPCIONISTA` solo ve los servicios activos; verificar tests de ambos roles.
- [ ] 2.2 Implementar `POST /extras` y `PATCH /extras/{id}` (solo `ADMINISTRADOR`, `409` por código duplicado, `422` por precio o categoría inválidos); verificar tests `201`, `200`, `403`, `409` y `422`.
- [ ] 2.3 Implementar `DELETE /extras/{id}` como baja lógica (`activo = false`) y verificar que un servicio inactivo no puede recibir cargos nuevos (`409`) ni aparece en el listado del recepcionista.

## 3. Cargos a la reserva

- [ ] 3.1 Implementar `POST /reservations/{id}/charges`: valida que la reserva exista (`404`), que esté en `CONFIRMADA` o `EN_CURSO` (`409`), que el servicio esté activo (`409`), que `cantidad >= 1` (`422`), congela `precioUnitario` desde el catálogo y calcula `importe = precioUnitario * cantidad`; verificar tests del camino feliz y de cada error.
- [ ] 3.2 Implementar `GET /reservations/{id}/charges` con el listado de cargos y el resumen (`totalServicios`, `totalGeneral = reserva.total + totalServicios`); verificar tests con reserva sin cargos (`totalServicios` 0 y `totalGeneral` igual al total), con un cargo y con varios cargos, y `404` para reserva inexistente.
- [ ] 3.3 Implementar la anulación de un cargo con `PATCH /reservations/{id}/charges/{chargeId}` (solo `ADMINISTRADOR`) que lo marca `CANCELADO` con autor y fecha y lo excluye del resumen; verificar tests de `200`, de `403` para `RECEPCIONISTA`, de `404` de cargo inexistente y de que el resumen ya no lo incluye.
- [ ] 3.4 Exponer el resumen de cargos en `GET /reservations/{id}` cuando se envía `?incluirCargos=true` (mínimo cambio en `reservation.controller`/`reservation.service`); verificar test `200` con el resumen presente y `404` para reserva inexistente.
- [ ] 3.5 Verificar que el precio congelado no cambia si después se edita el precio del catálogo; verificar test que compara el importe del cargo con el precio original.

## 4. Reporte de consumo e integración

- [ ] 4.1 Implementar `GET /extras/consumo?desde=&hasta=` con importe por servicio y total del período, excluyendo cargos anulados; verificar tests `200`, `422` para rango inválido y que un cargo anulado no sume.
- [ ] 4.2 (Opcional, solo si `add-cross-cutting-features` ya está mergeado) desglosar `totalEstadia` y `totalServicios` en `GET /reservations/{id}/invoices`; verificar test que comprueba el desglose. Si no está mergeado, dejarlo anotado en el README como punto de integración pendiente.
- [ ] 4.3 (Opcional, solo si `add-cross-cutting-features` ya está mergeado) llamar `audit()` al registrar y anular un cargo; verificar un test de auditoría. Si no está mergeado, omitir la tarea.

## 5. Cierre

- [ ] 5.1 Documentar en `src/docs/index.js` el catálogo, los endpoints de cargos, el reporte de consumo y el parámetro `?incluirCargos`; verificar que `/api/docs` los refleja.
- [ ] 5.2 Actualizar README con el flujo de consumo (registrar → anular → facturar) y el punto de integración pendiente con la factura; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.