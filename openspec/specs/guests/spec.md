# Guests Specification

## Purpose

Permite al personal del hotel registrar y consultar los huéspedes, garantizando la unicidad del DNI y la validez del email y dando soporte a los datos utilizados por las reservas.

## Requirements

### Requirement: Alta de huésped
El sistema SHALL permitir registrar un huésped con sus datos personales, validando el formato del email, el formato del DNI, la longitud del teléfono y la unicidad del DNI. El DNI duplicado se rechaza con conflicto.

#### Scenario: Alta exitosa
- **WHEN** un usuario autenticado envía datos válidos de un huésped a `/api/v1/guests`
- **THEN** el sistema crea el huésped y responde `201` con sus datos

#### Scenario: DNI duplicado
- **WHEN** se intenta registrar un huésped con un DNI ya existente
- **THEN** el sistema responde `409` con un código de conflicto y no crea el huésped

#### Scenario: Datos inválidos
- **WHEN** se envían datos inválidos (p. ej. email malformado, DNI con formato incorrecto, teléfono con longitud inválida o campos obligatorios faltantes)
- **THEN** el sistema responde `422` con el detalle de la validación y no crea el huésped

### Requirement: Listado de huéspedes con filtros
El sistema SHALL permitir consultar el listado de huéspedes, con filtros por DNI y por nombre y soporte de paginación, devolviendo los resultados coincidentes.

#### Scenario: Listado con filtros
- **WHEN** un usuario autenticado consulta `/api/v1/guests` con filtros de DNI y/o nombre
- **THEN** el sistema responde `200` con los huéspedes que coinciden con los filtros

#### Scenario: Listado paginado
- **WHEN** un usuario autenticado consulta `/api/v1/guests` indicando página y tamaño de página
- **THEN** el sistema responde `200` con la página solicitada y los datos de paginación

### Requirement: Consulta de huésped por id
El sistema SHALL permitir obtener un huésped puntual por su id. Si el id no existe, el sistema responde `404`.

#### Scenario: Detalle existente
- **WHEN** un usuario autenticado consulta `/api/v1/guests/{id}` de un huésped existente
- **THEN** el sistema responde `200` con los datos del huésped

#### Scenario: Detalle inexistente
- **WHEN** un usuario autenticado consulta `/api/v1/guests/{id}` de un huésped que no existe
- **THEN** el sistema responde `404` con un error de recurso no encontrado

### Requirement: Edición de huésped
El sistema SHALL permitir a un usuario autenticado modificar los datos de un huésped existente, revalidando el formato del email y la unicidad del DNI si cambian. Si el huésped no existe, el sistema responde `404`.

#### Scenario: Edición exitosa
- **WHEN** un usuario autenticado actualiza `/api/v1/guests/{id}` con datos válidos
- **THEN** el sistema aplica los cambios y responde con los datos actualizados

#### Scenario: Edición con DNI duplicado
- **WHEN** la edición asigna un DNI que ya pertenece a otro huésped
- **THEN** el sistema responde `409` y no aplica el cambio

#### Scenario: Edición inexistente
- **WHEN** se intenta modificar un huésped cuyo id no existe
- **THEN** el sistema responde `404`

### Requirement: Borrado de huésped
El sistema SHALL permitir eliminar un huésped mediante borrado lógico, conservando el historial de reservas asociado. Si el huésped no existe, el sistema responde `404`.

#### Scenario: Borrado autorizado
- **WHEN** un usuario autenticado elimina `/api/v1/guests/{id}` de un huésped existente
- **THEN** el sistema lo marca como eliminado y responde confirmando la eliminación

#### Scenario: Borrado inexistente
- **WHEN** se intenta eliminar un huésped cuyo id no existe
- **THEN** el sistema responde `404`

#### Scenario: Huésped con reservas conserva historial
- **WHEN** se elimina un huésped que tiene reservas asociadas
- **THEN** las reservas se mantienen y el sistema no las borra

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
