# Hotel Reservas — MVP

Sistema de reservas de hotel con API REST (Node.js + Express + Prisma + SQLite).

## Stack

- **Node.js** (LTS) + **Express**
- **Prisma** + **SQLite** (local, migrable a PostgreSQL)
- **Zod** para validación de entrada
- **JWT** (jsonwebtoken) + **bcrypt** para autenticación
- **nodemailer** para los emails de confirmación y cancelación (transporte `log` si no hay SMTP)
- **OpenAPI / Swagger UI** (`/api/docs`)
- **Jest + Supertest** para tests · **ESLint + Prettier** para calidad

## Requisitos

- Node.js LTS (v20+)
- npm

## Puesta en marcha

```bash
npm install
cp .env.example .env          # editar JWT_SECRET y las reglas de disponibilidad
npx prisma migrate dev
npx prisma db seed            # crea usuarios admin y recepcionista
npm run dev                   # o: npm start
```

La API queda en `http://localhost:3000/api/v1` y los docs en `http://localhost:3000/api/docs`.

### Usuarios de seed

| Usuario         | Contraseña | Rol           |
| --------------- | ---------- | ------------- |
| `admin`         | `123456`   | ADMINISTRADOR |
| `recepcionista` | `123456`   | RECEPCIONISTA |

> Cambiá `SEED_PASSWORD` en el entorno antes de desplegar.

## Endpoints

Toda ruta protegida requiere `Authorization: Bearer <token>` (obtenido en `POST /auth/login`). La gestión de habitaciones exige rol `ADMINISTRADOR`.

| Método | Ruta                               | Descripción                                       | Rol           |
| ------ | ---------------------------------- | ------------------------------------------------- | ------------- |
| POST   | `/api/v1/auth/login`               | Inicia sesión y devuelve un JWT                   | público       |
| POST   | `/api/v1/guests`                   | Registra un huésped                               | autenticado   |
| GET    | `/api/v1/guests?dni=&nombre=&page=&pageSize=` | Lista huéspedes activos (filtros y paginación) | autenticado   |
| GET    | `/api/v1/guests/{id}`              | Detalle de huésped                                | autenticado   |
| PATCH  | `/api/v1/guests/{id}`              | Modifica un huésped                               | autenticado   |
| DELETE | `/api/v1/guests/{id}`              | Archiva un huésped (borrado lógico)               | autenticado   |
| POST   | `/api/v1/rooms`                    | Registra una habitación                           | ADMINISTRADOR |
| GET    | `/api/v1/rooms`                    | Lista habitaciones (filtros y paginación)         | autenticado   |
| GET    | `/api/v1/rooms/{id}`               | Detalle de habitación                            | autenticado   |
| PATCH  | `/api/v1/rooms/{id}`               | Modifica una habitación                           | ADMINISTRADOR |
| DELETE | `/api/v1/rooms/{id}`               | Elimina una habitación                            | ADMINISTRADOR |
| POST   | `/api/v1/rates/seasons`            | Alta de tarifa por temporada de un tipo           | ADMINISTRADOR |
| GET    | `/api/v1/rates/seasons?roomType=`  | Lista de temporadas de tarifa                     | autenticado   |
| DELETE | `/api/v1/rates/seasons/{id}`       | Elimina una temporada de tarifa                   | ADMINISTRADOR |
| POST   | `/api/v1/rates/weekdays`           | Alta de tarifa por día de la semana de un tipo    | ADMINISTRADOR |
| GET    | `/api/v1/rates/weekdays?roomType=` | Lista de tarifas por día de la semana             | autenticado   |
| DELETE | `/api/v1/rates/weekdays/{id}`      | Elimina una tarifa por día de la semana           | ADMINISTRADOR |
| GET    | `/api/v1/rates/quote`              | Tarifa vigente por tipo y rango (desglose x noche) | autenticado |
| GET    | `/api/v1/availability`             | Habitaciones disponibles por rango, tipo y ocupantes | autenticado |
| POST   | `/api/v1/reservations`             | Crea una reserva (valida disponibilidad, ocupación y fechas) | autenticado   |
| GET    | `/api/v1/reservations`             | Lista reservas con filtros y paginación           | autenticado   |
| GET    | `/api/v1/reservations/{id}`        | Detalle de reserva                                | autenticado   |
| PATCH  | `/api/v1/reservations/{id}`        | Modifica una reserva (revalida disponibilidad)    | autenticado   |
| POST   | `/api/v1/reservations/{id}/cancel` | Cancela una reserva confirmada                    | autenticado   |
| POST   | `/api/v1/reservations/{id}/checkin` | Registra el check-in (`EN_CURSO`)               | autenticado   |
| POST   | `/api/v1/reservations/{id}/checkout` | Registra el check-out (`FINALIZADA`)            | autenticado   |
| POST   | `/api/v1/reservations/{id}/no-show` | Marca `NO_SHOW` y libera el rango               | autenticado   |

## Reservas

### Ciclo de vida

```
CONFIRMADA ──checkin──▶ EN_CURSO ──checkout──▶ FINALIZADA
    │
    ├──cancel──▶ CANCELADA
    └──no-show──▶ NO_SHOW
```

| Desde         | Transiciones válidas                | Endpoint                            |
| ------------- | ----------------------------------- | ----------------------------------- |
| `CONFIRMADA`  | `EN_CURSO`, `CANCELADA`, `NO_SHOW`  | `/checkin`, `/cancel`, `/no-show`    |
| `EN_CURSO`    | `FINALIZADA`                        | `/checkout`                         |
| `FINALIZADA`  | — (terminal)                        | —                                   |
| `CANCELADA`   | — (terminal)                        | —                                   |
| `NO_SHOW`     | — (terminal)                        | —                                   |

Cualquier otra transición responde `409` sin cambiar el estado. Las reservas `EN_CURSO` y
`FINALIZADA` no se pueden cancelar. Cancelar y marcar `NO_SHOW` liberan el rango, porque la
ocupación se deriva de las reservas `CONFIRMADA`.

### Campos

| Campo                | Tipo        | Reglas                                                             |
| -------------------- | ----------- | ------------------------------------------------------------------ |
| `adultos`            | `int`       | Por defecto `1`; al menos un adulto por reserva                    |
| `menores`            | `int`       | Por defecto `0`; no puede ser negativo                             |
| `codigo`             | `string?`   | Código de confirmación `HR-XXXXXX`, único (reintento ante colisión) |
| `notas`              | `string?`   | Notas internas; se devuelven en el detalle                         |
| `motivoCancelacion`  | `string?`   | Motivo enviado al cancelar                                         |
| `multaCancelacion`   | `int`       | Por defecto `0`; `CANCELLATION_FEE_PERCENT` % del `total`          |

### Reglas al crear o modificar

| Regla                                                | Código de error |
| ---------------------------------------------------- | --------------- |
| Huésped inexistente o archivado                     | `422`           |
| Habitación en `MANTENIMIENTO`                        | `409`           |
| Ocupación de reservas solapadas > `Room.capacidad`   | `409`           |
| `adultos + menores` > `Room.capacidad`                | `422`           |
| `checkIn` en el pasado o con menos antelación       | `422`           |
| Estancia fuera de `MIN_STAY_NIGHTS` / `MAX_STAY_NIGHTS` | `422`        |
| Solapamiento por horarios (`earlyCheckIn`/`lateCheckOut`) | `409`       |

La política antioverbooking suma los ocupantes de las reservas `CONFIRMADA` que solapan el rango
en la misma habitación: mientras no superen la `capacidad` se aceptan varias reservas solapadas.

## Notificaciones

Al crear una reserva `CONFIRMADA` se envía un email de **confirmación** al huésped con el código de
confirmación, el rango de fechas y la habitación. Al cancelarla se envía un email de **cancelación**
con el motivo y la multa aplicada.

| Variable            | Por defecto              | Efecto                                          |
| ------------------- | ------------------------ | ----------------------------------------------- |
| `SMTP_URL`          | vacío                    | Si está definida usa SMTP (nodemailer)          |
| `NOTIFICATIONS_FROM` | `reservas@hotel.local`   | Remitente de los emails                         |

Sin `SMTP_URL` el transporte por defecto es `log`: el email se escribe en la consola y no hace
falta SMTP ni configuración extra (es lo que usan los tests).

## Huéspedes

| Campo      | Tipo      | Reglas                                                                    |
| ---------- | --------- | ------------------------------------------------------------------------- |
| `nombre`   | `string`  | Obligatorio                                                              |
| `email`    | `string`  | Obligatorio, formato de email                                             |
| `dni`      | `string`  | Obligatorio, alfanumérico de 6 a 10 caracteres, único (`409` si se repite) |
| `telefono` | `string?` | Opcional; de 7 a 15 dígitos, con `+` inicial opcional                     |
| `activo`   | `bool`    | Por defecto `true`; `DELETE` lo pasa a `false`                            |

`PATCH /guests/{id}` actualiza solo los campos enviados y revalida el email. Si el `dni` cambia
comprueba su unicidad **excluyendo al propio huésped**, así que reenviar el mismo `dni` no
responde `409`. Un body's vacío responde `422`.

### Baja lógica

`DELETE /guests/{id}` no borra la fila: marca `activo = false`. De ahí se derivan las reglas:

- El huésped sale de `GET /guests` y `GET /guests/{id}` responde `404` (no hay endpoint para
  reactivarlo ni para listar archivados).
- **Las reservas se conservan** y siguen siendo consultables y modificables; el historial no se
  destruye porque la baja no toca la fila.
- No se pueden crear reservas ni asignar un huésped archivado al modificar una reserva (`422`).
  Editar otros campos de una reserva ya existente de un huésped archivado sí se permite.

Como la restricción `dni` es única en la base, un DNI de un huésped archivado no se puede reusar:
la unicidad se respeta entre todos los huéspedes, no solo entre los activos.

### Filtros de `GET /guests`

Todos los filtros son opcionales y combinables; la respuesta es `{ data, pagination }`:

| Parámetro           | Efecto                                              |
| ------------------- | --------------------------------------------------- |
| `dni`               | Coincidencia parcial del DNI                        |
| `nombre`            | Coincidencia parcial del nombre                     |
| `page` / `pageSize` | Paginación (por defecto `1` / `10`, máximo `100`)   |

## Habitaciones

| Campo         | Tipo        | Reglas                                                      |
| ------------- | ----------- | ----------------------------------------------------------- |
| `numero`      | `string`    | Único y obligatorio                                          |
| `tipo`        | `enum`      | `SINGLE` \| `DOBLE` \| `SUITE`                              |
| `tarifa`      | `int`       | Entero positivo (por noche)                                  |
| `estado`      | `enum`      | `DISPONIBLE` (por defecto) \| `MANTENIMIENTO`                |
| `capacidad`   | `int`       | Ocupantes máximos, por defecto `1`; debe ser `>= 1` (`422`)  |
| `descripcion` | `string?`   | Texto libre                                                  |
| `comodidades` | `string[]?` | Comodidades ofrecidas; se persisten como JSON               |
| `fotos`       | `string[]?` | URLs de imágenes; se persisten como JSON                    |

El estado `MANTENIMIENTO` saca la habitación de la disponibilidad (`GET /availability` y el filtro
por rango de `GET /rooms`) aunque no tenga reservas que solapen, y las reservas nuevas o modificadas
sobre ella se rechazan con `409`.

### Filtros de `GET /rooms`

Todos los filtros son opcionales y combinables; la respuesta es `{ data, pagination }`:

| Parámetro                 | Efecto                                                          |
| ------------------------- | --------------------------------------------------------------- |
| `tipo`                    | Tipo de habitación                                              |
| `tarifaMin` / `tarifaMax` | Rango de tarifa (inclusivo)                                     |
| `estado`                  | `DISPONIBLE` \| `MANTENIMIENTO`                                 |
| `checkIn` + `checkOut`    | Solo habitaciones libres en ese rango (excluye `MANTENIMIENTO`) |
| `page` / `pageSize`       | Paginación (por defecto `1` / `10`, máximo `100`)               |

`checkIn` y `checkOut` van juntos y `checkIn` debe ser anterior a `checkOut`; si no, `422`.

## Reglas de disponibilidad y tarifas

### Configuración por entorno

| Variable            | Por defecto | Efecto                                                        |
| ------------------- | ----------- | ------------------------------------------------------------- |
| `MIN_STAY_NIGHTS`   | `1`         | Noches mínimas de una estancia (`422` si el rango no alcanza)  |
| `MAX_STAY_NIGHTS`   | `30`        | Noches máximas de una estancia (`422` si el rango las supera)  |
| `MIN_ADVANCE_NIGHTS`| `0`         | Noches mínimas de antelación desde hoy (`422` si no se cumple) |
| `CHECK_IN_HOUR`     | `15:00`     | Hora de ingreso; un ingreso antes ocupa el día completo       |
| `CHECK_OUT_HOUR`    | `11:00`     | Hora de egreso; una salida después ocupa el día completo       |
| `CANCELLATION_FEE_PERCENT` | `0` | Porcentaje del total que se cobra como multa al cancelar       |

Se leen del entorno en cada request (aceptan `HH:mm` o `HH`; un valor inválido cae en el
por defecto). `MIN_STAY_NIGHTS`, `MAX_STAY_NIGHTS`, `CHECK_IN_HOUR` y `CHECK_OUT_HOUR` se aplican
en `GET /availability` y al crear o modificar reservas; `MIN_ADVANCE_NIGHTS` y
`CANCELLATION_FEE_PERCENT` son reglas de reserva y solo se aplican al crear, modificar o cancelar
una reserva.

### Filtros de `GET /availability`

| Parámetro        | Efecto                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `checkIn`        | Inicio del rango (obligatorio)                                           |
| `checkOut`       | Fin del rango (obligatorio)                                              |
| `type`           | Tipo de habitación                                                       |
| `ocupantes`      | Solo habitaciones con `capacidad >= ocupantes`                           |
| `earlyCheckIn`   | Ingreso antes de `CHECK_IN_HOUR`: bloquea el egreso de la noche anterior |
| `lateCheckOut`   | Salida después de `CHECK_OUT_HOUR`: bloquea el ingreso del mismo día     |

Se excluyen las habitaciones en `MANTENIMIENTO` y las que tienen una reserva `CONFIRMADA`
que solapa. El recambio el mismo día está permitido mientras no se pida `earlyCheckIn` ni
haya un `lateCheckOut` de la reserva anterior.

### Tarifas por temporada y por día de semana

Las tarifas se definen por **tipo de habitación** y sustituyen a `Room.tarifa`:

| Recurso                     | Campos                                                       |
| --------------------------- | ------------------------------------------------------------ |
| Temporada (`/rates/seasons`)| `roomType`, `fechaInicio`, `fechaFin`, `tarifa`              |
| Día de semana (`/rates/weekdays`) | `roomType`, `diaSemana` (`0` domingo … `6` sábado), `tarifa` |

La temporada cubre el rango semiabierto `[fechaInicio, fechaFin)`: la noche de `fechaFin`
queda fuera. Las temporadas de un mismo tipo no pueden superponerse (`409`), y un tipo no
puede tener dos tarifas para el mismo día de la semana (`409`).

La tarifa efectiva de cada noche se resuelve con esta precedencia:

1. `WEEKDAY` — tarifa del día de la semana.
2. `SEASON` — tarifa de la temporada vigente.
3. `BASE` — `Room.tarifa` de la habitación reservada.

`GET /rates/quote?roomType=&checkIn=&checkOut=` devuelve el desglose noche por noche con la
tarifa aplicada y su `origen`, además del `total` del rango. Ese mismo cálculo es el que
usa `reservation.service` para el `total` al crear y al modificar una reserva.

## Convenciones

- Prefijo de versión: `/api/v1`; recursos en plural.
- El borrado de huéspedes es lógico (`activo = false`): conserva las reservas y saca al huésped del listado y del detalle.
- Códigos: `200`, `201`, `400`, `401`, `403`, `404`, `409` (duplicado, solape o transición inválida), `422` (validación).
- Error uniforme: `{ "error": { "code", "message", "details" } }`.
- Fechas ISO `YYYY-MM-DD`; dinero en enteros (unidad base); tarifa por noche.
- Disponibilidad derivada de reservas `CONFIRMADA` (una reserva ocupa `[checkIn, checkOut)`; recambio el mismo día permitido).
- Alta/modificación de reserva validan ocupación y solapamiento dentro de una transacción.
- El estado de una reserva solo cambia por los endpoints de transición; cualquier otra combinación responde `409`.
- Los emails se envían de forma síncrona dentro del request; la interfaz `sendEmail(to, subject, body)` permite migrarla a cola.
- `comodidades` y `fotos` viajan como listas en la API y se persisten como JSON en SQLite.
- Toda regla configurable por entorno se lee en cada request, nunca se cachea al cargar el módulo.

## Tests

```bash
npm test          # unitarios + integración (Supertest), base SQLite temporal
npm run lint      # ESLint
npm run format    # Prettier (--write)
npm run test:watch
```

## Scripts

| Comando                   | Acción                               |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Arranca con `node --watch`           |
| `npm start`               | Arranca el server                    |
| `npm test`                | Corre los tests (`jest --runInBand`) |
| `npm run lint`            | ESLint                               |
| `npm run format`          | Prettier `--write`                   |
| `npm run prisma:migrate`  | `prisma migrate dev`                 |
| `npm run prisma:seed`     | `prisma db seed`                     |
| `npm run prisma:generate` | `prisma generate`                    |
| `npm run prisma:backfill-codigo` | Completa el `codigo` de las reservas sin código |

## Despliegue

- `npm ci` para instalar dependencias.
- `npx prisma generate`.
- `npx prisma migrate deploy` apunta la base a `DATABASE_URL` (para SQLite: `file:./dev.db`; en PostgreSQL se cambia el provider del datasource y se vuelve a migrar).
- `npm run build` (prepara `dist/` si se usa) y `npm start`.

Recomendado: `main` protegida, una rama por tarea (`feat/<capacidad>-<tarea>`), CI en verde (lint + tests + build) y revisión de pares antes de mergear.

## CI

`.github/workflows/ci.yml` corre en cada push/PR a `main`: `npm ci` → `prisma generate` → `prisma migrate deploy` (SQLite de prueba) → `npm run lint` → `npm test` → `npm run build`.
