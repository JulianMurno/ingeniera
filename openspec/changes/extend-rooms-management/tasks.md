# tasks.md — extend-rooms-management

## 1. Modelo y esquemas

- [x] 1.1 Agregar a `Room` los campos `estado String @default("DISPONIBLE")`, `capacidad Int @default(1)`, `descripcion String?`, `comodidades String?` y `fotos String?` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [x] 1.2 Actualizar `schemas/room.schema.js` (create/update) con `estado ∈ {DISPONIBLE, MANTENIMIENTO}`, `capacidad >= 1` y textos opcionales; verificar test con capacidad cero o negativa respondiendo `422`.

## 2. Servicios y rutas

- [x] 2.1 Excluir de la disponibilidad las habitaciones en estado `MANTENIMIENTO` en `availability.service`; verificar test donde una habitación en mantenimiento sin reservas no figura en `/availability`.
- [x] 2.2 Rechazar creación/modificación de reservas sobre habitaciones en `MANTENIMIENTO` (`409`); verificar test.
- [x] 2.3 Permitir en `PATCH /rooms/{id}` cambiar `estado`, `capacidad` y datos descriptivos (solo `ADMINISTRADOR`); verificar tests de cambio `200`, `403` a recepcionista y `404` inexistente.
- [x] 2.4 Implementar filtros en `GET /rooms` (`tipo`, `tarifaMin`/`tarifaMax`, `estado`, `disponible` por `checkIn`/`checkOut`) y paginación con `{ data, pagination }`; verificar tests de cada filtro y de paginación.

## 3. Cierre

- [x] 3.1 Documentar los nuevos campos, filtros y respuestas en `src/docs/index.js`; verificar que `/api/docs` los refleja.
- [x] 3.2 Actualizar README; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.