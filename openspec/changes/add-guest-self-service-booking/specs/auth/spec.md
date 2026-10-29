## ADDED Requirements

### Requirement: Registro público de cuenta de huésped
El sistema SHALL permitir el registro público de una cuenta con rol `HUESPED` usando nombre, email, DNI, teléfono opcional y contraseña. La contraseña SHALL almacenarse con hash seguro (bcrypt). El sistema SHALL rechazar con `409` un email o DNI ya asociado a otra cuenta y con `422` los datos inválidos, sin emitir token en esos casos.

#### Scenario: Registro de cuenta exitoso
- **WHEN** un visitante envía datos de registro válidos y su email y DNI no están asociados a otra cuenta
- **THEN** el sistema crea la cuenta con rol `HUESPED` y responde `201` con un token de huésped

#### Scenario: Registro duplicado
- **WHEN** un visitante intenta registrarse con un email o DNI ya asociado a otra cuenta
- **THEN** el sistema responde `409` y no crea la cuenta ni emite token

### Requirement: Autenticación de huésped
El sistema SHALL permitir que una cuenta con rol `HUESPED` inicie sesión con su email y contraseña y reciba un token JWT que incluye su rol y el identificador de su ficha de huésped. Las credenciales inválidas SHALL responderse con `401` sin emitir token.

#### Scenario: Login de huésped exitoso
- **WHEN** una cuenta de huésped envía email y contraseña válidos
- **THEN** el sistema responde `200` con un token JWT que identifica el rol `HUESPED` y la ficha de huésped asociada

#### Scenario: Login de huésped fallido
- **WHEN** una cuenta de huésped envía un email inexistente o una contraseña incorrecta
- **THEN** el sistema responde `401` sin emitir token

### Requirement: Aislamiento de accesos entre huésped y personal
El sistema SHALL distinguir los accesos de huésped de los accesos de personal. Un token con rol `HUESPED` SHALL habilitar únicamente las operaciones del portal de huésped y SHALL recibir `403` al invocar operaciones reservadas a `RECEPCIONISTA` o `ADMINISTRADOR`. Los tokens de personal SHALL conservar el acceso a las operaciones de gestión existentes.

#### Scenario: Huésped invoca una operación de personal
- **WHEN** un huésped autenticado invoca un endpoint de gestión del personal (check-in, check-out, no-show, pagos, cargos, habitaciones, usuarios, reportes, tarifas, limpieza, mantenimiento o auditoría)
- **THEN** el sistema responde `403` y no ejecuta la operación

#### Scenario: Personal conserva sus accesos
- **WHEN** un usuario con rol `RECEPCIONISTA` o `ADMINISTRADOR` invoca una operación de gestión permitida para su rol
- **THEN** el sistema la procesa como antes de este cambio
