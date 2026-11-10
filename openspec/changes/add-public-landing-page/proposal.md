## Why

El frontend no tiene una cara pública: la raíz `/` muestra directamente el panel interno del personal. Los visitantes no pueden conocer la propuesta de valor del hotel ni llegar a la reserva o al acceso de huéspedes desde una página de presentación. Se necesita un landing público de **Mirador del Sol** que comunique la identidad del hotel, use una paleta verde y blanco crema, funcione en modo claro y oscuro y derive a los flujos existentes sin duplicar lógica de reservas.

## What Changes

- **BREAKING (rutas de UI):** la raíz `/` pasa a ser el landing público de Mirador del Sol. El dashboard del personal se mueve de `/` a `/panel`; el login del personal, el enlace de marca y las redirecciones internas apuntan a `/panel`.
- Se crea un landing público en `/` con: navegación pública, hero con fondo de pantalla, propuesta de valor, habitaciones destacadas, servicios/comodidades, bloque de confianza y pie de página con contacto.
- CTAs del landing: "Reservar" hacia `/portal`, "Ingresar" hacia `/portal/login`, "Acceso personal" hacia `/login` y anclas internas a las secciones del landing.
- Se define la identidad visual de Mirador del Sol: paleta con verde como color principal y blanco crema como secundario, tipografía, radios, sombras y un set de iconos SVG propio (sin agregar dependencias).
- Se agrega un sistema de tema claro/oscuro para el landing: detección de preferencia del sistema, toggle visible, persistencia en `localStorage` y aplicación sin parpadeo inicial.
- Se incorpora un fondo de pantalla del hero construido con assets SVG locales y gradientes, sin depender de imágenes remotas.
- El portal de huéspedes (`/portal` y sus subrutas) y el login del personal (`/login`) conservan su comportamiento; solo cambia el destino posterior al login del personal.
- No se agregan endpoints, modelos de datos ni reglas de negocio.

## Capabilities

### New Capabilities

- `public-landing`: página pública de presentación de Mirador del Sol, identidad visual verde/crema, modo claro/oscuro y navegación hacia los accesos de huéspedes y personal.

### Modified Capabilities

<!-- Ninguna capacidad existente cambia sus requisitos. El portal de huéspedes y el panel del personal mantienen su comportamiento; el landing solo agrega una nueva superficie pública y una nueva ubicación para el dashboard. -->

## Impact

- **Frontend (Next.js App Router):** nueva página `app/page.js` como landing; el dashboard actual se traslada a `app/panel/page.js`.
- **Componentes y estilos:** nuevos componentes de landing, iconos SVG y toggle de tema; se extienden los tokens de `app/globals.css` con la paleta de Mirador del Sol y reglas de tema oscuro.
- **Assets:** SVG locales para el fondo del hero, patrón decorativo e iconografía; no se incorporan fuentes ni paquetes nuevos.
- **Navegación y sesión:** `components/Nav.jsx` reconoce la ruta pública y muestra la navegación del landing; `RequireGuest` y el login del personal redirigen a `/panel`.
- **API, base de datos y backend:** sin cambios.
- **Tests:** los tests de backend no se ven afectados. La validación del cambio se apoya en `npm run lint` y `npm run build` del frontend, más verificación visual de ambos temas y de los enlaces de navegación.
- **Riesgo principal:** el contenido del hotel (habitaciones, servicios, contacto) es de demostración y queda concentrado en un único módulo de contenido para facilitar su reemplazo posterior.
