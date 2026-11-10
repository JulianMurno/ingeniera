# Public Landing Specification

## Purpose

Presenta públicamente a Mirador del Sol como portal principal del frontend, comunica su propuesta de valor con una identidad verde y blanco crema, y deriva a los flujos existentes de reserva y de acceso del personal.

## Requirements

### Requirement: Landing público en la raíz
El sistema SHALL publicar el landing de Mirador del Sol en `/` y SHALL permitir su acceso sin autenticación. El landing SHALL mostrar el nombre del hotel, una propuesta de valor y llamadas a la acción hacia la reserva y el acceso de huéspedes. El landing SHALL NOT exponer la navegación de gestión del personal.

#### Scenario: Visitante sin sesión accede al landing
- **WHEN** un visitante sin sesión solicita `/`
- **THEN** el sistema responde con el landing público de Mirador del Sol y no lo redirige a un login

#### Scenario: El landing no expone la gestión interna
- **WHEN** se renderiza el landing público
- **THEN** la navegación visible solo ofrece secciones del landing y accesos a reserva, portal de huéspedes y login del personal, sin enlaces a reservas, huéspedes, habitaciones, tarifas, limpieza, mantenimiento, extras, reportes, usuarios ni auditoría

#### Scenario: Usuario autenticado accede al landing
- **WHEN** un usuario con sesión de personal o de huésped solicita `/`
- **THEN** el sistema muestra el landing público sin cerrar su sesión

### Requirement: Navegación pública y llamadas a la acción
El landing SHALL incluir una cabecera con la marca Mirador del Sol, enlaces a sus secciones internas y un control de tema. SHALL ofrecer llamadas a la acción que lleven a la reserva de huéspedes en `/portal`, al inicio de sesión de huéspedes en `/portal/login` y al acceso del personal en `/login`.

#### Scenario: Acción de reserva
- **WHEN** el visitante activa la llamada a la acción de reserva
- **THEN** el sistema lo dirige a `/portal`

#### Scenario: Acción de ingreso de huésped
- **WHEN** el visitante activa el acceso de huéspedes
- **THEN** el sistema lo dirige a `/portal/login`

#### Scenario: Acción de acceso del personal
- **WHEN** el visitante activa el acceso del personal
- **THEN** el sistema lo dirige a `/login`

#### Scenario: Navegación por secciones
- **WHEN** el visitante activa un enlace de la cabecera hacia una sección del landing
- **THEN** el sistema desplaza la vista a esa sección sin abandonar la página

### Requirement: Contenido de presentación del hotel
El landing SHALL presentar, como mínimo, un hero con el nombre Mirador del Sol, una descripción breve, habitaciones destacadas, servicios o comodidades, un bloque de confianza y un pie con datos de contacto. Este contenido SHALL ser informativo y no SHALL consultar disponibilidad, tarifas ni reservas en tiempo real.

#### Scenario: Secciones visibles
- **WHEN** el visitante recorre el landing
- **THEN** encuentra las secciones de presentación, habitaciones, servicios, confianza y contacto

#### Scenario: Sin dependencia de disponibilidad
- **WHEN** el visitante carga el landing sin sesión y sin datos de habitaciones
- **THEN** el landing se muestra completo usando contenido de presentación, sin errores por falta de disponibilidad o tarifas

### Requirement: Identidad visual verde y blanco crema
El landing SHALL usar el verde como color principal y el blanco crema como color secundario en superficies, tipografía, botones, enlaces y estados. SHALL incorporar iconografía y un fondo de pantalla propios del landing, y SHALL mantener contraste legible entre texto y fondo en ambos temas.

#### Scenario: Paleta consistente
- **WHEN** el visitante recorre las secciones y las llamadas a la acción
- **THEN** los elementos interactivos y las superficies usan la paleta verde y crema definida para Mirador del Sol, sin colores principales heredados de otra identidad

#### Scenario: Legibilidad
- **WHEN** el landing se muestra en modo claro o en modo oscuro
- **THEN** el texto y los controles mantienen contraste suficiente para leerse y distinguirse

### Requirement: Modo claro y modo oscuro
El landing SHALL ofrecer modo claro y modo oscuro. En la primera visita SHALL usar la preferencia de tema del sistema operativo; el visitante SHALL poder alternar el tema desde la cabecera. La elección SHALL persistir entre visitas y el tema SHALL aplicarse sin mostrar brevemente el tema opuesto al cargar.

#### Scenario: Primera visita sin preferencia guardada
- **WHEN** un visitante sin preferencia guardada abre el landing con el sistema en modo oscuro
- **THEN** el landing se muestra en modo oscuro

#### Scenario: Alternar el tema
- **WHEN** el visitante activa el control de tema
- **THEN** el landing cambia entre modo claro y modo oscuro y el control refleja el tema activo

#### Scenario: Persistencia del tema
- **WHEN** el visitante elige un tema y vuelve a abrir o recarga el landing
- **THEN** el landing se muestra en el tema elegido, con independencia de la preferencia del sistema

#### Scenario: Sin parpadeo de tema
- **WHEN** el landing se carga con un tema guardado
- **THEN** el contenido se presenta directamente en ese tema, sin mostrar primero el tema contrario

### Requirement: Separación entre landing, panel y portal
El sistema SHALL mantener tres superficies diferenciadas: landing público en `/`, panel de gestión del personal en `/panel` y portal de huéspedes en `/portal`. El inicio de sesión del personal SHALL dirigir a `/panel`. Un usuario autenticado que no sea huésped y acceda a una vista exclusiva del portal de huéspedes SHALL ser dirigido a `/panel`.

#### Scenario: Login del personal
- **WHEN** un usuario de personal inicia sesión con credenciales válidas
- **THEN** el sistema lo dirige a `/panel` y no a la raíz pública

#### Scenario: Personal intenta entrar al portal de huéspedes
- **WHEN** un usuario con rol `RECEPCIONISTA` o `ADMINISTRADOR` accede a una vista exclusiva del portal de huéspedes
- **THEN** el sistema lo dirige a `/panel`

#### Scenario: Panel del personal accesible
- **WHEN** un usuario de personal autenticado solicita `/panel`
- **THEN** el sistema muestra el dashboard de gestión con la misma información y acciones que antes de este cambio

### Requirement: Uso responsable del landing
El landing SHALL ser navegable por teclado, SHALL mostrar foco visible en los controles interactivos y SHALL respetar la preferencia de movimiento reducido del sistema para las animaciones decorativas.

#### Scenario: Navegación por teclado
- **WHEN** el visitante recorre el landing con la tecla Tab
- **THEN** puede alcanzar y activar los enlaces, botones y el control de tema, y el foco es visible

#### Scenario: Movimiento reducido
- **WHEN** el sistema operativo tiene activada la preferencia de movimiento reducido
- **THEN** el landing evita o reduce las animaciones decorativas
