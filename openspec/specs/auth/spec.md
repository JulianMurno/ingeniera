# Auth Specification

## Purpose

Permite que el personal del hotel se autentique con credenciales y reciba un token JWT para acceder a la API protegida, distinguiendo roles de recepcionista y administrador.

## Requirements

### Requirement: Autenticación de usuario
El sistema SHALL permitir a un usuario registrado iniciar sesión enviando sus credenciales y obtener un token JWT (header `Authorization: Bearer <token>`) para consumir la API protegida. Las credenciales se verifican con hash seguro (bcrypt). Se proporciona un usuario de rol `RECEPCIONISTA` y uno de rol `ADMINISTRADOR` sembrados al inicializar el sistema.

#### Scenario: Login exitoso
- **WHEN** un usuario envía credenciales válidas a `/api/v1/auth/login`
- **THEN** el sistema responde `200` con un token JWT que identifica al usuario y su rol

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía credenciales incorrectas a `/api/v1/auth/login`
- **THEN** el sistema responde `401` con un error y NO emite token

### Requirement: Protección de la API por token
El sistema SHALL rechazar las peticiones a rutas protegidas que no incluyan un token JWT válido en el header `Authorization`.

#### Scenario: Petición sin token
- **WHEN** se llama a una ruta protegida sin header `Authorization`
- **THEN** el sistema responde `401` sin procesar la petición

#### Scenario: Petición con token inválido o vencido
- **WHEN** se llama a una ruta protegida con un token inválido o expirado
- **THEN** el sistema responde `401` y no otorga acceso

### Requirement: Control de acceso por rol
El sistema SHALL verificar el rol del usuario autenticado antes de permitir las operaciones restringidas, denegando las que exijan un rol superior al del usuario.

#### Scenario: Acceso denegado por rol
- **WHEN** un usuario autenticado con rol `RECEPCIONISTA` invoca una operación reservada al rol `ADMINISTRADOR`
- **THEN** el sistema responde `403` con un error de autorización

### Requirement: Expiración de token
El sistema SHALL emitir tokens JWT con una expiración configurable, y SHALL rechazar las peticiones que presenten un token vencido.

#### Scenario: Token vencido
- **WHEN** una petición protegida incluye un token JWT cuyo tiempo de vida venció
- **THEN** el sistema responde `401` y no otorga acceso

### Requirement: Logout e invalidación de token
El sistema SHALL invalidar el token JWT al cerrar sesión, de modo que un token invalidado no pueda seguir usándose en rutas protegidas.

#### Scenario: Logout exitoso
- **WHEN** un usuario autenticado cierra sesión
- **THEN** el token queda invalidado y no puede volver a usarse

#### Scenario: Uso de token invalidado
- **WHEN** se presenta un token que fue invalidado por logout
- **THEN** el sistema responde `401`

### Requirement: Cambio de contraseña
El sistema SHALL permitir a un usuario autenticado cambiar su propia contraseña, verificando antes la contraseña actual.

#### Scenario: Cambio exitoso
- **WHEN** un usuario autenticado envía su contraseña actual y una nueva válida
- **THEN** el sistema actualiza la contraseña y las credenciales quedan verificadas con hash seguro

#### Scenario: Contraseña actual incorrecta
- **WHEN** el usuario envía una contraseña actual incorrecta
- **THEN** el sistema responde `401` y no cambia la contraseña

### Requirement: Restablecimiento de contraseña por administrador
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` restablecer la contraseña de otro usuario sin conocer la anterior.

#### Scenario: Restablecimiento autorizado
- **WHEN** un usuario con rol `ADMINISTRADOR` restablece la contraseña de otro usuario
- **THEN** el sistema la actualiza y el usuario puede iniciar sesión con la nueva

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta restablecer la contraseña de otro usuario
- **THEN** el sistema responde `403`

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