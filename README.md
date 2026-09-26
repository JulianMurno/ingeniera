# Hotel Reservas — MVP

Sistema de reservas de hotel con API REST (Node.js + Express + Prisma + SQLite).

## Stack

- **Node.js** (LTS) + **Express**
- **Prisma** + **SQLite** (local, migrable a PostgreSQL)
- **Zod** para validación de entrada
- **JWT** (jsonwebtoken) + **bcrypt** para autenticación
- **OpenAPI / Swagger UI** (`/api/docs`)
- **Jest + Supertest** para tests · **ESLint + Prettier** para calidad

## Requisitos

- Node.js LTS (v20+)
- npm

## Puesta en marcha

```bash
npm install
cp .env.example .env          # editar JWT_SECRET
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

| Método | Ruta                               | Descripción                                    | Rol           |
| ------ | ---------------------------------- | ---------------------------------------------- | ------------- |
| POST   | `/api/v1/auth/login`               | Inicia sesión y devuelve un JWT                | público       |
| POST   | `/api/v1/guests`                   | Registra un huésped                            | autenticado   |
| GET    | `/api/v1/guests?dni=&nombre=`      | Lista huéspedes (filtros opcionales)           | autenticado   |
| GET    | `/api/v1/guests/{id}`              | Detalle de huésped                             | autenticado   |
| POST   | `/api/v1/rooms`                    | Registra una habitación                        | ADMINISTRADOR |
| GET    | `/api/v1/rooms`                    | Lista habitaciones (filtros y paginación)      | autenticado   |
| GET    | `/api/v1/rooms/{id}`               | Detalle de habitación                         | autenticado   |
| PATCH  | `/api/v1/rooms/{id}`               | Modifica una habitación                        | ADMINISTRADOR |
| DELETE | `/api/v1/rooms/{id}`               | Elimina una habitación                         | ADMINISTRADOR |
| GET    | `/api/v1/availability`             | Habitaciones disponibles por rango y tipo      | autenticado   |
| POST   | `/api/v1/reservations`             | Crea una reserva (valida disponibilidad)       | autenticado   |
| GET    | `/api/v1/reservations`             | Lista reservas con filtros y paginación        | autenticado   |
| GET    | `/api/v1/reservations/{id}`        | Detalle de reserva                             | autenticado   |
| PATCH  | `/api/v1/reservations/{id}`        | Modifica una reserva (revalida disponibilidad) | autenticado   |
| POST   | `/api/v1/reservations/{id}/cancel` | Cancela una reserva                            | autenticado   |

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

## Convenciones

- Prefijo de versión: `/api/v1`; recursos en plural.
- Códigos: `200`, `201`, `400`, `401`, `403`, `404`, `409` (duplicado o solape), `422` (validación).
- Error uniforme: `{ "error": { "code", "message", "details" } }`.
- Fechas ISO `YYYY-MM-DD`; dinero en enteros (unidad base); tarifa por noche.
- Disponibilidad derivada de reservas `CONFIRMADA` (una reserva ocupa `[checkIn, checkOut)`; recambio el mismo día permitido).
- Alta/modificación de reserva validan solapamiento dentro de una transacción.
- `comodidades` y `fotos` viajan como listas en la API y se persisten como JSON en SQLite.

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

## Despliegue

- `npm ci` para instalar dependencias.
- `npx prisma generate`.
- `npx prisma migrate deploy` apunta la base a `DATABASE_URL` (para SQLite: `file:./dev.db`; en PostgreSQL se cambia el provider del datasource y se vuelve a migrar).
- `npm run build` (prepara `dist/` si se usa) y `npm start`.

Recomendado: `main` protegida, una rama por tarea (`feat/<capacidad>-<tarea>`), CI en verde (lint + tests + build) y revisión de pares antes de mergear.

## CI

`.github/workflows/ci.yml` corre en cada push/PR a `main`: `npm ci` → `prisma generate` → `prisma migrate deploy` (SQLite de prueba) → `npm run lint` → `npm test` → `npm run build`.
