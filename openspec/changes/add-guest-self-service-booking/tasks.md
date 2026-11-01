## 1. Modelo de datos y migración

- [x] 1.1 Agregar a `prisma/schema.prisma` el campo `guestId Int? @unique` y la relación `guest` en `User`, más `accounts User[]` en `Guest`; verificar con `npx prisma validate` que el esquema es válido.
- [x] 1.2 Generar la migración con `npx prisma migrate dev --name add_guest_accounts` y revisar que incluya la columna, el índice único y la clave foránea hacia `Guest`.
- [x] 1.3 Incluir en la migración la normalización `UPDATE Guest SET email = lower(email)` y verificar que un `Guest` con email en mayúsculas queda en minúsculas tras aplicarla.
- [x] 1.4 Ejecutar `npx prisma generate` y verificar que el cliente expone `User.guestId` y la relación `Guest.accounts` sin errores de tipos.
- [x] 1.5 Actualizar `tests/helpers/db.js` para borrar `user` antes de `guest` y verificar que `npm test` sigue pasando sin errores de clave foránea.

## 2. Autenticación y registro de huésped (backend)

- [x] 2.1 Agregar `guestRegisterSchema` y `guestLoginSchema` en `src/schemas/auth.schema.js` (email válido, DNI, teléfono opcional, contraseña mínima de 8, `email` + `password` para login) y verificar con un test unitario que los datos inválidos son rechazados.
- [x] 2.2 Extender `src/repositories/user.repository.js` con búsqueda por email/username de huésped y creación con `guestId`; verificar con un test de integración que se persiste la cuenta vinculada a la ficha.
- [x] 2.3 Extender `src/repositories/guest.repository.js` con búsqueda de ficha activa por email (comparación normalizada) y detección de cuenta asociada; verificar con tests de repositorio/servicio.
- [x] 2.4 Implementar en `src/services/auth.service.js` el registro transaccional con reclamo por DNI + email, creación de ficha cuando no exista, rechazo `409` por coincidencia parcial o duplicado y traducción de `P2002` a `409`; verificar con tests de registro exitoso, reclamo, duplicado y coincidencia parcial.
- [x] 2.5 Implementar el login de huésped con email + contraseña y emisión de token con `rol: 'HUESPED'` y `guestId`; verificar con un test que el token decodificado contiene ambos datos.
- [x] 2.6 Actualizar `toPublicUser` para incluir `guestId` y el nombre del huésped cuando corresponda, sin alterar la respuesta del login de personal; verificar con un test del login de `admin` y `recepcionista`.
- [x] 2.7 Agregar `requireGuest` y `requireStaff` en `src/middlewares/auth.middleware.js`, y propagar `guestId` desde el payload JWT a `req.user`; verificar con tests unitarios de middleware para tokens de huésped, personal y sin rol.
- [x] 2.8 Crear `src/controllers/guest-auth.controller.js` y las rutas públicas `POST /api/v1/auth/guest/register` y `POST /api/v1/auth/guest/login`; verificar con Supertest que responden `201`/`200`, `401` y `422` según el caso.
- [x] 2.9 Aplicar `requireStaff` al montaje de `users`, `guests`, `rooms`, `rates`, `reservations`, `extras`, `housekeeping`, `maintenance`, `reports` y `audit` en `src/routes/index.js`, dejando `availability` accesible para `HUESPED`; verificar con un test que un token de huésped recibe `403` en cada grupo de gestión y `200` en `/availability`.

## 3. API de reservas del huésped

- [x] 3.1 Agregar en `src/services/reservation.service.js` `createGuestReservation(data, actor)` que derive y valide `guestId` desde el actor y reutilice la creación existente; verificar con un test que un huésped no puede crear una reserva con `guestId` ajeno (`403`) y que la reserva propia queda `CONFIRMADA`.
- [x] 3.2 Agregar `listGuestReservations(guestId, params)` y `getGuestReservation(guestId, id)` con filtro de propiedad en el servicio; verificar que el listado solo devuelve reservas propias y que una reserva ajena responde `404`.
- [x] 3.3 Agregar `cancelGuestReservation(guestId, id, data, actor)` que verifique propiedad y reutilice la cancelación existente con multa y notificación; verificar que la reserva propia pasa a `CANCELADA` y una ajena responde `404` sin cambios.
- [x] 3.4 Crear `src/schemas/guest-reservation.schema.js` para el alta y la cancelación del portal (fechas, ocupantes, notas, motivo) reutilizando las validaciones existentes; verificar que un rango inválido responde `422`.
- [x] 3.5 Crear `src/controllers/guest-reservation.controller.js` con las operaciones `me`, `list`, `get`, `create` y `cancel`, tomando siempre `req.user.guestId`; verificar con Supertest el camino feliz y los errores `401`, `403`, `404`, `409` y `422`.
- [x] 3.6 Crear `src/routes/guest.routes.js` montado en `/api/v1/guest` con `requireAuth` + `requireGuest` y registrar las rutas de `me` y reservas en `src/routes/index.js`; verificar que un token de personal recibe `403` en el portal de huésped.
- [x] 3.7 Verificar la sincronización con el panel: crear una reserva por el portal y comprobar con Supertest que el listado y el detalle de `/api/v1/reservations` (token de recepción) la incluyen de inmediato.
- [x] 3.8 Verificar el sentido inverso: crear una reserva por el panel para una ficha con cuenta y comprobar que aparece en `GET /api/v1/guest/reservations` de ese huésped.

## 4. Portal de huésped (frontend)

- [x] 4.1 Extender `frontend/lib/api.js` con `isGuest()` y redirección por rol ante `401` (`/portal/login` para huésped, `/login` para personal); verificar manualmente que una sesión de huésped vencida no cae en el login de personal.
- [x] 4.2 Actualizar `frontend/components/Nav.jsx` para mostrar navegación de huésped (Inicio, Reservar, Mis reservas, Cerrar sesión), mantener la de personal y ofrecer accesos separados a login de personal y portal para visitantes; verificar visualmente con cada rol.
- [x] 4.3 Crear `frontend/app/portal/login/page.js` y `frontend/app/portal/registro/page.js` con los formularios de email/contraseña y de registro, manejo de errores `401/409/422` y redirección a `/portal`; verificar el flujo de alta y login contra la API.
- [x] 4.4 Crear `frontend/app/portal/page.js` con búsqueda de disponibilidad (fechas, tipo, ocupantes) usando `/api/v1/availability` y acceso a reservar y a "Mis reservas"; verificar que muestra habitaciones libres y una lista vacía cuando no hay disponibilidad.
- [x] 4.5 Crear `frontend/app/portal/reservar/page.js` con selección de habitación disponible, fechas, adultos, menores y notas, enviando la reserva al endpoint de huésped y mostrando código de confirmación; verificar que no envía `guestId` y que muestra `409/422` cuando corresponde.
- [x] 4.6 Crear `frontend/app/portal/mis-reservas/page.js` y `frontend/app/portal/mis-reservas/[id]/page.js` con listado, detalle y cancelación de reservas propias; verificar que solo muestra las del huésped autenticado y que cancelar actualiza el estado a `CANCELADA`.
- [x] 4.7 Verificar que las rutas de gestión existentes (`/reservas`, `/huespedes`, `/habitaciones`, `/reportes`, etc.) siguen funcionando para personal y no son accesibles desde la navegación de huésped.

## 5. Pruebas, documentación y cierre

- [x] 5.1 Agregar `tests/integration/guest-auth.test.js` con registro exitoso, reclamo de ficha, duplicado por email, duplicado por DNI, coincidencia parcial, login válido y login inválido; verificar que todos pasan con `npm test`.
- [x] 5.2 Agregar `tests/integration/guest-reservations.test.js` con creación propia, `guestId` ajeno, solapamiento, capacidad, rango inválido, listado/detalle propio, acceso a reserva ajena y cancelación propia/ajena; verificar que todos pasan con `npm test`.
- [x] 5.3 Agregar un test de aislamiento que recorra las rutas de gestión principales con token de huésped y espere `403`, y otro que confirme que el personal conserva `200`; verificar que ambos pasan.
- [x] 5.4 Agregar tests unitarios para el reclamo de ficha y para la derivación de `guestId` en el servicio de reservas; verificar que cubren coincidencia exacta, parcial y ausencia de ficha.
- [x] 5.5 Documentar en `src/docs/index.js` el tag/rutas del portal de huésped y la separación de roles; verificar que `/api/docs` renderiza las nuevas operaciones sin errores.
- [x] 5.6 Actualizar `README.md` con el flujo de autoservicio y credenciales de prueba de un huésped sembrado; verificar que las instrucciones son reproducibles en una base limpia.
- [x] 5.7 Ejecutar `npm run lint`, `npm test` y, en `frontend`, `npm run build`; verificar que terminan sin errores antes de cerrar el cambio.
