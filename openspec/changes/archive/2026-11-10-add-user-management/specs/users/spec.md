## Purpose

Permite al administrador crear, listar, editar y desactivar los usuarios del personal del hotel y asignarles un rol, controlando así quién puede acceder a la API.

## ADDED Requirements

### Requirement: Alta de usuario del personal
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` registrar un usuario del personal con username, contraseña y rol. Un username duplicado se rechaza con conflicto.

#### Scenario: Alta autorizada
- **WHEN** un usuario con rol `ADMINISTRADOR` envía datos válidos a `/api/v1/users`
- **THEN** el sistema crea el usuario y responde `201` con sus datos

#### Scenario: Username duplicado
- **WHEN** se intenta registrar un usuario con un username ya existente
- **THEN** el sistema responde `409` y no crea el usuario

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta registrar un usuario
- **THEN** el sistema responde `403` y no crea el usuario

### Requirement: Listado de usuarios
El sistema SHALL permitir consultar el listado de usuarios del personal del hotel.

#### Scenario: Listado exitoso
- **WHEN** un usuario autenticado consulta `/api/v1/users`
- **THEN** el sistema responde `200` con los usuarios del personal

### Requirement: Edición de usuario del personal
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` modificar un usuario existente (username, contraseña o rol). Si el usuario no existe, el sistema responde `404`.

#### Scenario: Edición autorizada
- **WHEN** un usuario con rol `ADMINISTRADOR` actualiza `/api/v1/users/{id}` de un usuario existente
- **THEN** el sistema aplica los cambios y responde con los datos actualizados

#### Scenario: Edición inexistente
- **WHEN** se intenta modificar un usuario cuyo id no existe
- **THEN** el sistema responde `404`

#### Scenario: Edición denegada a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta modificar un usuario
- **THEN** el sistema responde `403`

### Requirement: Desactivación de usuario
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` desactivar o reactivar un usuario, de modo que un usuario desactivado no pueda iniciar sesión sin perder su historial.

#### Scenario: Desactivación exitosa
- **WHEN** un usuario con rol `ADMINISTRADOR` desactiva `/api/v1/users/{id}` de un usuario activo
- **THEN** el sistema lo desactiva y el usuario ya no puede iniciar sesión

#### Scenario: Reactivación exitosa
- **WHEN** un usuario con rol `ADMINISTRADOR` reactiva un usuario desactivado
- **THEN** el sistema lo activa nuevamente y el usuario puede iniciar sesión

#### Scenario: Login de usuario desactivado
- **WHEN** un usuario desactivado intenta iniciar sesión
- **THEN** el sistema responde `401` y no emite token