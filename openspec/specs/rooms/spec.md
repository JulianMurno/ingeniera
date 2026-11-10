# Rooms Specification

## Purpose

Permite al personal administrador gestionar el catálogo de habitaciones del hotel (alta, listado, edición y borrado), manteniéndolo como referencia para la disponibilidad y las reservas.

## Requirements

### Requirement: Alta de habitación restringida
El sistema SHALL permitir registrar una habitación (número, tipo y tarifa) únicamente a un usuario con rol `ADMINISTRADOR`. Un número de habitación duplicado se rechaza con conflicto.

#### Scenario: Alta autorizada
- **WHEN** un usuario con rol `ADMINISTRADOR` envía datos válidos a `/api/v1/rooms`
- **THEN** el sistema crea la habitación y responde `201` con sus datos

#### Scenario: Número duplicado
- **WHEN** se intenta registrar una habitación con un número ya existente
- **THEN** el sistema responde `409` con un código de conflicto y no crea la habitación

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` intenta registrar una habitación
- **THEN** el sistema responde `403` y no crea la habitación

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

### Requirement: Edición de habitación restringida
El sistema SHALL permitir modificar una habitación (p. ej. tipo o tarifa) únicamente a un usuario con rol `ADMINISTRADOR`. Si la habitación no existe, el sistema responde `404`.

#### Scenario: Edición autorizada
- **WHEN** un usuario con rol `ADMINISTRADOR` actualiza `/api/v1/rooms/{id}` de una habitación existente
- **THEN** el sistema aplica los cambios y responde con los datos actualizados

#### Scenario: Edición inexistente
- **WHEN** se intenta modificar una habitación cuyo id no existe
- **THEN** el sistema responde `404`

### Requirement: Borrado de habitación restringido
El sistema SHALL permitir eliminar una habitación únicamente a un usuario con rol `ADMINISTRADOR`. Si la habitación no existe, el sistema responde `404`.

#### Scenario: Borrado autorizado
- **WHEN** un usuario con rol `ADMINISTRADOR` elimina `/api/v1/rooms/{id}` de una habitación existente
- **THEN** el sistema elimina la habitación y responde confirmando la eliminación

#### Scenario: Borrado inexistente
- **WHEN** se intenta eliminar una habitación cuyo id no existe
- **THEN** el sistema responde `404`

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
