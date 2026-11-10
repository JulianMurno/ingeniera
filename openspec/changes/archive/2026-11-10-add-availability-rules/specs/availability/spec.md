## MODIFIED Requirements

### Requirement: Consulta de disponibilidad
El sistema SHALL permitir consultar las habitaciones disponibles para un rango `[checkIn, checkOut)` y, opcionalmente, filtrar por tipo y por cantidad de ocupantes. El sistema SHALL aplicar las reglas de estancia mínima y máxima configuradas y los horarios de check-in/check-out, y SHALL excluir a las habitaciones en mantenimiento y a las que no alcancen la capacidad solicitada. Una habitación NO está disponible si existe una reserva confirmada que se solapa, es decir, si `reserva.checkIn < checkOut` y `checkIn < reserva.checkOut`. Se permite el recambio el mismo día: `checkOut` igual al `checkIn` de otra reserva no impide la disponibilidad. Un rango inválido (checkIn >= checkOut, fechas ausentes o malformadas, estancia fuera de los límites, o capacidad inválida) se rechaza con `422`.

#### Scenario: Rango con disponibilidad
- **WHEN** un usuario autenticado consulta `/api/v1/availability?checkIn=...&checkOut=...` sin reservas que solapen el rango
- **THEN** el sistema responde `200` con la lista de habitaciones disponibles en ese rango

#### Scenario: Rango sin disponibilidad
- **WHEN** un usuario autenticado consulta `/api/v1/availability` con un rango totalmente cubierto por reservas confirmadas
- **THEN** el sistema responde `200` con una lista vacía de habitaciones disponibles

#### Scenario: Filtrado por tipo
- **WHEN** un usuario autenticado consulta `/api/v1/availability` indicando un `type`
- **THEN** el sistema devuelve solo las habitaciones disponibles de ese tipo

#### Scenario: Recambio el mismo día
- **WHEN** el `checkIn` consultado coincide con el `checkOut` de una reserva confirmada existente
- **THEN** el sistema considera esa habitación disponible para el nuevo rango

#### Scenario: Filtrado por ocupantes
- **WHEN** el usuario consulta disponibilidad indicando una cantidad de ocupantes
- **THEN** el sistema devuelve solo las habitaciones cuya capacidad alcanza esa cantidad

#### Scenario: Estancia menor al mínimo
- **WHEN** el rango solicitado tiene menos noches que la estancia mínima configurada
- **THEN** el sistema responde `422` y no devuelve resultados

#### Scenario: Estancia mayor al máximo
- **WHEN** el rango solicitado supera la estancia máxima configurada
- **THEN** el sistema responde `422` y no devuelve resultados

#### Scenario: Rango de fechas inválido
- **WHEN** un usuario autenticado consulta `/api/v1/availability` con `checkIn` igual o posterior a `checkOut`, con fechas faltantes o malformadas, o con una capacidad inválida
- **THEN** el sistema responde `422` con un error de validación