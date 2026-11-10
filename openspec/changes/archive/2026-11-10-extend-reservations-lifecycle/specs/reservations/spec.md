## ADDED Requirements

### Requirement: Ocupantes por reserva
El sistema SHALL registrar la cantidad de adultos y menores de cada reserva y SHALL verificar que la cantidad total de ocupantes no supere la capacidad de la habitación en el momento de crear o modificar la reserva.

#### Scenario: Ocupantes dentro de capacidad
- **WHEN** se crea o modifica una reserva con una cantidad de ocupantes que no supera la capacidad de la habitación
- **THEN** el sistema la acepta y registra adultos y menores

#### Scenario: Ocupantes que superan la capacidad
- **WHEN** la cantidad de ocupantes supera la capacidad de la habitación
- **THEN** el sistema responde `422` y no crea ni modifica la reserva

### Requirement: Validación temporal de reservas
El sistema SHALL rechazar una reserva cuyo `checkIn` sea anterior a la fecha actual y SHALL aplicar límites de antelación y de duración máxima configurados, respondiendo `422` ante un rango que no los cumpla.

#### Scenario: Reserva en el pasado
- **WHEN** se intenta crear una reserva con `checkIn` anterior a la fecha actual
- **THEN** el sistema responde `422` y no crea la reserva

#### Scenario: Antelación insuficiente
- **WHEN** se intenta crear una reserva con menos antelación que la mínima configurada
- **THEN** el sistema responde `422` y no crea la reserva

#### Scenario: Duración excesiva
- **WHEN** el rango supera la duración máxima configurada
- **THEN** el sistema responde `422` y no crea la reserva

### Requirement: Código de confirmación y notas de la reserva
El sistema SHALL asignar a cada reserva un código de confirmación único y SHALL permitir registrar notas internas y un motivo de cancelación.

#### Scenario: Código asignado
- **WHEN** se crea una reserva
- **THEN** el sistema le asigna un código de confirmación único e incluye las notas provistas

#### Scenario: Notas y motivo de cancelación
- **WHEN** se crea, modifica o cancela una reserva con notas o motivo
- **THEN** el sistema los persiste y los devuelve en el detalle

### Requirement: Check-in de reserva
El sistema SHALL permitir registrar el check-in de una reserva confirmada, pasándola al estado `EN_CURSO`.

#### Scenario: Check-in exitoso
- **WHEN** se registra el check-in de una reserva `CONFIRMADA`
- **THEN** el sistema la pasa a `EN_CURSO`

#### Scenario: Check-in de reserva no confirmada
- **WHEN** se intenta registrar el check-in de una reserva que no está `CONFIRMADA`
- **THEN** el sistema responde `409` y no cambia el estado

### Requirement: Check-out de reserva
El sistema SHALL permitir registrar el check-out de una reserva en curso, pasándola al estado `FINALIZADA`.

#### Scenario: Check-out exitoso
- **WHEN** se registra el check-out de una reserva `EN_CURSO`
- **THEN** el sistema la pasa a `FINALIZADA`

#### Scenario: Check-out de reserva no en curso
- **WHEN** se intenta registrar el check-out de una reserva que no está `EN_CURSO`
- **THEN** el sistema responde `409` y no cambia el estado

### Requirement: Manejo de no-show
El sistema SHALL permitir marcar una reserva confirmada como `NO_SHOW` cuando el huésped no se presenta, liberando el rango.

#### Scenario: Marca de no-show
- **WHEN** se marca como `NO_SHOW` una reserva `CONFIRMADA`
- **THEN** el sistema cambia su estado a `NO_SHOW` y libera el rango

### Requirement: Política antioverbooking
El sistema SHALL impedir confirmar reservas que provoquen una ocupación de la habitación superior a su capacidad para el mismo rango de fechas, rechazando la operación con conflicto.

#### Scenario: Ocupación dentro de capacidad
- **WHEN** la confirmación mantiene a la habitación dentro de su capacidad para el rango
- **THEN** el sistema confirma la reserva

#### Scenario: Exceso de ocupación
- **WHEN** la confirmación supera la capacidad de la habitación para el rango
- **THEN** el sistema responde `409` y no confirma la reserva

## MODIFIED Requirements

### Requirement: Cancelación de reserva
El sistema SHALL permitir cancelar una reserva confirmada, registrando un motivo y una multa si correspondiera, pasándola al estado `CANCELADA` y liberando así el rango para nuevas reservas. Si el id no existe, el sistema responde `404`. Las reservas en estado `EN_CURSO` o `FINALIZADA` SHALL NOT poder cancelarse.

#### Scenario: Cancelación exitosa
- **WHEN** un usuario autenticado cancela `/api/v1/reservations/{id}` de una reserva confirmada
- **THEN** el sistema cambia la reserva a `CANCELADA`, registra motivo y multa y responde confirmando la cancelación

#### Scenario: Cancelación de reserva inexistente
- **WHEN** se intenta cancelar una reserva cuyo id no existe
- **THEN** el sistema responde `404`

#### Scenario: Cancelación de reserva en curso
- **WHEN** se intenta cancelar una reserva en estado `EN_CURSO` o `FINALIZADA`
- **THEN** el sistema responde `409` y no cancela la reserva