## Purpose

Permite administrar el catálogo de servicios adicionales del hotel (room service, lavandería, minibar, parking, late check-out) y registrar los consumos de los huéspedes como cargos a su reserva, sin alterar el costo de la estadía.

## ADDED Requirements

### Requirement: Catálogo de servicios adicionales
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` registrar y editar servicios del hotel con código, nombre, categoría, precio y unidad de cobro, y SHALL permitir que el resto del personal autenticado consulte los servicios activos.

#### Scenario: Alta de servicio
- **WHEN** un usuario con rol `ADMINISTRADOR` registra un servicio con datos válidos
- **THEN** el sistema responde `201` con el servicio creado

#### Scenario: Código duplicado
- **WHEN** se registra un servicio con un código ya existente
- **THEN** el sistema responde `409` y no lo crea

#### Scenario: Datos inválidos
- **WHEN** se intenta registrar un servicio con precio no positivo o categoría no válida
- **THEN** el sistema responde `422` y no lo crea

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta registrar un servicio
- **THEN** el sistema responde `403` y no lo crea

#### Scenario: Catálogo visto por el personal
- **WHEN** un usuario con rol `RECEPCIONISTA` consulta el catálogo
- **THEN** el sistema responde `200` con los servicios activos

### Requirement: Baja de servicio
El sistema SHALL desactivar lógicamente un servicio en lugar de eliminarlo y SHALL NOT permitir registrar cargos de un servicio inactivo.

#### Scenario: Baja de servicio
- **WHEN** un usuario con rol `ADMINISTRADOR` da de baja un servicio existente
- **THEN** el sistema lo marca inactivo y lo conserva en el historial

#### Scenario: Cargo de servicio inactivo
- **WHEN** se intenta registrar un cargo de un servicio inactivo
- **THEN** el sistema responde `409` y no registra el cargo

### Requirement: Registro de cargos a la reserva
El sistema SHALL permitir registrar un cargo de un servicio del catálogo a una reserva en estado `CONFIRMADA` o `EN_CURSO`, indicando cantidad y nota opcional, y SHALL calcular el importe como el precio unitario vigente en el momento del cargo multiplicado por la cantidad.

#### Scenario: Cargo registrado
- **WHEN** se registra un cargo de un servicio activo a una reserva en curso
- **THEN** el sistema responde `201` con el importe calculado y el cargo en estado `PENDIENTE`

#### Scenario: Reserva fuera de vigencia
- **WHEN** se intenta registrar un cargo a una reserva `CANCELADA`, `FINALIZADA` o `NO_SHOW`
- **THEN** el sistema responde `409` y no registra el cargo

#### Scenario: Reserva inexistente
- **WHEN** se intenta registrar un cargo a una reserva cuyo id no existe
- **THEN** el sistema responde `404`

#### Scenario: Cantidad inválida
- **WHEN** se intenta registrar un cargo con cantidad menor a 1
- **THEN** el sistema responde `422` y no registra el cargo

#### Scenario: Precio congelado
- **WHEN** se edita el precio de un servicio después de haberlo cargado a una reserva
- **THEN** el importe del cargo ya registrado no cambia

### Requirement: Anulación de cargos
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` anular un cargo, dejando constancia del autor y la fecha de anulación, y SHALL excluir los cargos anulados del resumen de la reserva.

#### Scenario: Cargo anulado
- **WHEN** un usuario con rol `ADMINISTRADOR` anula un cargo
- **THEN** el sistema lo marca `CANCELADO` con autor y fecha, y el resumen deja de incluirlo

#### Scenario: Anulación por recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta anular un cargo
- **THEN** el sistema responde `403` y el cargo conserva su estado

#### Scenario: Cargo inexistente
- **WHEN** se intenta anular un cargo cuyo id no existe
- **THEN** el sistema responde `404`

### Requirement: Resumen de cargos de la reserva
El sistema SHALL exponer los cargos de una reserva junto con el total de servicios no anulados y el total general, que suma el total de la estadía y el total de servicios, y SHALL mantener el total de la reserva como el costo de la estadía.

#### Scenario: Reserva con cargos
- **WHEN** un usuario autenticado consulta los cargos de una reserva
- **THEN** el sistema responde `200` con el listado de cargos, el total de servicios y el total general

#### Scenario: Reserva sin cargos
- **WHEN** se consultan los cargos de una reserva que no tiene cargos registrados
- **THEN** el sistema responde `200` con total de servicios `0` y total general igual al total de la reserva

#### Scenario: Resumen en el detalle de la reserva
- **WHEN** se consulta el detalle de una reserva solicitando incluir los cargos
- **THEN** el sistema responde `200` incluyendo el resumen de cargos de la reserva

#### Scenario: Reserva inexistente
- **WHEN** se consultan los cargos de una reserva cuyo id no existe
- **THEN** el sistema responde `404`

### Requirement: Reporte de consumo de servicios
El sistema SHALL permitir consultar el importe consumido por cada servicio adicional del hotel en un rango de fechas, excluyendo los cargos anulados.

#### Scenario: Consulta de consumo
- **WHEN** un usuario autenticado consulta el consumo de servicios para un rango de fechas
- **THEN** el sistema responde `200` con el importe por servicio y el total del período

#### Scenario: Rango inválido
- **WHEN** el rango consultado es inválido (fecha inicial igual o posterior a la final)
- **THEN** el sistema responde `422`