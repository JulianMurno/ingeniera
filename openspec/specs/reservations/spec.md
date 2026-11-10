# Reservations Specification

## Purpose

Permite al personal del hotel crear, consultar, modificar y cancelar reservas, garantizando que no se solapen y que los datos financieros y de duración se calculen correctamente a partir de las fechas.

## Requirements

### Requirement: Creación de reserva con verificación de disponibilidad
El sistema SHALL permitir crear una reserva (habitación, huésped, rango `[checkIn, checkOut)` y estado `CONFIRMADA`) verificando que la habitación esté disponible en el rango. Si existe una reserva confirmada que se solapa, el sistema responde `409`. El cálculo de noches y total se realiza a partir de las fechas y la tarifa de la habitación, y la verificación de disponibilidad con el alta ocurren dentro de una misma transacción.

#### Scenario: Reserva exitosa
- **WHEN** un usuario autenticado envía un rango válido y no conflictivo a `/api/v1/reservations`
- **THEN** el sistema crea la reserva en estado `CONFIRMADA`, calcula noches y total, y responde `201` con el detalle

#### Scenario: Solapamiento rechazado
- **WHEN** el rango solicitado se solapa con una reserva confirmada existente de la misma habitación
- **THEN** el sistema responde `409` con un código de conflicto y no crea la reserva

#### Scenario: Recambio el mismo día permitido
- **WHEN** el `checkIn` de la nueva reserva coincide con el `checkOut` de una reserva confirmada existente de la misma habitación
- **THEN** el sistema crea la reserva correctamente

### Requirement: Validación de la reserva
El sistema SHALL validar los datos de entrada de la reserva (fechas presentes y con `checkIn < checkOut`, huésped y habitación existentes) antes de crearla, respondiendo `422` ante datos inválidos.

#### Scenario: Rango de fechas inválido
- **WHEN** se envía una reserva con `checkIn` igual o posterior a `checkOut`
- **THEN** el sistema responde `422` y no crea la reserva

### Requirement: Listado de reservas con filtros y paginación
El sistema SHALL permitir listar reservas con filtros por DNI del huésped, `roomId`, fecha, estado y `guestId`, soportando paginación.

#### Scenario: Listado con filtros
- **WHEN** un usuario autenticado consulta `/api/v1/reservations` con filtros y paginación
- **THEN** el sistema responde `200` con las reservas coincidentes y los datos de paginación

### Requirement: Consulta de reserva por id
El sistema SHALL permitir obtener una reserva puntual por su id. Si el id no existe, el sistema responde `404`.

#### Scenario: Detalle existente
- **WHEN** un usuario autenticado consulta `/api/v1/reservations/{id}` de una reserva existente
- **THEN** el sistema responde `200` con el detalle de la reserva

#### Scenario: Detalle inexistente
- **WHEN** un usuario autenticado consulta `/api/v1/reservations/{id}` de una reserva que no existe
- **THEN** el sistema responde `404`

### Requirement: Modificación de reserva con revalidación
El sistema SHALL permitir modificar una reserva, recalculando noches y total, y revalidando la disponibilidad de la habitación para el nuevo rango (excluyendo la propia reserva). Un nuevo rango que se solape con otra reserva confirmada se rechaza con `409`. La revalidación y la escritura ocurren dentro de una misma transacción.

#### Scenario: Modificación válida
- **WHEN** un usuario autenticado modifica fechas u otro campo de una reserva sin generar solapamiento
- **THEN** el sistema recalcula noches y total, aplica los cambios y responde con la reserva actualizada

#### Scenario: Modificación con conflicto
- **WHEN** el cambio de rango se solapa con otra reserva confirmada de la misma habitación
- **THEN** el sistema responde `409` y no aplica la modificación

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

### Requirement: Alta de reserva por huésped con reglas compartidas
El sistema SHALL permitir que un huésped autenticado cree una reserva para una habitación disponible dentro de un rango `[checkIn, checkOut)`. El alta SHALL ejecutarse con el mismo cálculo de noches, tarifas, capacidad y detección de solapamiento que las reservas creadas por `RECEPCIONISTA` o `ADMINISTRADOR`, y SHALL ocurrir dentro de una transacción. La reserva creada por el huésped SHALL quedar en estado `CONFIRMADA` y recibir su código de confirmación.

#### Scenario: Reserva de huésped exitosa
- **WHEN** un huésped autenticado envía un rango válido y no conflictivo para una habitación disponible
- **THEN** el sistema crea la reserva en estado `CONFIRMADA`, calcula noches y total con las mismas reglas del personal y responde `201`

#### Scenario: Solapamiento detectado
- **WHEN** el rango solicitado por el huésped se solapa con otra reserva confirmada de la misma habitación
- **THEN** el sistema responde `409` y no crea la reserva

#### Scenario: Capacidad excedida
- **WHEN** la cantidad de adultos y menores supera la capacidad de la habitación elegida
- **THEN** el sistema responde `422` y no crea la reserva

#### Scenario: Huésped intenta reservar para otra persona
- **WHEN** un huésped autenticado envía un `guestId` distinto al de su propia ficha
- **THEN** el sistema responde `403` y no crea la reserva

### Requirement: Sincronización de reservas entre portal y panel del personal
El sistema SHALL almacenar en una única fuente las reservas creadas por huéspedes y por el personal. Una reserva creada desde el portal SHALL ser visible de inmediato para `RECEPCIONISTA` y `ADMINISTRADOR` con los mismos filtros, estados y operaciones de ciclo de vida que las reservas creadas desde el panel.

#### Scenario: Reserva del portal visible en el panel
- **WHEN** un huésped crea una reserva desde el portal
- **THEN** la reserva aparece en el listado y el detalle del panel del personal sin pasos adicionales

#### Scenario: Reserva del personal visible para el huésped
- **WHEN** el personal crea una reserva para la ficha de un huésped que tiene cuenta
- **THEN** esa reserva aparece en "Mis reservas" del huésped

#### Scenario: Ciclo de vida compartido
- **WHEN** el personal ejecuta check-in, check-out, no-show o cancelación sobre una reserva creada desde el portal
- **THEN** el sistema aplica las mismas transiciones y reglas que sobre una reserva creada desde el panel

### Requirement: Visibilidad de reservas según el actor
El sistema SHALL permitir que el personal consulte y opere sobre todas las reservas, y SHALL limitar al huésped a consultar y operar únicamente sobre las reservas vinculadas a su propia ficha. Un huésped que intente acceder a una reserva ajena SHALL recibir `404`.

#### Scenario: Personal consulta cualquier reserva
- **WHEN** un usuario con rol `RECEPCIONISTA` o `ADMINISTRADOR` consulta el listado o el detalle de reservas
- **THEN** el sistema responde `200` con las reservas solicitadas, incluidas las creadas por huéspedes

#### Scenario: Huésped consulta sus reservas
- **WHEN** un huésped autenticado consulta el listado o el detalle de reservas
- **THEN** el sistema responde `200` solo con las reservas vinculadas a su ficha

#### Scenario: Huésped consulta una reserva ajena
- **WHEN** un huésped autenticado solicita el detalle de una reserva que no le pertenece
- **THEN** el sistema responde `404` sin revelar su existencia ni sus datos

### Requirement: Cancelación de reserva por el huésped propietario
El sistema SHALL permitir que un huésped cancele una reserva propia en estado `CONFIRMADA`, aplicando la misma regla de multa por cancelación y la misma notificación que el personal. Un huésped SHALL NOT poder cancelar una reserva ajena ni una reserva en un estado que no admita la transición a `CANCELADA`.

#### Scenario: Cancelación propia exitosa
- **WHEN** un huésped cancela una reserva propia en estado `CONFIRMADA`
- **THEN** el sistema la pasa a `CANCELADA`, calcula la multa con la regla vigente, libera el rango y responde confirmando la cancelación

#### Scenario: Cancelación de una reserva ajena
- **WHEN** un huésped intenta cancelar una reserva que no le pertenece
- **THEN** el sistema responde `404` y no modifica la reserva

#### Scenario: Cancelación de una reserva en estado no cancelable
- **WHEN** un huésped intenta cancelar una reserva propia que ya está `CANCELADA`, `FINALIZADA` o `NO_SHOW`
- **THEN** el sistema responde `409` y no cambia su estado

### Requirement: Check-in condicionado a la limpieza de la habitación
El sistema SHALL permitir deshabilitar el registro del check-in de una reserva cuya habitación no esté limpia cuando la configuración de bloqueo de limpieza esté activa, respondiendo `409` con un código que identifique el motivo.

#### Scenario: Check-in bloqueado por habitación no limpia
- **WHEN** la configuración de bloqueo está activa y se registra el check-in de una reserva cuya habitación tiene estado de limpieza distinto de `LIMPIA`
- **THEN** el sistema responde `409` con el código de habitación no limpia y la reserva permanece en `CONFIRMADA`

#### Scenario: Check-in de habitación limpia
- **WHEN** la configuración de bloqueo está activa y la habitación de la reserva está en estado de limpieza `LIMPIA`
- **THEN** el sistema registra el check-in y pasa la reserva a `EN_CURSO`

#### Scenario: Regla desactivada
- **WHEN** la configuración de bloqueo está desactivada
- **THEN** el sistema registra el check-in de la reserva sin evaluar el estado de limpieza de la habitación

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