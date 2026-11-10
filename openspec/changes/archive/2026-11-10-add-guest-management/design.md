# Design: add-guest-management

## Context

Ver `proposal.md` — Why. El modelo `Guest` tiene `nombre`, `email`, `dni` (único) y `telefono?`; hoy solo hay `POST /guests` y `GET /guests` (con filtros DNI/nombre) y `GET /guests/{id}`. Ver `specs/` para requisitos.

## Goals / Non-Goals

**Goals:**
- `PATCH /guests/{id}` con revalidación de email y unicidad de DNI.
- Borrado lógico (`DELETE /guests/{id}`) conservando reservas.
- Paginación en el listado y validación de DNI/teléfono en alta y edición.

**Non-Goals:**
- Historial de versiones de datos del huésped.
- Búsqueda de texto libre (solo filtros DNI/nombre actuales).

## Decisions

- **Borrado lógico:** agregar `activo Boolean @default(true)` a `Guest`. `DELETE` setea `activo=false`; `GET /guests` y `GET /guests/{id}` filtran `activo=true`. Las reservas referencian al huésped por FK y no se tocan.
  - Alternativa: borrado físico con `onDelete: Cascade` o bloqueo si hay reservas → el físco destruye historial; el bloqueo no cumple la spec "conserva historial". Se opta por lógico.
- **Unicidad de DNI en edición:** el service excluye al propio huésped antes de verificar duplicados (query `dni` + `id != {id}` + `activo=true`), evitando el falso 409 al no modificar el DNI.
- **Validación DNI/teléfono:** en el esquema Zod compartido (create/update):
  - `dni`: cadena alfanumérica de 6-10 caracteres (regex), obligatorio.
  - `telefono`: solo dígitos, `+`-prefijo opcional, largo 7-15; opcional.
  Se aplica igual en alta (por eso `Alta de huésped` es un requisito MODIFIED).
- **Paginación:** se reutiliza el patrón de reservas: `page` y `pageSize` como query, respuesta `{ data, pagination }`, límites de `pageSize` (1-100).
- **Errores:** `404` al no existir el huésped (mismo formato de error uniforme); `409` DNI duplicado; `422` validación.

## Risks / Trade-offs

- Los huéspedes archivados podrían seguir teniendo reservas nuevas por error → Mitigación: en creación de reserva, validar que el `guestId` corresponda a un huésped activo.
- Borrado lógico con filtro `activo=true` puede dejar datos residuales → Aceptable para MVP; un job de purga es trabajo futuro.
- Cambiar DNI a uno de un huésped archivado: se decide respetar la unicidad solo entre activos, para permitir reuso. Riesgo bajo.

## Migration Plan

1. Agregar `activo` a `Guest`; `prisma migrate dev --name add-guest-management`.
2. Actualizar esquemas Zod (DNI, teléfono, paginación) y `guest.service` (PATCH, DELETE, filtros, paginación).
3. Ajustar `POST /reservations` para validar huésped activo.
4. Tests de integración: edición, DNI duplicado en edición, borrado con reservas, paginación.
5. Rollback: migración anterior; `DELETE` lógico no borra datos físicos.

## Open Questions

- ¿Formato exacto del DNI (numérico vs alfanumérico, con puntos)? Ajuste de regex localizable en Zod sin afectar specs ni diseño.