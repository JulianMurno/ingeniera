# Proposal: add-guest-management

## Why

Los huéspedes solo pueden crearse y consultarse. Si un dato se carga mal (teléfono, email, DNI) o un huésped se da de baja, no hay manera de corregirlo ni de mantener el listado ordenado, y la validación de DNI/teléfono es débil.

## What Changes

- `PATCH /guests/{id}` para editar los datos de un huésped, revalidando email y rechequeando la unicidad del DNI si cambia.
- `DELETE /guests/{id}` con borrado lógico/archivado que respete las reservas existentes asociadas.
- Paginación en `GET /guests`.
- Validación de formato del DNI y de longitud del teléfono en alta y edición.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `guests`: edición de huéspedes, borrado/archivado, paginación en el listado y validación reforzada de DNI y teléfono.

## Impact

- `prisma/schema.prisma`: modelo `Guest` gana un campo de activo (borrado lógico).
- `guest.routes`, `guest.controller` y `guest.service` ganan `PATCH` y `DELETE`; ajuste del esquema Zod de huésped.
- Documentación OpenAPI/Swagger.