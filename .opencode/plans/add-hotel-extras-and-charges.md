# Plan: add-hotel-extras-and-charges (backend + frontend Next.js)

## Contexto y decisiones

- Change: `openspec/changes/add-hotel-extras-and-charges` (tasks.md 1.1–5.2). Hoy NO existe nada del módulo en el código.
- Rama: crear `feat/hotel-extras-and-charges` desde `main`. Sin commits salvo que se pida explícitamente.
- Alcance tareas: implementar 1.1–4.1 y 5.1–5.2 con tests/lint/build en verde y marcar esos checks. **4.2 y 4.3 se omiten** (dependen de `add-cross-cutting-features`, no mergeado: no existe módulo `payments`/`invoices` en `src/`) y quedan sin check + anotados en README como integración pendiente (lo que pide la propia tarea 4.2).
- Frontend: **Next.js** (App Router, JavaScript, sin TS/Tailwind), carpeta `frontend/`, alcance **solo extras y cargos** (catálogo + cargos por reserva + reporte de consumo + lista mínima de reservas para elegir una). Sin pantalla de login dedicada: cabecera con sesión mínima (form usuario/contraseña semilla o pegar token) porque la API exige JWT.
- Verificado: red/npm disponible (next 16.4.0, react 19.3.0); no hay frontend ni estáticos en el repo; CORS ya está abierto en `src/app.js`.

## Fase A — Backend (tasks 1–5)

### A1. Modelo de datos y seed (1.1–1.3)

- `prisma/schema.prisma` (al final del archivo, additivo):
  - `HotelExtra { id, codigo @unique, nombre, categoria, precio Int, unidad, activo Boolean @default(true), descripcion?, creadoEn @default(now()), charges ExtraCharge[] }`
  - `ExtraCharge { id, reservationId FK, extraId FK, cantidad Int, precioUnitario Int, importe Int, estado String @default("PENDIENTE"), nota?, registradoPorId FK User, anuladoPorId FK User?, anuladoEn?, creadoEn, reservation, extra, registradoPor, anuladoPor }`
  - Índices: `@@index([reservationId, estado])`, `@@index([extraId, creadoEn])`, `@@index([estado])`.
  - Back-relations: `Reservation.extraCharges[]`, `User.chargesRegistrados[]`, `User.chargesAnulados[]` (nombrear relaciones con nombre para desambiguar).
  - Sin enums Prisma (convención del repo: String + Zod).
- Migración: `npm run prisma:migrate -- --name add_hotel_extras_and_charges` + `npm run prisma:generate`; verificar índices en `migration.sql`.
- `prisma/seed.js`: upsert por `codigo` (idempotente) de 5 extras, sin crear cargos:
  | codigo | nombre | categoria | precio | unidad |
  |---|---|---|---|---|
  | ROOM-SERVICE | Room service | ALIMENTOS | 1500 | POR_UNIDAD |
  | LAVANDERIA | Lavandería | LAVANDERIA | 800 | POR_UNIDAD |
  | MINIBAR | Minibar | ALIMENTOS | 500 | POR_UNIDAD |
  | PARKING | Parking | TRANSPORTE | 1200 | NOCHE |
  | LATE-CHECKOUT | Late check-out | SERVICIOS | 3000 | ESTANCIA |
  - Verificar corriendo `npm run prisma:seed` dos veces (sin duplicar).

### A2. Catálogo de servicios (2.1–2.3)

- `src/schemas/extras.schema.js`:
  - `categorias = ['ALIMENTOS','LAVANDERIA','TRANSPORTE','SERVICIOS','OTROS']`, `unidades = ['NOCHE','POR_UNIDAD','DIA','ESTANCIA']`.
  - `extraCreateSchema` (codigo `^[A-Z0-9-]{2,20}$`, nombre, categoria enum, precio int > 0, unidad enum, descripcion opcional), `extraUpdateSchema` (partial + refine “al menos un campo”, patrón de guest), `extraQuerySchema` (categoria/activo opcional con `z.coerce.boolean()`, page/pageSize coerce), `extraConsumoQuerySchema` (desde/hasta `YYYY-MM-DD`), `chargeCreateSchema` (extraId int > 0, cantidad int >= 1, nota opcional).
- `src/repositories/extras.repository.js`: `findByCodigo`, `findById`, `findMany` (`$transaction([count, findMany])`, `[total, items]`), `create`, `update`, `deactivate`; cargos: `createCharge`, `findChargeById`, `findChargesByReservation` (include extra/registradoPor/anuladoPor), `cancelCharge`, `sumCharges(reservationId)` (estado != CANCELADO), `consumoAgrupado(desde, hasta)` (groupBy extraId, excluye CANCELADO).
- `src/services/extras.service.js`:
  - `createExtra` → 409 si `codigo` duplicado; `updateExtra` → 409 duplicado excluyendo self; `deleteExtra` → baja lógica (`activo=false`), responde el objeto actualizado.
  - `listExtras(params, user)` → si `user.rol !== 'ADMINISTRADOR'` fuerza `activo: true` (recepcionista solo ve activos).
  - `registrarCargo(reservationId, data, userId)` → 404 reserva; 409 si estado no es `CONFIRMADA`/`EN_CURSO`; 409 si extra inactivo/inexistente; congela `precioUnitario` del catálogo y calcula `importe = precioUnitario * cantidad`.
  - `listarCargos(reservationId)` → 404; `{ data, resumen: { totalEstadia, totalServicios, totalGeneral, cantidadCargos } }` (excluye CANCELADO del resumen).
  - `anularCargo(reservationId, chargeId, userId)` → 404 si reserva o cargo no existe o cargo no pertenece a la reserva; marca `estado='CANCELADO'`, `anuladoPorId`, `anuladoEn`.
  - `resumenCargos(reservationId)` → `{ totalEstadia, totalServicios, totalGeneral }`.
  - `consumo(desde, hasta)` → 422 si rango inválido (desde >= hasta o fecha mal formada); agrupa por servicio con `cantidad` e `importe` + `totalPeriodo`.
- `src/controllers/extras.controller.js` + `src/routes/extras.routes.js` (`router.use(requireAuth)`):
  - `GET /` (validate extraQuery) · `GET /consumo` (validate consumoQuery) **declarada antes de `/:id`** · `POST /` (`authorize('ADMINISTRADOR')`, validate create) · `PATCH /:id` (admin) · `DELETE /:id` (admin, validate idParam reusado de `room.schema`).
  - Registrar en `src/routes/index.js` → `router.use('/extras', extrasRoutes)`.

### A3. Cargos en la reserva (3.1–3.5)

- `src/routes/reservation.routes.js` (rutas anidadas, mismos middlewares del archivo):
  - `POST /:id/charges` (validate idParam + chargeCreate) → `createCharge`
  - `GET /:id/charges` (validate idParam) → `listCharges`
  - `PATCH /:id/charges/:chargeId` (`authorize('ADMINISTRADOR')`, validate ambos params) → `cancelCharge`
- `reservation.controller.getReservation`: lee `req.query.incluirCargos === 'true'` y lo pasa a `reservationService.getReservation(id, { incluirCargos })`; el service agrega `resumenCargos` (3.4). Sin cambios en el resto del ciclo de vida ni en `Reservation.total`.
- Dependencias: `reservation.service` → `extras.service`; `extras.service` → `reservation.repository` (evita ciclos; los repositories no importan services).
- 3.5: el precio congelado queda garantizado porque `precioUnitario` se copia al crear; test lo verifica.

### A4. Reporte de consumo (4.1)

- `GET /extras/consumo?desde=&hasta=` → 200 `{ data: [{ extraId, codigo, nombre, categoria, cantidad, importe }], desde, hasta, totalPeriodo }`; 422 rango inválido; anulados excluidos.

### A5. Docs, README, tests, checks (4.2/4.3 omitidas, 5.1–5.2)

- `src/docs/index.js` (objeto OpenAPI manual, aditivo): paths `/extras`, `/extras/{id}`, `/extras/consumo`, `/reservations/{id}/charges`, `/reservations/{id}/charges/{chargeId}`, query `incluirCargos` en `GET /reservations/{id}`; schemas `HotelExtra`, `ExtraCreate`, `ExtraUpdate`, `ExtraList`, `ChargeCreate`, `Charge`, `ChargeList`, `ChargeResumen`, `ConsumoReporte`; responses 401/403/404/409/422 reusando componentes existentes.
- `README.md`: sección “Servicios adicionales y cargos” (flujo registrar → anular → facturar), filas nuevas en la tabla de endpoints, y **nota de integración pendiente con la factura (`totalEstadia` + `totalServicios` en `GET /reservations/{id}/invoices`) y auditoría, a esperar de `add-cross-cutting-features`** (cumple 4.2/4.3).
- `tests/helpers/db.js`: `resetDb` debe borrar `extraCharge` primero (FK a reservation/user/hotelExtra) y `hotelExtra`.
- Nuevo `tests/integration/extras.test.js` con los escenarios de las specs y de tasks 2.x–4.1: alta 201; 403 recepcionista; 409 código duplicado; 422 precio/categoría; listado filtrado y recepcionista solo activos; PATCH 200; DELETE baja lógica; cargo con extra inactivo 409; cargo: camino feliz 201 con importe, 404 reserva, 409 estado, 422 cantidad; charges: vacío (totalServicios 0 y totalGeneral = total), uno, varios, 404; anulación 200 y 403 recepcionista y 404, excluida del resumen; `?incluirCargos=true` 200/404; precio congelado tras editar catálogo; consumo 200/422/anulado no suma; docs (`spec` contiene `/extras/consumo` y `/reservations/{id}/charges`, `/api/docs` 200).
- Gate final: `npm run lint`, `npm test`, `npm run build` en verde; smoke manual con servidor + curl de los endpoints nuevos.

## Fase B — Frontend Next.js (`frontend/`)

### Estructura

```
frontend/
  package.json        (next 16.4.0, react 19.3.0, react-dom; scripts: dev/start -p 3001, build)
  next.config.mjs
  jsconfig.json       (alias @/)
  .gitignore          (.next/, node_modules/)
  app/layout.js       (html + nav + barra de sesión)
  app/globals.css     (CSS plano: variables, tablas, forms, banners de error)
  app/page.js         (redirect → /reservas)
  app/reservas/page.js
  app/reservas/[id]/page.js
  app/catalogo/page.js
  app/consumo/page.js
  components/  SessionBar.js, Nav.js, Paginacion.js, ErrorBanner.js, FormExtra.js, FormCargo.js
  lib/api.js          (API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                       getToken/setToken/clearToken en localStorage; api() con Authorization,
                       parsea envelope de error {error:{code,message,details}})
  lib/session.js      (login POST /auth/login → {token,user}, guarda en localStorage, decodifica rol del JWT)
  lib/format.js       (moneda entera → "$ 1.500" con Intl es-AR; fechas YYYY-MM-DD)
```

### Pantallas (todas client components, fetch a la API)

1. `/reservas` — `GET /reservations?estado=&page=&pageSize=` → tabla (código, huésped, habitación, fechas, estado, total) + filtro estado + paginación + link al detalle.
2. `/reservas/[id]` — `GET /reservations/{id}?incluirCargos=true` + `GET /reservations/{id}/charges` → ficha de la reserva, **resumen (totalEstadia / totalServicios / totalGeneral)**, tabla de cargos con extra, cantidad, precio unitario, importe, estado y anulante/fecha; form “Registrar cargo” (`GET /extras?activo=true&pageSize=100` para el select, cantidad, nota) → `POST .../charges`; botón “Anular cargo” (solo rol ADMINISTRADOR) → `PATCH .../charges/{chargeId}` con confirmación. Si la reserva no admite cargos (409 del API) se muestra el mensaje del backend.
3. `/catalogo` — `GET /extras?categoria=&activo=&page=` → tabla + filtros; form crear/editar y “Desactivar” solo para ADMINISTRADOR (rol decodificado del token; el backend igual devuelve 403 y se muestra el error).
4. `/consumo` — form `desde`/`hasta` → `GET /extras/consumo` → tabla por servicio + total del período; 422 se muestra en el banner.

### Sesión (sin pantalla de login dedicada)

- `SessionBar` en el layout: si hay sesión, “usuario (ROL)” + Salir (limpia storage). Si no hay token, formulario **inline** usuario/contraseña (usuarios de seed `admin`/`recepcionista`, `123456`) o campo para pegar un token. Todo en la cabecera, sin página `/login`.

### Cambios en la raíz para acomodar el frontend

- `.eslintrc.cjs`: `ignorePatterns: ['frontend/']` (si no, `eslint .` rompe con JSX en `.js`).
- `.prettierignore`: agregar `frontend/.next`.
- `.gitignore`: agregar `.next/`.
- `package.json`: scripts `dev:frontend` / `build:frontend` (`npm --prefix frontend ...`).
- README: sección “Frontend” (API en :3000, `cd frontend && npm install && npm run dev` en :3001, endpoints que consume).

## Fase C — Verificación y marcado

1. Backend: `npm run lint` · `npm test` (suite nueva incluida) · `npm run build` · smoke con `npm run dev` + curl (login, extras CRUD, cargos, resumen, consumo).
2. Frontend: `npm install` + `npm run build` (compila) + `npm run dev` con la API arriba y smoke HTTP de las 4 páginas.
3. Marcar `[x]` en `openspec/changes/add-hotel-extras-and-charges/tasks.md`: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 5.1, 5.2. Dejar **sin marcar 4.2 y 4.3** (ya anotado en README el punto de integración pendiente).

## Riesgos / notas

- Instalación de Next.js ≈ 200–300 MB (red verificada, registry responde).
- `ingeniera/ingeniera/` es una copia antigua del repo (3 migraciones); no se toca.
- Orden de rutas importa (`/extras/consumo` antes de `/extras/:id`) y orden de `resetDb` por FKs.
- `GET /extras` para recepcionista ignora el filtro `activo=false` (solo activos, por spec).
- Moneda no definida en el proyecto: formato `es-AR` con `$` solo de presentación (montos enteros).
