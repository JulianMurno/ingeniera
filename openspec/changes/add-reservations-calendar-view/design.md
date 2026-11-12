## Context

Ver `proposal.md` para la motivación. El estado actual relevante:

- La sección Reservas (`src/frontend/app/reservas/page.js`) es un componente cliente que usa `useData` y muestra filtros + `Table` + `Pager`.
- El listado (`GET /api/v1/reservations`) filtra por una única `fecha` de estancia, tiene `pageSize` máximo 100 y no devuelve todas las reservas de un rango.
- Los estados de reserva viven en `src/lib/reservationState.js`: `CONFIRMADA`, `EN_CURSO`, `FINALIZADA`, `CANCELADA`, `NO_SHOW`. Cancelada y no-show liberan el rango según la spec de `reservations`.
- `Room.estado` solo admite `DISPONIBLE` y `MANTENIMIENTO`; no tiene ventana temporal de mantenimiento. Los `MaintenanceTicket` tampoco tienen fecha programada de inicio/fin.
- Las capas del backend son `route → controller → service → repository`; la validación de query es Zod y los errores usan `HttpError`.
- Las fechas se persisten como `DateTime` a medianoche UTC (`toDate` en `business.service.js`) y el frontend las formatea cortando los primeros 10 caracteres del ISO.
- En `reservation.routes.js`, `GET /:id` está declarado antes que cualquier ruta literal nueva; una ruta `/calendar` debe registrarse antes para no caer en la validación de `id`.
- El design system ya expone tokens semánticos y primitivas (`Btn`, `Card`, `Select`, `Loading`, `ErrorMsg`) en `src/frontend/components/ui`.

## Goals / Non-Goals

**Goals:**

- Una única consulta de lectura que devuelva habitaciones y reservas vigentes de un rango, sin paginación.
- Derivar el estado de cada celda en el cliente con una función pura y testeable manualmente contra los escenarios de la spec.
- Mantener la vista de lista intacta y alternar sin recargar la página.
- Grilla usable en escritorio y mobile (scroll horizontal, encabezado y columna de habitaciones fijos).
- Sin dependencias nuevas ni cambios de base de datos.

**Non-Goals:**

- Crear, mover o cancelar reservas desde el calendario (drag & drop o click en celda libre).
- Cambiar el estado de mantenimiento de una habitación desde el calendario.
- Persistir la vista elegida ni el rango entre recargas.
- Actualización en tiempo real; la vista se refresca al cambiar de rango o de vista.
- Programar mantenimiento por fechas: el modelo actual no lo soporta.

## Decisions

### Endpoint dedicado de rango en lugar de reutilizar el listado

Se agrega `GET /api/v1/reservations/calendar?desde&hasta`. Alternativas descartadas: una llamada al listado por cada día (30 requests y tope de 100 por página) y traer todas las reservas para filtrar en el cliente (crece sin límite y duplica la regla de solapamiento). El endpoint devuelve `{ rooms, reservations }`: todas las habitaciones ordenadas por número y las reservas que cumplen `checkIn < hasta && checkOut > desde` con estado `CONFIRMADA`, `EN_CURSO` o `FINALIZADA`.

### Estados que ocupan el calendario

Solo `CONFIRMADA`, `EN_CURSO` y `FINALIZADA` ocupan celdas; `CANCELADA` y `NO_SHOW` no, porque la spec vigente indica que liberan el rango. `FINALIZADA` se incluye para que el calendario sea correcto al mirar fechas pasadas. Alternativa descartada: devolver todos los estados y filtrar en el cliente; agrega payload y repite una regla de negocio en la UI.

### Mantenimiento a nivel de fila

`Room.estado === 'MANTENIMIENTO'` no tiene fechas, así que se pinta toda la fila de la habitación como mantenimiento en el rango visible. Si una reserva vigente cubre una noche puntual, esa celda se muestra como reservada (la reserva es más específica) y el resto de la fila queda en mantenimiento. Alternativa descartada: derivar intervalos de `MaintenanceTicket.creadoEn`/`resueltoEn`; mezclaría fechas de reporte con disponibilidad real y no representa mantenimiento futuro. Limitación aceptada y documentada.

### Derivación de celdas en un módulo puro del frontend

`src/frontend/lib/calendar.js` expone funciones puras: generar las fechas del rango como strings `YYYY-MM-DD` (sin `Date` locales para evitar corrimientos de zona horaria), decidir si una reserva ocupa una fecha comparando strings ISO (`checkIn <= fecha < checkOut`) y armar las filas habitación × fecha con su estado. La UI solo renderiza. Alternativa descartada: lógica inline en el componente, más difícil de revisar y de cubrir escenario por escenario.

El proyecto no tiene harness de tests para el frontend (Jest corre en `node` sin transform ESM/JSX), así que este módulo se verifica con el build y con los escenarios de la spec en navegador; el endpoint sí lleva tests de integración.

### Render semántico con tabla y scroll

Se usa una `<table>` dentro de un contenedor `overflow-auto` con altura máxima, `thead` sticky y primera columna sticky. Cada columna es un día; cada fila, una habitación. Alternativa descartada: grilla de `div`s con CSS grid; la tabla da encabezados y alcance de fila/columna accesibles sin trabajo extra.

Cada día ocupa ~64px para que el código `HR-XXXXXX` se lea completo, con filas de ~44px. La primera columna (~140px) muestra número y tipo de habitación.

### Representación visual

- Disponible: relleno con `bg-success-soft`.
- Reservada: contorno con `border border-primary`, fondo `bg-surface`, código `HR-XXXXXX` en tipografía pequeña y `title` con el código completo.
- En mantenimiento: sin relleno ni contorno propio; texto "Mant." en `text-muted` con `title` "En mantenimiento".

La leyenda repite estas tres representaciones. Se agrega `aria-label` por celda reservada con habitación, fecha y código para que la distinción no dependa solo del color.

### Selector de vista y rango

`vista` es estado local de la página (`'listado' | 'calendario'`, inicial `'listado'`) y se renderiza como dos `Btn` con `aria-pressed`. El calendario mantiene su propio estado de fecha inicial; por defecto `todayISO()` y 30 días. "Anterior"/"Siguiente" suman o restan 30 días; "Hoy" vuelve a `todayISO()`. El alta de reserva ("+ Nueva reserva") sigue disponible en ambas vistas.

## Risks / Trade-offs

- **Mantenimiento sin fechas** → toda la fila se pinta como mantenimiento y las fechas pasadas de una habitación hoy en mantenimiento también se ven así. Mitigación: limitación documentada en la leyenda/spec; una futura ventana de mantenimiento por fechas requeriría cambio de modelo.
- **Payload sin paginación** → con muchas habitaciones y reservas la respuesta crece. Mitigación: escala esperada de un hotel chico; el rango visible es de 30 días.
- **Ventana fija de 30 días** → puede no cubrir todo lo que el personal quiere ver. Mitigación: navegación por bloques de 30 días y decisión fácil de cambiar sin tocar la API.
- **Distinción solo por color** → accesibilidad. Mitigación: código visible, texto "Mant.", leyenda y `aria-label`/`title`.
- **Orden de rutas en Express** → si `/calendar` se registra después de `/:id`, la validación de `id` responde 422. Mitigación: declararla antes de `GET /:id` y cubrirlo con el test de integración.
- **Zona horaria** → mezclar `Date` locales con fechas UTC puede correr un día. Mitigación: generar y comparar fechas como strings `YYYY-MM-DD`.

## Migration Plan

Sin migración de datos ni de esquema. El cambio se despliega con el release normal; la vista por defecto sigue siendo el listado, así que revertir el commit de UI deja el sistema como antes. El endpoint nuevo es aditivo y no altera contratos existentes.
