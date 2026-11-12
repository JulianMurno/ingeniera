## 1. Backend: endpoint de calendario

- [x] 1.1 Escribir `tests/integration/reservations-calendar.test.js` con los escenarios de la spec (rango exitoso, exclusión de `CANCELADA`/`NO_SHOW`, inclusión de `FINALIZADA`, límites `checkIn < hasta` y `checkOut > desde`, rango inválido `422`, sin token `401`) y confirmar que falla (RED) porque la ruta no existe: `npx jest tests/integration/reservations-calendar.test.js`
- [x] 1.2 Agregar `calendarQuerySchema` en `src/schemas/reservation.schema.js` (`desde`/`hasta` `YYYY-MM-DD`, `desde < hasta`) y su test unitario en `tests/unit/calendarQuerySchema.test.js`; verificar `npx jest tests/unit/calendarQuerySchema.test.js` en verde
- [x] 1.3 Agregar `findAll()` en `src/repositories/room.repository.js` y `findCalendarRange({ desde, hasta })` en `src/repositories/reservation.repository.js` con los estados que ocupan y el filtro de solapamiento; verificar con `npx eslint src/repositories` y que los tests de 1.1 ya no fallen por la consulta
- [x] 1.4 Agregar `getCalendar` en `src/services/reservation.service.js`, el controller y la ruta `GET /calendar` declarada antes de `GET /:id`; verificar `npx jest tests/integration/reservations-calendar.test.js` en verde (GREEN) y que `GET /api/v1/reservations/:id` siga respondiendo igual
- [x] 1.5 Documentar el endpoint en `src/docs/index.js` (OpenAPI) y verificar que aparece en `/api/docs` y que `npm test -- docs` pasa

## 2. Frontend: lógica de calendario

- [x] 2.1 Crear `src/frontend/lib/calendar.js` con `addDaysISO`, `buildRange(fechaInicio, dias)`, `reservationOccupies(reserva, fecha)` y `buildCalendarRows(rooms, reservations, fechas)` aplicando la precedencia reservada > mantenimiento > disponible y excluyendo `CANCELADA`/`NO_SHOW`; verificar `npm run build` y que cada escenario de estado de la spec tiene su rama

## 3. Frontend: vista y alternancia

- [x] 3.1 Crear `src/frontend/components/ReservationCalendar.jsx` con fetch del rango vía `useData`, navegación Anterior/Siguiente/Hoy, tabla con encabezado y columna de habitaciones fijos, leyenda, estados de carga/error/vacío y enlaces `/reservas/{id}` en celdas reservadas; verificar `npm run build`
- [x] 3.2 Integrar el selector "Listado" / "Calendario" en `src/frontend/app/reservas/page.js` (inicial en "Listado") sin alterar filtros, paginación ni el alta de reserva; verificar en navegador que alternar ambas vistas conserva el comportamiento del listado
- [x] 3.3 Verificar en navegador los escenarios de la spec en escritorio y mobile: celdas disponible/reservada/mantenimiento, código visible en la primera celda de una serie, enlace al detalle, navegación de rango, leyenda y estados de carga/error/vacío; registrar el resultado

## 4. Calidad y cierre

- [x] 4.1 Ejecutar `npx eslint .` y `npx prettier --check .` sin errores nuevos
- [x] 4.2 Ejecutar `npm test` completo en verde
- [x] 4.3 Ejecutar `npm run build` en verde
- [x] 4.4 Revisar `git status` y confirmar que no quedan artefactos temporales ni cambios fuera de alcance
