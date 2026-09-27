# tasks.md — add-availability-rules

> Depende de `extend-rooms-management` para el campo `capacidad`; si se implementa antes, backfirear `capacidad = 1` en las habitaciones existentes.

## 1. Modelo y configuración

- [x] 1.1 Crear los modelos `Season { id, roomType, fechaInicio, fechaFin, tarifa }` y `WeekdayRate { id, roomType, diaSemana, tarifa }` en `prisma/schema.prisma`; verificar que `npm run prisma:migrate` y `npm run prisma:generate` corren sin errores.
- [x] 1.2 Agregar índices para evitar temporadas superpuestas por `roomType` y validar la superposición en service; verificar test de temporada superpuesta con `409`.
- [x] 1.3 Configurar `MIN_STAY_NIGHTS`, `MAX_STAY_NIGHTS`, `CHECK_IN_HOUR` y `CHECK_OUT_HOUR` en `.env.example`, `.env` y la carga de entorno; verificar que se leen en los services.

## 2. Tarifas

- [x] 2.1 Crear `rates.service` con `getTarifaNoche(roomType, fecha)` aplicando la precedencia weekday > season > `Room.tarifa`; verificar con tests unitarios por día (precedencia correcta).
- [x] 2.2 Implementar CRUD de tarifas para `ADMINISTRADOR` (alta de temporada y de tarifa por día); verificar tests de alta `201`, superposición `409` y acceso denegado `403`.
- [x] 2.3 Implementar la consulta de tarifa vigente por tipo y rango; verificar test `200` con el desglose por noche.
- [x] 2.4 Extender `business.service` y `reservation.service` para calcular noches/total con la tarifa vigente por noche (create y update); verificar tests que comparan totals con tarifas de temporada y de fin de semana.

## 3. Reglas de disponibilidad

- [x] 3.1 Aplicar estancia mínima y máxima en `availability.service` y en la creación/modificación de reservas (`422`); verificar tests de estancia menor al mínimo y mayor al máximo.
- [x] 3.2 Añadir filtro de disponibilidad por cantidad de ocupantes contra `Room.capacidad`; verificar test que excluye habitaciones de capacidad insuficiente.
- [x] 3.3 Extender el predicado de solapamiento para considerar `CHECK_IN_HOUR`/`CHECK_OUT_HOUR` (early check-in y late check-out en el día compartido) preservando el recambio el mismo día; verificar tests de early/late y de recambio normal permitido.
- [ ] 3.4 Verificar que las reglas de antelación/duración configuradas se comparten con `extend-reservations-lifecycle` (mismas env) y que los tests de ambos módulos pasan juntos.

## 4. Cierre

- [x] 4.1 Documentar en `src/docs/index.js` los nuevos parámetros (ocupantes, límites) y el módulo de tarifas; verificar que `/api/docs` los refleja.
- [x] 4.2 Actualizar README; verificar que `npm run lint`, `npm test` y `npm run build` corren en verde.
