## ADDED Requirements

### Requirement: Estado de mantenimiento de habitación
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` marcar una habitación como `MANTENIMIENTO` o `DISPONIBLE`, y SHALL excluir de la disponibilidad a las habitaciones en estado `MANTENIMIENTO` aunque no tengan reservas que solapen.

#### Scenario: Puesta en mantenimiento
- **WHEN** un usuario con rol `ADMINISTRADOR` marca una habitación como `MANTENIMIENTO`
- **THEN** la habitación deja de aparecer como disponible en los rangos consultados

#### Scenario: Regreso a disponible
- **WHEN** un usuario con rol `ADMINISTRADOR` vuelve a marcar la habitación como `DISPONIBLE`
- **THEN** la habitación vuelve a considerarse disponible

### Requirement: Capacidad y datos descriptivos de la habitación
El sistema SHALL registrar la capacidad (ocupantes máximos) y datos descriptivos opcionales de cada habitación (descripción, comodidades y fotos), validando que la capacidad sea mayor que cero.

#### Scenario: Registro con capacidad
- **WHEN** se registra o edita una habitación con capacidad y datos descriptivos válidos
- **THEN** el sistema los persiste y los devuelve en el detalle

#### Scenario: Capacidad inválida
- **WHEN** se registra o edita una habitación con capacidad cero o negativa
- **THEN** el sistema responde `422` y no aplica el cambio

## MODIFIED Requirements

### Requirement: Listado de habitaciones
El sistema SHALL permitir consultar el listado de habitaciones del hotel, con filtros opcionales por tipo, tarifa, estado o disponibilidad en un rango de fechas, y con soporte de paginación.

#### Scenario: Listado exitoso
- **WHEN** un usuario autenticado consulta `/api/v1/rooms`
- **THEN** el sistema responde `200` con las habitaciones del hotel

#### Scenario: Listado con filtros
- **WHEN** un usuario autenticado consulta `/api/v1/rooms` con filtros de tipo, tarifa, estado o disponibilidad
- **THEN** el sistema responde `200` solo con las habitaciones que cumplen los filtros

#### Scenario: Listado paginado
- **WHEN** un usuario autenticado consulta `/api/v1/rooms` indicando página y tamaño de página
- **THEN** el sistema responde `200` con la página solicitada y los datos de paginación