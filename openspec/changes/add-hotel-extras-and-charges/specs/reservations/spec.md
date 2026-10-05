## ADDED Requirements

### Requirement: Consulta y anulación de cargos de la reserva
El sistema SHALL exponer los cargos de servicios adicionales registrados contra una reserva, permitir anularlos a un usuario con rol `ADMINISTRADOR` y devolver `404` cuando la reserva o el cargo no existan.

#### Scenario: Consulta de cargos
- **WHEN** un usuario autenticado consulta los cargos de una reserva existente
- **THEN** el sistema responde `200` con los cargos de la reserva

#### Scenario: Anulación de un cargo
- **WHEN** un usuario con rol `ADMINISTRADOR` anula un cargo de una reserva
- **THEN** el sistema lo marca como cancelado y deja constancia del autor y la fecha

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta anular un cargo
- **THEN** el sistema responde `403` y el cargo conserva su estado

#### Scenario: Reserva o cargo inexistente
- **WHEN** se consulta o anula un cargo de una reserva o de un cargo cuyo id no existe
- **THEN** el sistema responde `404`