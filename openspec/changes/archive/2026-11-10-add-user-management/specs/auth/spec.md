## ADDED Requirements

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