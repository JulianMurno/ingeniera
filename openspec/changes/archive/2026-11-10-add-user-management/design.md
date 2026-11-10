# Design: add-user-management

## Context

Ver `proposal.md` — Why. El MVP solo tiene dos usuarios sembrados; los tokens JWT (`jsonwebtoken`) no expiran y no hay forma de revocarlos ni de crear usuarios desde la API. La arquitectura es `route → controller → service → repository` con Prisma+SQLite, Zod y bcrypt. Ver `proposal.md` para alcance y `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- CRUD de usuarios (`/users`) con roles, solo escrituras para `ADMINISTRADOR`.
- Tokens JWT con expiración configurable e invalidación por logout.
- Cambio de contraseña propio y restablecimiento por administrador.

**Non-Goals:**
- Autenticación multi-factor, federada u OAuth.
- Revocación selectiva de una sola sesión (el logout invalida el token presentado).

## Decisions

- **Modelo `User`:** agregar `activo Boolean @default(true)`. El borrado es lógico (desactivación) para no perder historial; un usuario desactivado no puede hacer login.
  - Alternativa: `DELETE` físico — descartada porque los usuarios ya están referenciados por operaciones auditables.
- **Expiración:** nueva variable de entorno `JWT_EXPIRES_IN` (p. ej. `8h`), seteada al firmar el token. El middleware `requireAuth` ya rechaza tokens vencidos al verificar `jsonwebtoken`.
- **Logout con denylist por `jti`:** se agrega el claim `jti` (uuid) al token y una tabla `TokenInvalidado { id, jti unique, expiraEn }`. En logout se inserta el `jti`; `requireAuth` consulta la denylist (solo para tokens aún no vencidos).
  - Alternativa A: `tokenVersion` por usuario (invalida todas las sesiones al cambiar contraseña): más simple pero no cumple "el token queda invalidado" a nivel sesión individual y rompe el caso "logout de una sesión".
  - Alternativa B: sin denylist, TTL corto: contradice la spec de logout; descartada.
- **Contraseñas:** bcrypt como hoy; en el cambio de contraseña se verifica la actual antes de rehashear. No se devuelve la contraseña en ningún endpoint (se omite en la respuesta).
- **Capas:** nuevo `user.route/controller/service/repository` replicando el patrón de `guest`/`room`; validación Zod nueva (`schemas/user.schema.js`).

## Risks / Trade-offs

- La denylist crece con cada logout → Mitigación: borrar filas expiradas al momento de insertar (limpieza perezosa) y/o un job simple.
- `JWT_EXPIRES_IN` corto obliga a re-loguear seguido → Trade-off aceptado para cumplir la spec de expiración.
- Reset de contraseña sin flujo de "olvidé mi contraseña" (requiere admin) — Más segura para el equipo, pero el huésped no aplica aquí.

## Migration Plan

1. Agregar `activo` a `User` y crear `TokenInvalidado` en `schema.prisma`.
2. `prisma migrate dev --name add-user-management`.
3. Implementar esquemas Zod, service/repository y rutas; ajustar `requireAuth` para denylist y expiración.
4. Tests de integración por endpoint (login tras logout, token vencido, CRUD por rol).
5. Rollback: `prisma migrate deploy` de la migración anterior; los tokens viejos sin `jti` siguen siendo válidos hasta expirar.

## Open Questions

- ¿La contraseña debe respetar una política de complejidad/mínimo? Puede definirse luego como ajuste de Zod sin tocar specs ni diseño.