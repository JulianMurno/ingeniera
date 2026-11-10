# tasks.md — extend-reservations-lifecycle

## 1. Modelo y datos

- [x] 1.1 Agregar a `Reservation` los campos `adultos Int @default(1)`, `menores Int @default(0)`, `codigo String?`, `notas String?`, `motivoCancelacion String?` y `multaCancelacion Int @default(0)` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [x] 1.2 Ejecutar un script de backfill que asigne `codigo` único (`HR-` + 6 caracteres) a las reservas existentes; verificar que no quedan `codigo` nulos ni duplicados.
- [x] 1.3 Agregar índice de unicidad a `codigo`; verificar que `prisma migrate` lo aplica.

## 2. Máquina de estados

- [x] 2.1 Crear un helper de transiciones válidas (`CONFIRMADA → EN_CURSO`, `EN_CURSO → FINALIZADA`, `CONFIRMADA → CANCELADA`, `CONFIRMADA → NO_SHOW`) y rechazar las demás con `409`; verificar con tests unitarios.
- [x] 2.2 Implementar `POST /reservations/{id}/checkin`; verificar test `200` y `409` para una reserva no confirmada.
- [x] 2.3 Implementar `POST /reservations/{id}/checkout`; verificar test `200` y `409` para una reserva no en curso.
- [x] 2.4 Implementar `POST /reservations/{id}/no-show` liberando el rango; verificar test que el rango queda disponible de nuevo.
- [x] 2.5 Actualizar la cancelación para registrar `motivoCancelacion` y `multaCancelacion`, y prohibir cancelar reservas `EN_CURSO`/`FINALIZADA` (`409`); verificar tests.

## 3. Validaciones

- [x] 3.1 Validar ocupantes (`adultos`/`menores`) en create/update contra `Room.capacidad` (`422`); verificar test dentro y fuera de capacidad.
- [x] 3.2 Validar temporalmente las reservas: `checkIn` no pasado, antelación mínima y duración máxima (`422`); verificar tests de los tres casos en create y update.
- [x] 3.3 Asignar `codigo` de confirmación único al crear y devolverlo en el detalle; verificar test de unicidad (reintento ante colisión).
- [x] 3.4 Implementar la política antioverbooking: la suma de ocupantes de reservas confirmadas solapadas no puede superar la capacidad de la habitación (`409`); verificar test de exceso de ocupación.

## 4. Notificaciones

- [x] 4.1 Crear `notifications.service` con transporte "log" por defecto y SMTP cuando `SMTP_URL` esté definida; verificar con un spy que `sendEmail` se invoca con el destinatario y asunto correctos.
- [x] 4.2 Enviar email de confirmación al crear una reserva y de cancelación al cancelarla; verificar tests que el transporte registra ambos eventos.

## 5. Cierre

- [x] 5.1 Documentar en `src/docs/index.js` los nuevos estados, campos y endpoints; verificar que `/api/docs` los refleja.
- [x] 5.2 Actualizar README; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.