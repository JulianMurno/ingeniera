## Purpose

Permite registrar y dar seguimiento a las averías e incidencias de las habitaciones, con prioridad y ciclo de vida propios, y reapartir la reinspección de la habitación antes de volver a ponerla en servicio.

## ADDED Requirements

### Requirement: Registro de incidencia de mantenimiento
El sistema SHALL permitir que cualquier usuario autenticado registre una incidencia de mantenimiento sobre una habitación existente, indicando tipo, prioridad y descripción.

#### Scenario: Incidencia registrada
- **WHEN** un usuario autenticado registra una incidencia válida para una habitación existente
- **THEN** el sistema responde `201` con la incidencia creada en estado `ABIERTO` y la habitación informándola como afectada

#### Scenario: Habitación inexistente
- **WHEN** se intenta registrar una incidencia para una habitación cuyo id no existe
- **THEN** el sistema responde `404` y no registra la incidencia

#### Scenario: Datos inválidos
- **WHEN** se intenta registrar una incidencia con tipo o prioridad no válidos
- **THEN** el sistema responde `422` y no registra la incidencia

### Requirement: Seguimiento y cierre de incidencias
El sistema SHALL controlar el ciclo de una incidencia con los estados `ABIERTO`, `EN_PROCESO`, `RESUELTO` y `CANCELADO`, y SHALL exigir la resolución registrada para cerrarla, reservando la cancelación al rol `ADMINISTRADOR`.

#### Scenario: Incidencia resuelta
- **WHEN** un usuario autenticado resuelve una incidencia con una descripción de resolución
- **THEN** el sistema la pasa a `RESUELTO` con su fecha de resolución

#### Scenario: Cierre sin resolución
- **WHEN** se intenta resolver una incidencia sin informar la resolución
- **THEN** el sistema responde `422` y la incidencia conserva su estado

#### Scenario: Transición inválida
- **WHEN** se intenta mover una incidencia a un estado no permitido desde su estado actual
- **THEN** el sistema responde `409` y no cambia el estado de la incidencia

#### Scenario: Cancelación por recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta cancelar una incidencia
- **THEN** el sistema responde `403` y la incidencia conserva su estado

### Requirement: Reinspección de la habitación al resolver una incidencia
El sistema SHALL generar una tarea de inspección de limpieza para la habitación al resolver una incidencia de mantenimiento, y SHALL NOT generar tareas duplicadas si ya existe una inspección pendiente o en curso para esa habitación.

#### Scenario: Inspección generada
- **WHEN** se resuelve una incidencia de una habitación sin inspección pendiente
- **THEN** el sistema crea una tarea de inspección para esa habitación

#### Scenario: Reintento de cierre
- **WHEN** se vuelve a intentar resolver la misma incidencia y ya existe una inspección pendiente o en curso para la habitación
- **THEN** el sistema no crea una tarea de inspección adicional

#### Scenario: Cancelación sin inspección
- **WHEN** se cancela una incidencia
- **THEN** el sistema no genera una tarea de inspección para la habitación

### Requirement: Consulta de incidencias
El sistema SHALL permitir consultar las incidencias de mantenimiento con filtros por estado, prioridad, tipo y habitación.

#### Scenario: Consulta de incidencias
- **WHEN** un usuario autenticado consulta las incidencias con filtros y paginación
- **THEN** el sistema responde `200` con las incidencias que cumplen los filtros

#### Scenario: Consulta de incidencia inexistente
- **WHEN** se consulta una incidencia cuyo id no existe
- **THEN** el sistema responde `404`