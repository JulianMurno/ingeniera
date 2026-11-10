## Purpose

Expone el estado de salud de la API y de la base de datos y registra las operaciones sensibles del personal, garantizando trazabilidad y monitoreo del sistema.

## ADDED Requirements

### Requirement: Health check
El sistema SHALL exponer un endpoint de salud que reporte el estado de la API y de la base de datos, respondiendo `200` cuando ambos estén operativos.

#### Scenario: Sistema operativo
- **WHEN** la API y la base de datos funcionan correctamente
- **THEN** el sistema responde `200` con el estado de ambos

#### Scenario: Base de datos no disponible
- **WHEN** la base de datos no responde
- **THEN** el sistema responde `503` indicando el componente afectado

### Requirement: Registro de auditoría
El sistema SHALL registrar las operaciones sensibles (creación, modificación o cancelación de reservas, y gestión de habitaciones y usuarios) indicando autor, acción, recurso y fecha.

#### Scenario: Operación auditada
- **WHEN** el personal ejecuta una operación sensible
- **THEN** el sistema registra el evento con autor, acción, recurso y fecha

### Requirement: Consulta de auditoría
El sistema SHALL permitir a un usuario con rol `ADMINISTRADOR` consultar los registros de auditoría.

#### Scenario: Consulta autorizada
- **WHEN** un usuario con rol `ADMINISTRADOR` consulta los registros de auditoría
- **THEN** el sistema responde `200` con los registros

#### Scenario: Acceso denegado a recepcionista
- **WHEN** un usuario con rol `RECEPCIONISTA` consulta los registros de auditoría
- **THEN** el sistema responde `403`