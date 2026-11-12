## ADDED Requirements

### Requirement: Consulta de reservas por rango para calendario

El sistema SHALL exponer `GET /api/v1/reservations/calendar` para usuarios autenticados, recibiendo `desde` y `hasta` en formato `YYYY-MM-DD`, y SHALL devolver todas las habitaciones y las reservas que ocupan noches dentro de `[desde, hasta)`. La respuesta SHALL incluir, para cada habitación, su id, número, tipo y estado; y para cada reserva, su id, habitación, código de confirmación, fechas `checkIn`/`checkOut`, estado y nombre del huésped. Una reserva SHALL incluirse solo si su estado es `CONFIRMADA`, `EN_CURSO` o `FINALIZADA` y si `checkIn < hasta` y `checkOut > desde`. Las reservas en estado `CANCELADA` o `NO_SHOW` SHALL NOT incluirse. Un rango inválido (fecha ausente, con formato distinto de `YYYY-MM-DD` o con `desde` mayor o igual a `hasta`) SHALL responder `422`.

#### Scenario: Consulta exitosa del rango

- **WHEN** un usuario autenticado consulta `/api/v1/reservations/calendar?desde=2026-11-01&hasta=2026-12-01`
- **THEN** el sistema responde `200` con todas las habitaciones y las reservas vigentes que se solapan con el rango

#### Scenario: Reserva fuera del rango

- **WHEN** una reserva termina antes de `desde` o comienza en `hasta` o después
- **THEN** esa reserva no se incluye en la respuesta

#### Scenario: Reserva cancelada o no-show

- **WHEN** una reserva que se solapa con el rango está en estado `CANCELADA` o `NO_SHOW`
- **THEN** esa reserva no se incluye en la respuesta

#### Scenario: Recambio el mismo día

- **WHEN** una reserva tiene `checkOut` igual a `desde`, o cuando otra reserva tiene `checkIn` igual a `hasta`
- **THEN** esas reservas no se incluyen porque no ocupan ninguna noche del rango

#### Scenario: Rango inválido

- **WHEN** se consulta el endpoint sin `desde` o `hasta`, con un formato inválido o con `desde` mayor o igual a `hasta`
- **THEN** el sistema responde `422` con un error de validación

#### Scenario: Sin autenticación

- **WHEN** se consulta el endpoint sin token válido
- **THEN** el sistema responde `401`
