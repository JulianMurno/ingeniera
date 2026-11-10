## ADDED Requirements

### Requirement: Estado de limpieza e incidencias de la habitación
El sistema SHALL exponer en el detalle de la habitación su estado de limpieza derivado y la cantidad de incidencias de mantenimiento abiertas, y SHALL responder `404` si la habitación no existe.

#### Scenario: Detalle con estado de limpieza
- **WHEN** un usuario autenticado consulta el detalle de una habitación existente
- **THEN** el sistema responde `200` con el estado de limpieza derivado y la cantidad de incidencias abiertas de la habitación

#### Scenario: Habitación inexistente
- **WHEN** se consulta el detalle de una habitación cuyo id no existe
- **THEN** el sistema responde `404`

### Requirement: Historial de limpieza e incidencias por habitación
El sistema SHALL exponer el historial de tareas de limpieza e incidencias de mantenimiento de una habitación, ordenadas de la más reciente a la más antigua.

#### Scenario: Historial de la habitación
- **WHEN** un usuario autenticado consulta el historial de una habitación existente
- **THEN** el sistema responde `200` con sus tareas de limpieza e incidencias ordenadas por fecha descendente