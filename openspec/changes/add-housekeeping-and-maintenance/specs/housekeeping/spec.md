## Purpose

Permite al personal del hotel programar y seguir la limpieza e inspección de cada habitación, deducir si una habitación está limpia a partir de esas tareas y mostrar la carga de trabajo pendiente.

## ADDED Requirements

### Requirement: Programación de tareas de limpieza
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` programar una tarea de limpieza o inspección para una habitación existente, indicando tipo y fecha programada, y opcionalmente un responsable del personal.

#### Scenario: Tarea programada
- **WHEN** un usuario con rol `ADMINISTRADOR` programa una tarea de limpieza para una habitación existente
- **THEN** el sistema responde `201` con la tarea creada en estado `PENDIENTE`

#### Scenario: Habitación inexistente
- **WHEN** se intenta programar una tarea para una habitación cuyo id no existe
- **THEN** el sistema responde `404` y no crea la tarea

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta programar una tarea
- **THEN** el sistema responde `403` y no crea la tarea

### Requirement: Estados y transiciones de la tarea de limpieza
El sistema SHALL controlar el ciclo de una tarea de limpieza con los estados `PENDIENTE`, `EN_PROCESO`, `LIMPIA`, `EN_INSPECCION`, `INSPECCION_OK`, `INSPECCION_FALLA` y `CANCELADA`, y SHALL rechazar cualquier transición no permitida.

#### Scenario: Transición válida
- **WHEN** se actualiza una tarea a un estado permitido por su estado actual
- **THEN** el sistema aplica el cambio y responde `200` con la tarea actualizada

#### Scenario: Transición inválida
- **WHEN** se intenta mover una tarea a un estado no permitido desde su estado actual
- **THEN** el sistema responde `409` y no cambia el estado de la tarea

#### Scenario: Estados terminales
- **WHEN** se intenta modificar una tarea en estado `INSPECCION_OK` o `CANCELADA`
- **THEN** el sistema responde `409`

### Requirement: Reclamación y ejecución de tareas por el personal
El sistema SHALL permitir que un usuario autenticado reclame una tarea sin asignar y la lleve hasta `LIMPIA` o `EN_INSPECCION`, y SHALL reservar al rol `ADMINISTRADOR` la asignación a otro usuario y la cancelación de tareas.

#### Scenario: Reclamación de tarea
- **WHEN** un usuario autenticado reclama una tarea `PENDIENTE` sin asignar
- **THEN** el sistema le asigna la tarea y la deja en `EN_PROCESO`

#### Scenario: Cancelación por recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta cancelar una tarea
- **THEN** el sistema responde `403` y la tarea conserva su estado

### Requirement: Estado de limpieza derivado de la habitación
El sistema SHALL deducir el estado de limpieza de una habitación a partir de su última tarea no cancelada, devolviendo `LIMPIA`, `EN_PROCESO`, `SUCIA` o `PENDIENTE`, y SHALL devolver `PENDIENTE` cuando la habitación no tenga tareas.

#### Scenario: Habitación con limpieza aprobada
- **WHEN** la última tarea de la habitación está en `LIMPIA` o en `INSPECCION_OK`
- **THEN** el sistema informa el estado de limpieza `LIMPIA`

#### Scenario: Habitación con inspección fallida
- **WHEN** la última tarea de la habitación está en `INSPECCION_FALLA`
- **THEN** el sistema informa el estado de limpieza `SUCIA`

#### Scenario: Habitación sin tareas
- **WHEN** la habitación no tiene ninguna tarea de limpieza
- **THEN** el sistema informa el estado de limpieza `PENDIENTE`

### Requirement: Bloqueo de check-in por habitación no limpia
El sistema SHALL impedir el check-in de una reserva cuya habitación no esté en estado de limpieza `LIMPIA` cuando la configuración de bloqueo esté activa.

#### Scenario: Check-in con la regla activa
- **WHEN** la configuración de bloqueo está activa y se registra el check-in de una reserva cuya habitación no está `LIMPIA`
- **THEN** el sistema responde `409` con un código que identifica la habitación no limpia y la reserva queda en `CONFIRMADA`

#### Scenario: Check-in con la regla desactivada
- **WHEN** la configuración de bloqueo está desactivada
- **THEN** el sistema registra el check-in sin evaluar el estado de limpieza

### Requirement: Panel e historial de limpieza
El sistema SHALL permitir consultar las tareas de limpieza con filtros por estado, tipo, habitación, responsable y fecha, y SHALL exponer el resumen de tareas por estado y por responsable.

#### Scenario: Consulta filtrada
- **WHEN** un usuario autenticado consulta las tareas de limpieza con filtros y paginación
- **THEN** el sistema responde `200` con las tareas que cumplen los filtros y los datos de paginación

#### Scenario: Resumen de carga de trabajo
- **WHEN** un usuario autenticado consulta el resumen de limpieza para una fecha
- **THEN** el sistema responde `200` con la cantidad de tareas por estado y por responsable

#### Scenario: Fecha inválida
- **WHEN** se consulta el resumen con una fecha que no es una fecha válida
- **THEN** el sistema responde `422`