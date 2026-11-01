## Why

Hoy solo recepción y administración pueden crear reservas desde el panel interno; el huésped no tiene un canal propio para reservar. Se necesita un portal de autoservicio para huéspedes que opere sobre el **mismo** motor de reservas (disponibilidad, tarifas, capacidad, estados y auditoría) para evitar canales paralelos, dobles reservas y datos desincronizados.

## What Changes

- Registro y login de huéspedes con rol `HUESPED`, vinculados a su ficha de `Guest`.
- Vinculación de cuentas con fichas existentes: al registrarse, si DNI y email coinciden con una ficha activa, la cuenta se vincula a esa ficha; si no existe, se crea una ficha nueva.
- Portal de autoservicio para huéspedes: consulta de disponibilidad por rango/tipo, selección de habitación y alta de reserva.
- Las reservas creadas por huéspedes usan el mismo servicio y las mismas reglas que las de recepción/administración, y quedan en estado `CONFIRMADA`, visibles de inmediato en el panel del personal.
- Sección "Mis reservas" donde el huésped puede ver y cancelar únicamente sus propias reservas.
- Aislamiento de acceso: el huésped no puede consultar datos de otros huéspedes ni ejecutar operaciones de gestión (check-in, check-out, no-show, pagos, cargos, habitaciones, usuarios, reportes).
- Panel de recepción/administración sin cambios funcionales: sigue viendo todas las reservas, sin importar quién las creó.
- Frontend: nuevas vistas públicas/de huésped (registro, login/ingreso, reservar, mis reservas) y navegación adaptada al rol; el panel de gestión existente se mantiene.

## Capabilities

### New Capabilities

- `guest-portal`: experiencia de autoservicio del huésped: registro, inicio de sesión, consulta de disponibilidad, alta de reserva y gestión de sus propias reservas, con aislamiento de datos respecto del personal.

### Modified Capabilities

- `auth`: se incorpora el rol `HUESPED` y la emisión de tokens de huésped, con separación entre accesos de personal y de huésped.
- `guests`: se agrega la vinculación entre cuenta de huésped y ficha `Guest`, incluyendo el reclamo de fichas existentes por DNI + email sin generar duplicados.
- `reservations`: las reservas creadas por huéspedes se crean y cancelan con las mismas reglas y transacciones que las del personal, quedan en `CONFIRMADA`, son visibles para recepción/administración y solo el huésped propietario puede verlas/cancelarlas desde su cuenta.

## Impact

- **Base de datos (Prisma):** relación entre `User` y `Guest` para cuentas de huésped (rol `HUESPED`), sin duplicar la ficha del huésped; migración y backfill de datos existentes.
- **API:** endpoints de registro/login de huésped y de reservas propias; reutilización de `reservation.service`, `availability` y `rate.service`; el acceso a rutas de personal permanece restringido a `RECEPCIONISTA`/`ADMINISTRADOR`.
- **Backend:** `auth` (servicio/controlador/rutas/esquemas), `guests` (servicio/repositorio) y `reservations` (rutas/controlador con alcance por propietario), middleware de autorización por rol.
- **Frontend (Next.js):** login/registro de huésped, portal de reserva, "Mis reservas" y navegación por rol; las vistas de gestión existentes se mantienen.
- **Tests:** unitarios de vinculación de cuenta y aislamiento por propietario; integración de registro/login de huésped, reserva exitosa, solapamiento rechazado, visibilidad compartida con el personal y cancelación solo por el propietario.
- **Fuera de alcance:** pagos/cargos realizados por el huésped, modificación de reservas propias por el huésped, nuevo estado `PENDIENTE` de aprobación y notificaciones nuevas fuera de las ya existentes.
