## Purpose

Envía notificaciones por email a los huéspedes cuando se confirma o se cancela una reserva, manteniendo informado al cliente sobre el estado de su estadía.

## ADDED Requirements

### Requirement: Notificación de confirmación
El sistema SHALL enviar un email de confirmación al email del huésped cuando se crea una reserva confirmada, incluyendo el código de confirmación, las fechas del rango y la habitación.

#### Scenario: Confirmación de reserva
- **WHEN** se crea una reserva confirmada
- **THEN** el sistema envía un email de confirmación al correo del huésped

### Requirement: Notificación de cancelación
El sistema SHALL enviar un email de cancelación al email del huésped cuando se cancela una reserva.

#### Scenario: Cancelación de reserva
- **WHEN** una reserva pasa al estado `CANCELADA`
- **THEN** el sistema envía un email de cancelación al correo del huésped