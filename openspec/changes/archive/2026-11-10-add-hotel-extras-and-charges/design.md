# Design: add-hotel-extras-and-charges

## Context

Ver `proposal.md` — Why. Hoy el único importe de una reserva es `Reservation.total` (costo de la estadía), y es la base de la factura de `payments` y de los reportes de ingresos de `add-cross-cutting-features`, ninguno de los dos implementado todavía. Este change agrega el consumo de servicios adicionales como información derivada, de modo que ni la estadía ni el ciclo de vida de la reserva cambian. Arquitectura `route → controller → service → repository` con Prisma + SQLite; dinero en enteros en la unidad base de la moneda; roles `ADMINISTRADOR`/`RECEPCIONISTA`. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- Catálogo administrable de servicios adicionales con precio y unidad de cobro.
- Cargos a la reserva con precio congelado, importe calculado y anulación.
- Resumen por reserva (`totalServicios`, `totalGeneral`) y reporte de consumo por período.
- Un solo punto de integración con `add-cross-cutting-features` (desglose de la factura) y solapamiento mínimo de archivos.

**Non-Goals:**
- Facturación fiscal, impuestos, propinas o redondeos por moneda.
- Cobro online / pasarela de pago (los pagos los registra `payments`, manualmente).
- Automatizar cargos por noche (lavandería por noche, minibar por consumo real) o consumos en roomservice desde el check-out: el cargo se registra a mano con su cantidad.
- Inventario de insumos, POS de bar o cuentas abiertas por habitación.
- Reemplazar `Reservation.total`: sigue siendo el costo de la estadía.

## Decisions

- **No tocar `Reservation.total`; los cargos se derivan.** `extra.service.resumenCargos(reservationId)` suma los cargos no anulados y devuelve `totalServicios` y `totalGeneral = reserva.total + totalServicios`.
  - Razón: `total` alimenta la disponibilidad, los pagos (`payments`), la factura y los reportes de ingresos. Si se lo muta con cada cargo, un pago ya registrado pasaría a cubrir conceptos nuevos (el estado de pago derivado quedaría mal calculado) y el reporte de ingresos mezclaría estadía con servicios sin poder separarlos.
  - Alternativa A: persistir `totalServicios` en `Reservation` → desnormalizado, obliga a recalcular en cada alta y anulación y a reparar datos si algo falla a mitad de camino.
  - Alternativa B: recomputar `total` en cada cargo → descartada por lo anterior.
- **`precioUnitario` congelado e `importe` calculado:** `ExtraCharge { id, reservationId FK, extraId FK, cantidad Int, precioUnitario Int, importe Int, estado (PENDIENTE|CANCELADO), nota?, registradoPorId FK User, anuladoPorId FK User?, anuladoEn?, creadoEn }` con `importe = precioUnitario * cantidad`. El precio se copia del catálogo al registrar el cargo (mismo criterio que la tarifa que ya congela la reserva): cambiar el precio del catálogo no altera cargos ya registrados. Alternativa: guardar solo `extraId` y calcular el importe al leer → el histórico de consumo cambiaría de valor sin aviso; descartada.
- **Anulación en lugar de borrado:** el cargo pasa a `CANCELADO` con `anuladoPorId`/`anuladoEn` y deja de sumar. Sigue el mismo criterio que el borrado lógico de huéspedes (`add-guest-management`) y de usuarios (`add-user-management`), y evita que un consumo ya facturado desaparezca del historial.
- **Estados de reserva admitidos:** solo `CONFIRMADA` y `EN_CURSO` admiten cargos nuevos; `CANCELADA`, `FINALIZADA` y `NO_SHOW` responden `409` (el gasto ya está cerrado). Un cargo ya registrado sigue siendo anulable después del check-out, porque el ajuste contable es legítimo; lo que se bloquea es el alta de consumo nuevo.
- **Roles:** el catálogo (`POST`/`PATCH`/`DELETE /extras`) es exclusivo de `ADMINISTRADOR`; el registro y la consulta de cargos admiten `RECEPCIONISTA` (es la tarea de mostrador); anular un cargo requiere `ADMINISTRADOR`. Alternativa: que cualquiera pueda anular → el personal de turno podría borrar consumo ya facturado; descartada.
- **Baja lógica del catálogo:** `DELETE /extras/{id}` marca `activo = false` en lugar de borrar, y un extra inactivo no puede recibir cargos nuevos (`409`). Así el historial sigue siendo interpretable, en línea con `Guest.activo` y `User.activo`.
- **Unidad de cobro informativa:** `unidad` (`NOCHE`|`POR_UNIDAD`|`DIA`|`ESTANCIA`) documenta qué significa `cantidad` (p. ej. `NOCHE` → cantidad = noches consumidas). El sistema no la usa para calcular nada: el importe es siempre `precio × cantidad`. Se evita una fórmula por unidad que el recepcionista tendría que resolver de cabeza.
- **Reporte propio, sin tocar `reports`:** `GET /extras/consumo?desde=&hasta=` agrupa por extra y devuelve el total del período, excluyendo cargos anulados. No se extiende `reports` de `add-cross-cutting-features` para que los dos changes no editen el mismo archivo; cuando ambos estén mergeados, este reporte puede mudarse a `/reports/consumo-extras` sin cambiar el contrato de los datos.
- **Punto único de integración con `payments`:** la factura (`GET /reservations/{id}/invoices`) debe desglosar `totalEstadia` (lo que hoy devuelve de `Reservation.total`) y `totalServicios`. Si `payments` todavía no está, este change funciona igual y la factura sigue usando solo el total de la estadía; la integración es una línea en el builder de factura (`extra.service.resumenCargos`).
- **Detalle de la reserva bajo bandera:** el resumen de cargos aparece en `GET /reservations/{id}` solo con `?incluirCargos=true`, y en cualquier caso está disponible en `GET /reservations/{id}/charges`. Así `reservation.service`/`controller` recibe una modificación mínima (opcional por defecto) y es el punto más fácil de rebasear si otra rama también los toca.
- **Índices:** `HotelExtra @@unique([codigo])`; `ExtraCharge @@index([reservationId, estado])`, `@@index([extraId, creadoEn])`, `@@index([estado])`.
- **Seed del catálogo:** `prisma/seed.js` crea room service, lavandería, minibar, parking y late check-out con precios de ejemplo, siguiendo el patrón de los usuarios sembrados. El late check-out no se cobra automáticamente: `Reservation.lateCheckOut` (de `extend-reservations-lifecycle`) sigue siendo solo una bandera.

## Integration in parallel

Este change se implementa en su rama (`feat/hotel-extras-and-charges`) y convive con `add-cross-cutting-features` (`feat/cross-cutting`) y con `add-housekeeping-and-maintenance` (`feat/housekeeping-maintenance`). Puntos de contacto:

| Punto | Conflicto | Resolución |
| --- | --- | --- |
| `prisma/schema.prisma` | Los tres agregan modelos distintos | Modelos nuevos al final del archivo; migraciones independientes. Al mergear: regenerar migración, `npm run prisma:generate` y `npm test`. |
| `src/routes/index.js` y `src/docs/index.js` | Todos registran rutas y paths | Altura aditiva al final; conflicto trivial de merge. |
| `reservation.controller` / `reservation.service` | `add-cross-cutting-features` agrega pagos/factura y el estado de pago al detalle de la reserva | El resumen de cargos entra bajo `?incluirCargos=true`; si el merge choca, rebasear y volver a sumar el bloque de cargos (unas pocas líneas). |
| `GET /reservations/{id}/invoices` (`payments`) | Solo existe en la rama de `payments` | Integración opcional: desglosar `totalEstadia` + `totalServicios`. Si `payments` aún no está, se deja anotado en README y se integra después. |
| `reports.service` (`payments`) | No se toca | El consumo de extras se expone en `GET /extras/consumo` para no editar el módulo de reportes. |

## Risks / Trade-offs

- Cargos derivados ⇒ el "total a cobrar" no está en un único campo ⇒ mitigación: `totalGeneral` siempre se devuelve junto al detalle de cargos y la factura lo desglosa; no se recalcula al vuelo en la reserva salvo que se pida explícitamente.
- Congelar el precio unitario implica que el catálogo y el historial pueden divergir en el tiempo ⇒ es intencional (reproducibilidad de la factura); el reporte muestra el precio histórico, no el actual.
- Permitir anular después del check-out abre la puerta a ajustes sobre gastos ya facturados ⇒ mitigación: la anulación es auditada cuando `operations` exista y queda registrada con autor y fecha; no se permite editar la cantidad de un cargo existente (se anula y se registra otro).
- Cargar a mano los consumos deja margen de error humano ⇒ mitigación: el importe se calcula en el servidor (nunca lo envía el cliente), el resumen muestra el total y la cantidad de cargos.
- Un endpoint de reportes propio (`/extras/consumo`) duplica estilo de filtros con `reports` ⇒ aceptado para no bloquear el trabajo en paralelo; la unificación queda para cuando ambos changes estén archivados.

## Migration Plan

1. Crear `HotelExtra` y `ExtraCharge`; `npm run prisma:migrate -- --name add-hotel-extras-and-charges` y `npm run prisma:generate`.
2. Agregar el catálogo base al seed (`npm run prisma:seed`) y verificar que sea idempotente.
3. Implementar el CRUD del catálogo para `ADMINISTRADOR` y su lectura para el personal.
4. Implementar el registro de cargos, el listado con resumen y la anulación.
5. Exponer el resumen en el detalle de la reserva bajo `?incluirCargos=true` e implementar `GET /extras/consumo`.
6. Tests: precio congelado ante cambio de catálogo, importe calculado, roles (`403`), reserva no vigente (`409`), anulación excluida del resumen, reporte por período (`200` y `422`), factura desglosada (si `payments` ya está).
7. Rollback: migración anterior; se retiran endpoints y el seed, y el sistema vuelve a cobrar solo la estadía.

## Open Questions

- ¿Los cargos de servicios deben afectar el saldo pendiente y el estado de pago (`PAGADA`/`PARCIAL`) o se cobran aparte? La spec deja el estado de pago ligado al total de la estadía; si el negocio quiere saldo único, hay que migrar `payments` a `totalGeneral` (cambio de un service, con tests de pagos ya escritos).