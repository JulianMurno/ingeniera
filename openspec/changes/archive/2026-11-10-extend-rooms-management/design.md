# Design: extend-rooms-management

## Context

Ver `proposal.md` — Why. El modelo `Room` tiene `numero` (único), `tipo` y `tarifa`. `GET /rooms` lista todo sin filtros ni paginación; la disponibilidad se deriva solo de reservas confirmadas. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- Estado `DISPONIBLE`/`MANTENIMIENTO` por habitación, excluido de la disponibilidad.
- Campo `capacidad` y datos descriptivos (descripción, comodidades, fotos).
- Filtros y paginación en `GET /rooms`.

**Non-Goals:**
- Motor de búsqueda full-text ni galería de imágenes servida por la API (las fotos son URLs).

## Decisions

- **Modelo `Room`:** agregar `estado String @default("DISPONIBLE")`, `capacidad Int @default(1)`, `descripcion String?`, `comodidades String?`, `fotos String?`.
  - `comodidades` y `fotos` se persisten como JSON en string (SQLite). Es simple y suficiente para el MVP.
  - Alternativa: tablas relacionadas `RoomComodidad`/`RoomFoto` → más normalizado pero agrega joins sin ganancia real hoy.
- **Estados:** se mantiene string con los valores del enum actual (`SINGLE`/`DOBLE`/`SUITE`) y se agrega validación Zod que acepta `estado ∈ {DISPONIBLE, MANTENIMIENTO}`. El cambio de estado se hace por `PATCH /rooms/{id}` (rol `ADMINISTRADOR`), reutilizando el endpoint existente.
- **Exclusión de disponibilidad:** en `availability.service` (y en el nuevo filtro de `GET /rooms`) se agrega `WHERE estado != 'MANTENIMIENTO'`. Como defensa, `reservation.service.create/update` también rechaza habitaciones en mantenimiento (`409`).
- **Filtros de `GET /rooms`:** `tipo`, `tarifaMin`/`tarifaMax`, `estado`, y `disponible` por rango (`checkIn`/`checkOut`) que filtra por disponibilidad real. Paginación con el patrón `{ data, pagination }` usado en reservas.
  - Alternativa: filtro de disponibilidad en memoria tras el query → se descarta; se hace en el repository con la misma transacción/consulta de disponibilidad para que escale.

## Risks / Trade-offs

- Guardar fotos como URLs implica que la API no controla la disponibilidad del archivo → Aceptado; es responsabilidad del front.
- Los filtros de rango (`disponible`) añaden complejidad al repository → Aislado en una consulta dedicada para no degradar el `GET /rooms` simple.
- Dependencia futura: `add-availability-rules` usará `capacidad` → el campo se agrega acá para que la dependencia sea ascendente y limpia.

## Migration Plan

1. Agregar campos a `Room`; `prisma migrate dev --name extend-rooms-management`.
2. Actualizar diagrama Zod de `room` (create/update) con `estado`, `capacidad`, texto y fotos.
3. Ajustar `availability.service` y `reservation.service` para excluir mantenimiento.
4. Implementar filtros y paginación en `room.service`/`repository`.
5. Tests: exclusión de mantenimiento en disponibilidad, filtros, paginación, capacidad inválida (422).
6. Rollback: migración anterior; los campos nuevos quedan sin uso.

## Open Questions

- ¿La habitación en `MANTENIMIENTO` con reservas futuras debe bloquear la puesta en mantenimiento? Se decide no bloquear (el huésped se reubica o se cancela); puede revisarse con negocio sin tocar specs.