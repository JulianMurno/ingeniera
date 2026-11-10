## Purpose

Permite definir tarifas por temporada y por día de semana para cada tipo de habitación, de modo que el precio por noche y el total de las reservas reflejen la tarifa vigente.

## ADDED Requirements

### Requirement: Tarifa por temporada
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` definir una tarifa por noche para un tipo de habitación dentro de un rango de temporada. Las temporadas de un mismo tipo de habitación SHALL NOT superponerse.

#### Scenario: Alta de tarifa por temporada
- **WHEN** un usuario con rol `ADMINISTRADOR` define una tarifa de temporada válida para un tipo de habitación
- **THEN** el sistema la persiste y la aplica al calcular el total de las reservas en ese rango

#### Scenario: Temporadas superpuestas
- **WHEN** se define una temporada que se superpone con otra del mismo tipo de habitación
- **THEN** el sistema responde `409` y no la crea

### Requirement: Tarifa por día de semana
El sistema SHALL permitir definir una tarifa diferenciada para días de la semana concretos sobre un tipo de habitación, y SHALL usarla para calcular esas noches.

#### Scenario: Definición de tarifa de fin de semana
- **WHEN** se define una tarifa mayor para los días viernes y sábado de un tipo de habitación
- **THEN** las noches de esos días se calculan con esa tarifa y las demás con la tarifa base

### Requirement: Consulta de tarifa vigente
El sistema SHALL exponer la tarifa vigente de un tipo de habitación para un rango de fechas dado.

#### Scenario: Consulta exitosa
- **WHEN** un usuario autenticado consulta la tarifa vigente de un tipo de habitación para un rango
- **THEN** el sistema responde `200` con el detalle de la tarifa aplicable a cada noche