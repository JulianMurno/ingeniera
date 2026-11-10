# Proposal: add-hotel-extras-and-charges

## Why

Una reserva solo cubre la estadía: su `total` es el producto de las noches por la tarifa vigente (`business.service` + `rate.service`). En la operación real el huésped consume room service, lavandería, minibar, parking o late check-out, y hoy no hay forma de registrar esos consumos ni de que aparezcan en la factura que genera `add-cross-cutting-features` (derivada del total de la reserva) o en los reportes de ingresos. Los servicios quedan fuera del sistema y la recepción los anota en papel.

## What Changes

- Catálogo de servicios adicionales del hotel (`HotelExtra`) con código, nombre, categoría, precio y unidad de cobro, administrable por el administrador (alta, edición y baja lógica).
- Cargos a la reserva (`ExtraCharge`) con cantidad, precio unitario congelado al momento del cargo e importe calculado; los cargos se anulan, no se borran.
- Resumen por reserva: `totalServicios` (cargos no anulados) y `totalGeneral` (total de la estadía + cargos), sin modificar `Reservation.total`.
- Bloqueo de cargos en reservas fuera de vigencia (canceladas, finalizadas o no presentadas) y anulación de cargos reservada al administrador.
- Consumo de servicios por rango de fechas (importe por servicio y total), expuesto por un endpoint propio del módulo para no tocar `reports` de `add-cross-cutting-features`.
- Punto de integración con la factura de `payments`: el total facturable pasa a ser el desglose `totalEstadia` + `totalServicios`.

## Capabilities

### New Capabilities

- `extras`: catálogo de servicios adicionales del hotel, cargos a la reserva y reporte de consumo por período.

### Modified Capabilities

- `reservations`: la reserva expone el resumen de sus cargos y permite consultar y anularlos.

## Impact

- `prisma/schema.prisma`: nuevos modelos `HotelExtra` y `ExtraCharge` con sus índices. Sin cambios en `Reservation`.
- Nuevo módulo `routes`/`controllers`/`services`/`repositories`/`schemas` de `extras`, registrado en `src/routes/index.js`, y seed del catálogo base en `prisma/seed.js`.
- `reservation.controller`/`reservation.service`: resumen de cargos en el detalle (bajo bandera) y rutas anidadas de cargos.
- Documentación OpenAPI/Swagger (`src/docs/index.js`) y README.
- No depende de `add-cross-cutting-features` para funcionar: el desglose de la factura es un punto de integración opcional. Se puede implementar en paralelo; `design.md` § Integración en paralelo detalla los puntos de contacto con la otra rama.