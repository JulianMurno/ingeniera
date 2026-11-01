## ADDED Requirements

### Requirement: Vinculación de cuenta de huésped con ficha existente
El sistema SHALL vincular una cuenta de huésped a exactamente una ficha `Guest` activa. En el registro de autoservicio, cuando el DNI y el email coincidan con una ficha activa que no tenga cuenta, el sistema SHALL asociar la cuenta a esa ficha. Cuando no exista coincidencia, el sistema SHALL crear una ficha nueva con los datos del registro.

#### Scenario: Ficha existente reclamada
- **WHEN** un visitante se registra con el DNI y el email de una ficha activa sin cuenta
- **THEN** el sistema asocia la nueva cuenta a esa ficha y conserva el historial de reservas de la ficha

#### Scenario: Datos que no coinciden con una ficha existente
- **WHEN** un visitante se registra con un DNI o email que no coincide con ninguna ficha activa
- **THEN** el sistema crea una ficha nueva y la vincula a la cuenta

#### Scenario: Coincidencia parcial con una ficha existente
- **WHEN** el DNI coincide con una ficha existente pero el email no, o el email coincide pero el DNI no
- **THEN** el sistema no reclama la ficha existente y responde `409` sin crear ni duplicar datos

### Requirement: Unicidad de cuenta por huésped
El sistema SHALL impedir que una misma ficha de huésped tenga más de una cuenta y que un mismo email o DNI se use en más de una cuenta. Las violaciones SHALL rechazarse con `409` sin crear ni modificar fichas.

#### Scenario: Ficha ya vinculada a otra cuenta
- **WHEN** se intenta registrar una cuenta para una ficha que ya tiene una cuenta asociada
- **THEN** el sistema responde `409` y no crea la cuenta

#### Scenario: Email o DNI duplicado entre cuentas
- **WHEN** se intenta registrar una cuenta con un email o DNI ya usado por otra cuenta
- **THEN** el sistema responde `409` y no crea la cuenta

### Requirement: Alcance de datos del huésped autenticado
El sistema SHALL limitar el acceso de una cuenta de huésped a su propia ficha y a sus propias reservas. Un huésped SHALL NOT poder listar, consultar ni modificar fichas de otros huéspedes.

#### Scenario: Huésped consulta su propia ficha
- **WHEN** un huésped autenticado consulta los datos de su cuenta
- **THEN** el sistema responde `200` con su propia ficha, sin exponer datos de otros huéspedes

#### Scenario: Huésped intenta listar huéspedes
- **WHEN** un huésped autenticado invoca el listado o el detalle de huéspedes del panel de personal
- **THEN** el sistema responde `403` y no devuelve datos personales de otros huéspedes
