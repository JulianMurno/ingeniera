## Purpose

Provee al hotel reportes operativos y de gestión —ocupación, ingresos y reservas por tipo de habitación— para un rango de fechas dado.

## ADDED Requirements

### Requirement: Reporte de ocupación
El sistema SHALL permitir consultar la ocupación del hotel para un rango de fechas, expresada en noches ocupadas y porcentaje de ocupación.

#### Scenario: Consulta de ocupación
- **WHEN** un usuario autenticado consulta el reporte de ocupación para un rango de fechas
- **THEN** el sistema responde `200` con las noches ocupadas y el porcentaje de ocupación

#### Scenario: Rango inválido
- **WHEN** el rango consultado es inválido (checkIn igual o posterior a checkOut)
- **THEN** el sistema responde `422`

### Requirement: Reporte de ingresos
El sistema SHALL permitir consultar los ingresos generados para un rango de fechas, a partir de las reservas y sus pagos.

#### Scenario: Consulta de ingresos
- **WHEN** un usuario autenticado consulta el reporte de ingresos para un rango de fechas
- **THEN** el sistema responde `200` con el total de ingresos del período

### Requirement: Reporte de reservas por tipo de habitación
El sistema SHALL permitir consultar la cantidad de reservas por tipo de habitación para un rango de fechas.

#### Scenario: Consulta por tipo
- **WHEN** un usuario autenticado consulta el reporte de reservas por tipo de habitación
- **THEN** el sistema responde `200` con el desglose por tipo de habitación