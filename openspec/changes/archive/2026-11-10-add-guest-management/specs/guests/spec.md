## ADDED Requirements

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

## MODIFIED Requirements

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