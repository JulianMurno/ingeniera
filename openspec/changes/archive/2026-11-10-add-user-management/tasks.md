# tasks.md — add-user-management

## 1. Modelo de datos

- [x] 1.1 Agregar `activo Boolean @default(true)` a `User` y el modelo `TokenInvalidado { id, jti unique, expiraEn }` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [x] 1.2 Configurar `JWT_EXPIRES_IN` en `.env.example`, `.env` y la carga de entorno; verificar que el valor se usa al firmar tokens.

## 2. Autenticación y tokens

- [x] 2.1 Agregar el claim `jti` (uuid) y la expiración configurable al firmar el token en `auth.service`; verificar con un test que el login devuelve `exp` y `jti`.
- [x] 2.2 Ajustar `requireAuth` para rechazar con `401` los tokens vencidos o presentes en la denylist; verificar con tests de token vencido y token invalidado.
- [x] 2.3 Implementar `POST /auth/logout` insertando el `jti` en `TokenInvalidado`; verificar con test que el token usado pierde validez tras logout.
- [x] 2.4 Implementar cambio de contraseña propia (`PATCH /auth/password`) verificando la contraseña actual con bcrypt; verificar test de cambio exitoso y de contraseña actual incorrecta (`401`).

## 3. CRUD de usuarios

- [x] 3.1 Crear `schemas/user.schema.js` (create/update) con Zod; verificar que datos inválidos responden `422` en tests.
- [x] 3.2 Implementar `POST /users` (solo `ADMINISTRADOR`) con unicidad de username; verificar test de alta `201`, duplicado `409` y acceso denegado a `RECEPCIONISTA` `403`.
- [x] 3.3 Implementar `GET /users` (autenticado) que no exponga contraseñas; verificar test `200`.
- [x] 3.4 Implementar `PATCH /users/{id}` (solo `ADMINISTRADOR`) para username, rol o contraseña; verificar test de edición `200`, `404` inexistente y `403` a recepcionista.
- [x] 3.5 Implementar `DELETE /users/{id}` como desactivación lógica (solo `ADMINISTRADOR`); verificar test de login del usuario desactivado con `401` y reactivación permitida.
- [x] 3.6 Confirmar que el `seed` por defecto queda activo y usable; verificar que `npm run prisma:seed` y el login del admin siguen funcionando.

## 4. Cierre

- [x] 4.1 Documentar los nuevos endpoints y schemas en `src/docs/index.js`; verificar que `/api/docs` los muestra.
- [x] 4.2 Actualizar README (variables nuevas y endpoints); verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.
