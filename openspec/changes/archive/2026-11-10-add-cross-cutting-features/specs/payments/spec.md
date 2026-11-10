## Purpose

Registra los pagos realizados por los huéspedes contra sus reservas, calcula el saldo pendiente y genera la facturación del servicio prestado por el hotel.

## ADDED Requirements

### Requirement: Registro de pago
El sistema SHALL permitir registrar un pago asociado a una reserva, con monto, método y fecha, y SHALL permitir pagos parciales o totales.

#### Scenario: Pago total
- **WHEN** se registra un pago cuyo monto cubre el total de la reserva
- **THEN** el sistema lo registra y la reserva queda pagada

#### Scenario: Pago parcial
- **WHEN** se registra un pago por un monto menor al total de la reserva
- **THEN** el sistema lo registra y deja un saldo pendiente

### Requirement: Estado de pago de la reserva
El sistema SHALL derivar el estado de pago de una reserva (`PENDIENTE`, `PARCIAL` o `PAGADA`) a partir de la suma de sus pagos comparada con el total.

#### Scenario: Consulta del estado de pago
- **WHEN** se consulta el detalle de una reserva
- **THEN** el sistema devuelve el estado de pago y el saldo pendiente

### Requirement: Generación de factura
El sistema SHALL generar una factura para una reserva que incluya el detalle de noches, tarifa vigente, total y los pagos registrados.

#### Scenario: Factura generada
- **WHEN** un usuario autenticado solicita la factura de una reserva existente
- **THEN** el sistema responde con el detalle de la factura

#### Scenario: Factura de reserva inexistente
- **WHEN** se solicita la factura de una reserva cuyo id no existe
- **THEN** el sistema responde `404`