## Context

Ver `proposal.md` para la motivación. El sistema actual ya tiene una única entidad `Reservation` y un único motor de reservas (`reservation.service`, `availability.service`, `rate.service`) usado por recepción y administración. `User` (personal) y `Guest` son entidades separadas: `User` tiene `username`, `password` y `rol`, mientras que `Guest` guarda los datos personales y el historial de reservas.

Restricciones relevantes observadas en el código:

- `src/routes/reservation.routes.js`, `guest.routes.js`, `room.routes.js` y el resto de routers de gestión aplican `requireAuth` pero, salvo excepciones, no restringen el rol. Hoy no existe un rol de huésped, por lo que cualquier token válido accede a las rutas de personal.
- `src/services/reservation.service.js` recibe `guestId` en el cuerpo y no valida que pertenezca al actor; hoy solo lo invoca personal autenticado.
- `src/middlewares/auth.middleware.js` arma `req.user` con `sub`, `username` y `rol`, sin ningún vínculo a `Guest`.
- El login de personal usa `username`; el frontend guarda token y usuario en `localStorage` y redirige a `/login` ante `401`.
- `tests/helpers/db.js` borra `guest` antes que `user`; con una relación `User.guestId → Guest` el orden debe invertirse.
- El email de `Guest` no es único y no está normalizado.

## Goals / Non-Goals

**Goals:**

- Reutilizar la infraestructura de autenticación (JWT, bcrypt, denylist de `jti`) y el motor de reservas existente, sin duplicar reglas ni tablas de reservas.
- Separar de forma explícita el acceso de huésped del acceso de personal mediante roles y routers.
- Garantizar que una cuenta de huésped se vincule a una única ficha `Guest` y que no se dupliquen fichas al reclamar una existente.
- Mantener el panel de recepción/administración sin cambios funcionales y hacer visibles de inmediato las reservas creadas desde el portal.

**Non-Goals:**

- Nuevo estado `PENDIENTE` o flujo de aprobación de reservas.
- Modificación de reservas propias por el huésped, pagos, cargos, check-in/check-out o no-show desde el portal.
- Recuperación de contraseña, verificación de email o autenticación con terceros.
- Cambiar el contrato de las rutas de gestión existentes más allá de restringirlas por rol.
- Multicliente/multi-hotel: se mantiene un único hotel por instalación.

## Decisions

### 1. Extender `User` con vínculo opcional a `Guest` en lugar de crear `GuestAccount`

Se agrega a `User` un campo `guestId Int? @unique` con relación a `Guest`, y `Guest.accounts User[]`. El rol `HUESPED` exige `guestId` no nulo; los roles de personal lo dejan nulo.

**Rationale:** reutiliza login, hash de contraseña, expiración, revocación de tokens y auditoría ya probados. Una entidad separada duplicaría el flujo de autenticación y obligaría a un segundo middleware de token.

**Alternativas consideradas:** (a) `GuestAccount` independiente con su propio login: más aislamiento, pero duplica autenticación y auditoría; (b) reutilizar `Guest` como sujeto autenticable agregando `password` a `Guest`: mezcla datos maestros con credenciales y complica la gestión de personal.

`username` de una cuenta de huésped será el email normalizado, de modo que la restricción `@unique` existente impida duplicados. `toPublicUser` incluirá `guestId` (nulo para personal) y el nombre del huésped cuando exista.

### 2. Rutas públicas y de huésped separadas de las rutas de personal

Nuevo router montado en `/api/v1/guest` y endpoints públicos bajo `/api/v1/auth/guest`:

- `POST /api/v1/auth/guest/register` (público): registra cuenta y ficha/reclama ficha.
- `POST /api/v1/auth/guest/login` (público): email + contraseña.
- `GET /api/v1/guest/me`: ficha propia.
- `GET /api/v1/guest/reservations`: listado propio, con filtros y paginación opcionales.
- `GET /api/v1/guest/reservations/:id`: detalle propio.
- `POST /api/v1/guest/reservations`: alta con `guestId` derivado del token.
- `POST /api/v1/guest/reservations/:id/cancel`: cancelación propia.

El router de huésped aplica `requireAuth` + `requireGuest` (rol `HUESPED` y `guestId` presente). Los routers de gestión (`users`, `guests`, `rooms`, `rates`, `reservations`, `extras`, `housekeeping`, `maintenance`, `reports`, `audit`) se montan con un `requireStaff` (roles `RECEPCIONISTA`/`ADMINISTRADOR`) en `src/routes/index.js`. `availability` queda disponible para cualquier rol autenticado, incluido `HUESPED`.

**Rationale:** evita condicionales de rol dentro de cada controlador y garantiza por defecto que un token de huésped no alcance rutas de personal. Mantiene intactos los contratos actuales de recepción/administración.

**Alternativa considerada:** reutilizar `/reservations` con alcance dinámico según rol. Se descarta porque un error de alcance expondría reservas de terceros y porque mezcla dos superficies de API con permisos distintos.

### 3. Registro con reclamo transaccional de ficha

El registro se ejecuta en una transacción de Prisma:

1. Normaliza email a minúsculas y DNI con `trim`/mayúsculas.
2. Rechaza `409` si ya existe `User` con ese `username` (email) o `Guest` con ese DNI.
3. Busca ficha activa por DNI:
   - si existe y su email (comparado sin distinguir mayúsculas) coincide y no tiene cuenta → vincula la cuenta a la ficha;
   - si existe pero el email no coincide → `409` (coincidencia parcial);
   - si existe y ya tiene cuenta → `409`.
4. Si no existe ficha por DNI, busca fichas activas con ese email: si hay alguna con otro DNI → `409` (coincidencia parcial); si no, crea la ficha.
5. Crea `User` con `username = email`, `password` con bcrypt, `rol = HUESPED`, `guestId` de la ficha.
6. Emite token de huésped y devuelve la sesión.

Se capturan las violaciones de unicidad de Prisma (`P2002`) y se traducen a `409` para cubrir carreras entre registros concurrentes. La contraseña mínima será de 8 caracteres (más estricta que el mínimo de 6 de `changePassword` por ser un registro público) y se documenta en el esquema Zod.

**Rationale:** el DNI es la clave natural de la ficha; exigir DNI + email evita que un tercero reclame la ficha de otra persona conociendo solo el DNI. La transacción y las restricciones únicas evitan duplicados.

### 4. Reutilización del motor de reservas con alcance forzado por el actor

El portal no reimplementa reglas. El controlador de huésped arma el payload con `guestId = req.user.guestId` e ignora cualquier `guestId` enviado por el cliente; el servicio valida que un actor `HUESPED` solo opere sobre su propia ficha. Se agregan funciones de servicio específicas:

- `createGuestReservation(data, actor)`: valida `actor.guestId` y delega en la lógica existente de creación (misma transacción, disponibilidad, tarifas, capacidad, código, auditoría y notificación).
- `listGuestReservations(guestId, params)`: fuerza el filtro `guestId`.
- `getGuestReservation(guestId, id)`: devuelve `404` si la reserva no pertenece al huésped.
- `cancelGuestReservation(guestId, id, data, actor)`: verifica propiedad y delega en la cancelación existente (misma multa y notificación).

**Rationale:** una sola fuente de verdad para reglas y estados. El filtro por propietario se aplica en la capa de servicio, no solo en el controlador, para que no pueda omitirse.

La cancelación de una reserva ajena responde `404` (no `403`) para no revelar la existencia de reservas de otros huéspedes.

### 5. Token y sesión de huésped

El token de huésped usa el mismo `JWT_SECRET`, `jti`, expiración y denylist que el personal, e incluye `{ sub, username: email, rol: 'HUESPED', guestId, jti }`. `requireAuth` propaga `guestId` a `req.user`. El logout existente funciona sin cambios.

En el frontend, `frontend/lib/api.js` expondrá `isGuest()` y elegirá el destino de redirección ante `401` según el rol guardado: `/portal/login` para `HUESPED`, `/login` para personal. `Nav.jsx` se vuelve consciente del rol: huésped ve Inicio/Reservar/Mis reservas/Cerrar sesión; personal conserva los enlaces actuales; visitante ve accesos a login de personal y al portal de reservas, sin registro de personal.

**Rationale:** evita un segundo mecanismo de sesión y mantiene la revocación de tokens existente.

### 6. Frontend del portal en rutas separadas

Se agregan rutas de Next.js App Router:

- `/portal/login` y `/portal/registro`: autenticación y alta de huésped.
- `/portal`: inicio con búsqueda de disponibilidad y acceso a reservar/mis reservas.
- `/portal/reservar`: selección de fechas, tipo, habitación disponible, ocupantes y notas; usa `POST /api/v1/guest/reservations`.
- `/portal/mis-reservas` y `/portal/mis-reservas/[id]`: listado, detalle y cancelación propia.

Se reutilizan los componentes de `components/ui.jsx` y `lib/useData.js`. La vista de gestión `/reservas` no se modifica funcionalmente; su formulario de alta sigue usando el endpoint de personal.

**Rationale:** separa la experiencia pública de la consola de gestión y permite que el layout y la navegación se adapten por rol sin reescribir las páginas existentes.

### 7. Migración de datos y de tests

La migración de Prisma agrega `guestId` a `User`, su índice único y la clave foránea. No hay cuentas de huésped previas, por lo que no hay backfill de cuentas. Se normalizan a minúsculas los `Guest.email` existentes para que la comparación de reclamo sea consistente en SQLite (sin `mode: insensitive`). Se actualiza `tests/helpers/db.js` para borrar `user` antes de `guest` y se agrega un helper para crear un huésped con cuenta y obtener su token.

**Rationale:** SQLite no soporta comparaciones `insensitive` en Prisma; normalizar en la migración evita duplicados por diferencias de mayúsculas y mantiene las consultas simples.

## Risks / Trade-offs

- **[Token de huésped alcanza una ruta de gestión por olvido en un router]** → Montar `requireStaff` en `src/routes/index.js` para todos los routers de gestión y cubrirlo con un test que recorra las rutas principales con token de huésped esperando `403`.
- **[Fuga de reservas ajenas por confiar solo en el controlador]** → Aplicar el filtro de propiedad en el servicio (`listGuestReservations`, `getGuestReservation`) y testear acceso a una reserva de otro huésped esperando `404`.
- **[Duplicación de fichas por registros concurrentes o email con mayúsculas]** → Transacción + restricciones únicas (`User.username`, `User.guestId`, `Guest.dni`), normalización de email y traducción de `P2002` a `409`.
- **[Reclamo indebido de una ficha existente]** → Exigir coincidencia de DNI **y** email; una coincidencia parcial responde `409` y no crea ni vincula datos.
- **[Cambio de orden de borrado en tests rompe suites existentes]** → Actualizar `resetDb` en el mismo cambio y ejecutar la suite completa antes de mergear.
- **[Confusión entre login de personal y login de huésped]** → Endpoints y páginas separados; el login de personal no se modifica y el portal no ofrece registro para personal.
- **[Reservas de huéspedes sin trazabilidad de origen]** → La auditoría existente registra al `User` de rol `HUESPED` como actor de la creación/cancelación; no se agrega un campo de origen para mantener el alcance.

## Migration Plan

1. Agregar `guestId` y la relación a `prisma/schema.prisma`; generar migración y cliente Prisma.
2. En la migración, normalizar `Guest.email` a minúsculas (sin cambiar el esquema de `Guest`).
3. Desplegar el backend con `requireStaff` en los routers de gestión y los nuevos endpoints de huésped; verificar que el personal conserva acceso.
4. Desplegar el frontend con las rutas `/portal` y la navegación por rol.
5. Ejecutar migraciones y seeding en entornos locales/CI; correr `npm test` y `npm run lint`.
6. **Rollback:** revertir el despliegue del frontend/backend y aplicar la migración inversa de Prisma (elimina `User.guestId`). Las reservas creadas por huéspedes se conservan porque siguen siendo filas de `Reservation`; solo se pierden las cuentas de huésped.
