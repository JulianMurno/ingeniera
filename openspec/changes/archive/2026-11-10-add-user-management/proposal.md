# Proposal: add-user-management

## Why

El MVP solo provee dos usuarios sembrados (`admin` y `recepcionista`) y el sistema no permite al administrador gestionar el personal del hotel: no se pueden crear usuarios, desactivarlos, cambiarles la contraseña ni revocar sesiones. Cualquier alta de personal requiere tocar la base directamente y los tokens JWT nunca expiran.

## What Changes

- Nuevo CRUD de usuarios del personal (`POST`, `GET`, `PATCH`, `DELETE /users`) exclusivo para rol `ADMINISTRADOR`, con asignación de rol (`RECEPCIONISTA` / `ADMINISTRADOR`).
- Cambio de contraseña propia y reset de contraseña de otro usuario por parte del administrador.
- Desactivación/activación de usuarios (borrado lógico) para impedir el login sin perder el historial de operaciones.
- Logout que invalida el token (denylist) y tokens con expiración configurable.

## Capabilities

### New Capabilities

- `users`: gestión de usuarios del personal (alta, listado, edición, desactivación) y asignación de roles.

### Modified Capabilities

- `auth`: emisión de tokens con expiración configurable, logout con invalidación de sesión y flujos de cambio y restablecimiento de contraseña.

## Impact

- `prisma/schema.prisma`: modelo `User` gana campo de activo/deshabilitado y posible tabla de tokens invalidados.
- Nuevo módulo de usuarios (`routes`/`controllers`/`services`/`repositories`) y ajustes en `auth.service` y middlewares de autenticación.
- Documentación OpenAPI/Swagger.
- Cambio de comportamiento: los tokens dejan de ser eternos y pasan a expirar; los usuarios desactivados no pueden autenticarse.