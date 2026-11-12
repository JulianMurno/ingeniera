## ADDED Requirements

### Requirement: Check-in condicionado a la limpieza de la habitación
El sistema SHALL permitir deshabilitar el registro del check-in de una reserva cuya habitación no esté limpia cuando la configuración de bloqueo de limpieza esté activa, respondiendo `409` con un código que identifique el motivo.

#### Scenario: Check-in bloqueado por habitación no limpia
- **WHEN** la configuración de bloqueo está activa y se registra el check-in de una reserva cuya habitación tiene estado de limpieza distinto de `LIMPIA`
- **THEN** el sistema responde `409` con el código de habitación no limpia y la reserva permanece en `CONFIRMADA`

#### Scenario: Check-in de habitación limpia
- **WHEN** la configuración de bloqueo está activa y la habitación de la reserva está en estado de limpieza `LIMPIA`
- **THEN** el sistema registra el check-in y pasa la reserva a `EN_CURSO`

#### Scenario: Regla desactivada
- **WHEN** la configuración de bloqueo está desactivada
- **THEN** el sistema registra el check-in de la reserva sin evaluar el estado de limpieza de la habitación