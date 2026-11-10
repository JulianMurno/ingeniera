# Proposal: extend-rooms-management

## Why

Las habitaciones no modelan capacidad ni estado de mantenimiento y el catálogo se lista completo sin filtros ni paginación. El personal no puede saber si una habitación está fuera de servicio, cuántas personas admite ni filtrar por tipo, y el sistema la ofrece como "disponible" aunque esté en mantenimiento.

## What Changes

- Estado de habitación (`DISPONIBLE` / `MANTENIMIENTO`) gestionado por el administrador, que excluye a la habitación de la disponibilidad.
- Campo `capacidad` (ocupantes máximos) por habitación.
- Filtros en `GET /rooms` (tipo, tarifa, estado, disponibles en un rango) y paginación.
- Campos descriptivos: descripción, comodidades y fotos (URLs de imágenes).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `rooms`: estado de mantenimiento/fuera de servicio, capacidad de ocupantes, filtros y paginación en el listado y campos descriptivos (descripción, comodidades, fotos).

## Impact

- `prisma/schema.prisma`: modelo `Room` gana `estado`, `capacidad`, `descripcion`, `comodidades` y `fotos`.
- `room.service` y `availability.service`: excluir habitaciones en `MANTENIMIENTO` de la disponibilidad.
- Documentación OpenAPI/Swagger.
- Habilitará el filtro por ocupantes de `add-availability-rules` (dependencia futura).