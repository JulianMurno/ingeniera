## Purpose

Permite que un huésped se registre e inicie sesión para consultar disponibilidad, crear reservas y gestionar únicamente sus propias reservas desde un portal de autoservicio, sincronizado con el panel de recepción y administración.

## ADDED Requirements

### Requirement: Registro de huésped en el portal
El sistema SHALL ofrecer un registro de autoservicio donde el visitante ingresa nombre, email, DNI, teléfono opcional y contraseña. El registro SHALL validar el formato del email, el DNI y la contraseña, SHALL vincular la cuenta a una ficha de huésped activa cuando DNI y email coincidan, y SHALL crear una ficha nueva cuando no exista coincidencia, sin duplicar fichas. Un email o DNI ya asociado a otra cuenta SHALL rechazarse con `409` y los datos inválidos con `422`.

#### Scenario: Registro exitoso sin ficha previa
- **WHEN** un visitante envía datos válidos y no existe una ficha ni una cuenta previa con ese DNI o email
- **THEN** el sistema crea la ficha de huésped, crea la cuenta con rol `HUESPED` y responde `201` con la sesión iniciada

#### Scenario: Registro que reclama una ficha existente
- **WHEN** un visitante se registra con el DNI y el email de una ficha de huésped activa que aún no tiene cuenta
- **THEN** el sistema vincula la nueva cuenta a esa ficha y no crea un huésped duplicado

#### Scenario: Email o DNI ya registrado
- **WHEN** el email o el DNI enviados ya pertenecen a otra cuenta de huésped
- **THEN** el sistema responde `409` y no crea la cuenta

#### Scenario: Datos de registro inválidos
- **WHEN** el visitante envía un email malformado, un DNI inválido o una contraseña que no cumple el mínimo
- **THEN** el sistema responde `422` con el detalle de la validación y no crea la cuenta

### Requirement: Inicio de sesión y sesión del huésped
El sistema SHALL permitir que un huésped se autentique con su email y contraseña y reciba un token JWT que lo identifica como `HUESPED` y referencia su ficha de huésped. Las credenciales inválidas SHALL rechazarse con `401` sin emitir token.

#### Scenario: Login de huésped exitoso
- **WHEN** un huésped envía credenciales válidas al inicio de sesión del portal
- **THEN** el sistema responde `200` con un token que contiene el rol `HUESPED` y el identificador de su ficha de huésped

#### Scenario: Credenciales de huésped inválidas
- **WHEN** un huésped envía un email o una contraseña incorrectos
- **THEN** el sistema responde `401` y no emite token

### Requirement: Navegación del portal de huésped
El sistema SHALL mostrar al huésped autenticado un portal con las secciones de disponibilidad y nueva reserva, "Mis reservas" y cierre de sesión. El portal SHALL NOT exponer las vistas de gestión del personal (huéspedes, habitaciones, tarifas, limpieza, mantenimiento, extras, consumo, reportes, usuarios ni auditoría).

#### Scenario: Portal de huésped autenticado
- **WHEN** un huésped inicia sesión correctamente
- **THEN** el sistema lo dirige a su portal y muestra solo las secciones de reserva y "Mis reservas"

#### Scenario: Visitante sin sesión
- **WHEN** un visitante sin sesión intenta acceder a una vista de reserva o "Mis reservas" del portal
- **THEN** el sistema lo redirige al inicio de sesión del huésped

#### Scenario: Personal del hotel en el portal
- **WHEN** un usuario con rol `RECEPCIONISTA` o `ADMINISTRADOR` inicia sesión
- **THEN** el sistema lo dirige al panel de gestión de siempre, sin exponer el registro de huéspedes

### Requirement: Consulta de disponibilidad y alta de reserva en el portal
El sistema SHALL permitir al huésped autenticado consultar las habitaciones disponibles para un rango `[checkIn, checkOut)` y, opcionalmente, un tipo de habitación, y crear una reserva eligiendo una habitación disponible, indicando fechas, adultos, menores y notas. La consulta y el alta SHALL usar las mismas reglas de disponibilidad, tarifas, capacidad, fechas y solapamiento que el panel del personal.

#### Scenario: Consulta de disponibilidad con resultados
- **WHEN** el huésped consulta un rango válido con habitaciones libres
- **THEN** el sistema responde `200` con las habitaciones disponibles y su tarifa

#### Scenario: Reserva creada desde el portal
- **WHEN** el huésped confirma una reserva con una habitación disponible y un rango válido
- **THEN** el sistema crea la reserva en estado `CONFIRMADA`, calcula noches y total, la registra con su código de confirmación y responde `201`

#### Scenario: Rango inválido o en el pasado
- **WHEN** el huésped envía un `checkIn` igual o posterior al `checkOut`, o un `checkIn` en el pasado
- **THEN** el sistema responde `422` y no crea la reserva

#### Scenario: Habitación no disponible o sobreocupada
- **WHEN** la habitación elegida se solapa con otra reserva confirmada o la ocupación supera su capacidad
- **THEN** el sistema responde `409` y no crea la reserva

#### Scenario: Huésped sin sesión intenta reservar
- **WHEN** un visitante sin token válido intenta crear una reserva
- **THEN** el sistema responde `401` y no crea la reserva

### Requirement: Mis reservas del huésped
El sistema SHALL mostrar al huésped autenticado la lista de sus propias reservas con código, habitación, rango de fechas, ocupantes, total y estado, y SHALL permitirle consultar el detalle y cancelar sus propias reservas. El huésped SHALL NOT poder ver ni operar sobre reservas de otros huéspedes; un intento de acceder a una reserva ajena SHALL responder `404`.

#### Scenario: Listado de reservas propias
- **WHEN** el huésped autenticado consulta "Mis reservas"
- **THEN** el sistema responde `200` con únicamente las reservas vinculadas a su ficha de huésped

#### Scenario: Detalle de reserva propia
- **WHEN** el huésped consulta el detalle de una reserva que le pertenece
- **THEN** el sistema responde `200` con el detalle de esa reserva

#### Scenario: Acceso a una reserva ajena
- **WHEN** el huésped intenta consultar o cancelar una reserva que pertenece a otro huésped
- **THEN** el sistema responde `404` y no revela ni modifica la reserva

#### Scenario: Cancelación de reserva propia
- **WHEN** el huésped cancela una reserva propia que está en estado `CONFIRMADA`
- **THEN** el sistema la pasa a `CANCELADA`, aplica la misma regla de multa que el personal, libera el rango y responde confirmando la cancelación
