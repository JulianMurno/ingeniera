## ADDED Requirements

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
