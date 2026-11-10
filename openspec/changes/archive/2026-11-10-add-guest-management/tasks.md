# tasks.md — add-guest-management

## 1. Modelo y esquemas

- [x] 1.1 Agregar `activo Boolean @default(true)` a `Guest` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [x] 1.2 Actualizar `schemas/guest.schema.js` con validación de DNI (alfanumérico de 6-10) y teléfono (dígitos con `+` opcional, 7-15); verificar test de alta con datos inválidos `422`.
- [x] 1.3 Crear `guestUpdateSchema` parcial y validación de query con paginación (`page`, `pageSize`); verificar test de edición con datos inválidos `422`.

## 2. Servicios y rutas

- [x] 2.1 Implementar `PATCH /guests/{id}` revalidando email y unicidad de DNI excluyendo al propio huésped; verificar tests de edición exitosa `200`, DNI duplicado `409` y huésped inexistente `404`.
- [x] 2.2 Implementar `DELETE /guests/{id}` como borrado lógico (setea `activo=false`) conservando reservas; verificar tests de borrado `200`, inexistente `404` y que las reservas asociadas sobreviven.
- [x] 2.3 Actualizar `GET /guests` para filtrar solo huéspedes activos y paginar con `{ data, pagination }`; verificar tests de filtros y de paginación.
- [x] 2.4 Asegurar que `GET /guests/{id}` devuelve `404` para un huésped archivado; verificar con test.
- [x] 2.5 Validar en la creación y modificación de reservas que el `guestId` corresponda a un huésped activo; verificar test que rechaza reservas de huésped archivado.

## 3. Cierre

- [x] 3.1 Documentar los nuevos endpoints y campos en `src/docs/index.js`; verificar que `/api/docs` los muestra.
- [x] 3.2 Actualizar README; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.
