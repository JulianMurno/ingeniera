## Context

Ver `proposal.md` para la motivación y `specs/public-landing/spec.md` para el contrato de comportamiento. El frontend actual es Next.js 15 con App Router en `src/frontend`, servido por Express en el mismo origen (`src/server.js`). `app/layout.js` envuelve todas las rutas con `Nav` y un `<main className="container">`; `app/page.js` es hoy el dashboard del personal. El único sistema de estilos es `app/globals.css`, basado en variables CSS y clases globales. No hay librería de iconos, framework de UI ni tests de frontend; la validación disponible es `npm run lint`, `npm run build` y verificación manual.

Restricciones relevantes:

- La ruta `/` es usada por el login del personal (`app/login/page.js`), por la marca y el enlace "Panel" de `components/Nav.jsx`, y por `components/RequireGuest.jsx` cuando un no-huésped intenta entrar al portal.
- El portal de huéspedes ya vive en `/portal`; el landing no debe duplicar sus pantallas ni la lógica de disponibilidad.
- No se deben agregar dependencias para iconos, fuentes o animaciones si se pueden resolver con SVG y CSS.
- Express entrega todo lo que no sea `/api/*` o `/health` a Next.js, por lo que los assets estáticos de `src/frontend/public` son servidos por el handler de Next.

## Goals / Non-Goals

**Goals:**

- Publicar un landing público completo en `/` sin afectar la API ni la lógica de reservas.
- Reutilizar los flujos existentes de `/portal`, `/portal/login` y `/login` mediante CTAs.
- Establecer una identidad visual propia de Mirador del Sol con variables CSS, iconos SVG inline y un fondo de pantalla local.
- Implementar tema claro/oscuro sin parpadeo, con preferencia del sistema y persistencia local.
- Mantener el panel del personal y el portal de huéspedes funcionando, con el panel reubicado en `/panel`.

**Non-Goals:**

- No se agrega buscador de disponibilidad, tarifas ni reserva directa en el landing.
- No se modifica el backend, Prisma, endpoints ni reglas de negocio.
- No se incorpora CMS, internacionalización ni gestión de contenido editable.
- No se rediseñan las pantallas internas del personal ni el portal de huéspedes; solo se actualiza la marca y el destino del panel.
- No se agregan fotografías remotas ni fuentes externas; el hero usa arte SVG local.

## Decisions

### 1. Landing como página en `/` y dashboard movido a `/panel`

`app/page.js` pasa a renderizar el landing público. El contenido actual del dashboard se traslada sin cambios funcionales a `app/panel/page.js`. Se actualizan los destinos: login del personal a `/panel`, enlace "Panel" y marca del personal a `/panel`, y `RequireGuest` redirige a `/panel` cuando el usuario no es huésped.

**Rationale:** el pedido define el landing como portal principal de la página; la raíz es la URL natural para la cara pública. Mantener el dashboard en `/panel` evita mezclar navegación pública con gestión interna y conserva todas las rutas de gestión existentes.

**Alternativas consideradas:** (a) landing en `/inicio` manteniendo `/` como dashboard: no cumple la expectativa de portal principal; (b) landing en `/landing` y dashboard en `/`: deja la raíz interna y obliga a un enlace extra; (c) mostrar el landing a visitantes y el dashboard a usuarios autenticados en la misma `/`: mezcla dos superficies y complica el layout y la navegación.

### 2. Layout condicional con `AppShell` en lugar de duplicar layouts

Se extrae la estructura de `app/layout.js` a un componente cliente `components/AppShell.jsx` que usa `usePathname`. En `/` renderiza solo `{children}` (el landing controla su propio header y ancho completo); en el resto de rutas mantiene `<Nav />` y `<main className="container">{children}</main>`.

**Rationale:** el landing necesita un header propio con anclas, CTA y toggle de tema, y no debe mostrar la navegación de gestión. `AppShell` evita mover decenas de páginas a route groups y mantiene intacto el layout del panel y del portal.

**Alternativas consideradas:** (a) route groups con layouts separados: más idiomático, pero obliga a mover todas las rutas existentes y aumenta el riesgo de regresiones; (b) hacer que `Nav` decida qué mostrar: insuficiente porque el `<main className="container">` seguiría limitando el ancho del landing.

### 3. Tema por atributo en `<html>` con CSS variables y script previo a la pintura

El tema se aplica con `data-landing-theme="light|dark"` en `<html>`. La landing define tokens con prefijo `--ml-*` y usa selectores `:root[data-landing-theme='dark'] .landing` para el modo oscuro. Un script inline mínimo en `app/layout.js` (antes de la hidratación) lee `localStorage['mirador-theme']`; si no existe, usa `window.matchMedia('(prefers-color-scheme: dark)')`, y setea el atributo. `components/landing/ThemeToggle.jsx` alterna el atributo, guarda la elección y muestra el icono sol/luna. El `<html>` lleva `suppressHydrationWarning` para tolerar el atributo agregado antes de React.

**Rationale:** aplicar el tema en el documento antes de pintar elimina el flash del tema contrario y evita un estado de React que pueda diferir del HTML del servidor. Al mantener los tokens bajo `.landing`, el resto del panel conserva su paleta actual.

**Alternativas consideradas:** (a) tema en un contexto React con `useEffect`: produce parpadeo en la primera carga y un render inicial incorrecto; (b) tema global en `:root` para toda la app: cambiaría el panel y el portal sin que este cambio lo requiera; (c) solo `prefers-color-scheme` sin toggle: no cumple el control manual solicitado.

### 4. Identidad visual con tokens verde/crema y tipografía de sistema

Se definen tokens de landing en `app/landing.css` con prefijo `--ml-*`:

- Verde principal: `#1F5E46` (acciones y marca), con escala `#123B2C`, `#2A7157`, `#3C8A6B` y `#DCEBE3`.
- Crema secundario: `#FFFDF6` (superficies), `#F7F1E3` (fondo) y `#EFE6D3` (bordes suaves).
- Texto: `#17221D` y `#5A6B62` en claro; en oscuro, fondo `#0D1A14`, superficie `#14251D`, texto `#F6F1E5` y muted `#B9C8BF`.
- El modo oscuro mantiene el verde como acento pero lo aclara (`#7FC9A8`) para conservar contraste.

La tipografía de títulos usa una pila serif de sistema (`Georgia`, `Iowan Old Style`, `Palatino Linotype`, serif) y el cuerpo reutiliza la pila sans existente. Los tamaños usan `clamp()` para escalar sin media queries adicionales.

**Rationale:** el pedido fija verde y blanco crema; una escala corta y tokens semánticos permiten mantener contraste AA y coherencia sin introducir una tercera familia cromática. No se agregan fuentes externas para evitar dependencias de red y problemas de build.

### 5. Iconografía y fondo de pantalla con SVG locales

Se crea `components/landing/icons.jsx` con iconos inline (`Sun`, `Moon`, `Menu`, `Close`, `ArrowRight`, `Bed`, `Pool`, `Spa`, `Restaurant`, `Wifi`, `Parking`, `MapPin`, `Phone`, `Mail`, `Star`, `Leaf`, `Check`), todos con `viewBox="0 0 24 24"`, `stroke="currentColor"` y `aria-hidden` salvo que reciban un título accesible. El hero usa `public/landing/hero-mirador.svg` (sol, sierras y vegetación en capas) más gradientes CSS; `public/landing/grain.svg` aporta una textura sutil. Las tarjetas de habitaciones y servicios usan composiciones de gradiente, patrones y estos iconos en lugar de fotos remotas.

**Rationale:** los SVG locales no requieren dependencias, pesan poco, escalan sin pérdida y permiten que el landing se vea completo sin conexión a servicios externos. Los iconos inline heredan el color del tema y no necesitan una fuente de iconos.

### 6. Contenido centralizado en un módulo estático

Los textos de marca, hero, propuesta de valor, habitaciones destacadas, servicios, bloque de confianza y contacto viven en `app/landing-content.js` (objeto exportado). Los componentes de landing consumen ese módulo y no contienen copy duplicado.

**Rationale:** el contenido real del hotel aún no está definido; centralizarlo permite reemplazar textos y datos de contacto sin tocar la estructura ni los estilos. Deja preparada una futura integración con CMS o API sin cambiar el contrato del landing.

### 7. Estructura de componentes y estilos

- `app/page.js`: composición server-side de las secciones; importa `landing.css` y el contenido.
- `components/landing/PublicHeader.jsx`: cliente, con menú móvil (`useState`, `aria-expanded`, cierre al navegar) y `ThemeToggle`.
- `components/landing/ThemeToggle.jsx`: cliente, sin dependencias, lee/escribe el atributo y `localStorage`.
- `components/landing/Hero.jsx`, `ValueProps.jsx`, `RoomShowcase.jsx`, `Amenities.jsx`, `TrustSection.jsx`, `ContactFooter.jsx`: secciones server-side que reciben datos del módulo de contenido.
- `app/landing.css`: tokens, layout, tipografía, componentes y reglas `@media (prefers-reduced-motion: reduce)`; clases con prefijo `ml-` para no colisionar con `globals.css`.

**Rationale:** solo el header y el toggle necesitan interacción; el resto queda como server components, lo que reduce JavaScript enviado al cliente. Las clases prefijadas permiten convivir con el CSS global existente sin reescribirlo.

### 8. Accesibilidad y respuesta a tamaño de pantalla

El landing incluye un enlace "Saltar al contenido", landmarks (`header`, `nav`, `main`, `footer`), `focus-visible` consistente, textos alternativos o `aria-hidden` según corresponda y contraste AA. El menú móvil se controla con botón y atributos ARIA. Las animaciones del hero y las transiciones se desactivan o reducen con `prefers-reduced-motion`. El layout usa grid con `auto-fit`/`minmax` y breakpoints en 640 px, 900 px y 1200 px.

**Rationale:** el landing es la primera impresión del producto y debe ser usable con teclado, lectores de pantalla y dispositivos pequeños sin un costo de implementación desproporcionado.

### 9. Marca Mirador del Sol en el frontend

Además del landing, se actualiza `app/layout.js` (`metadata.title` y descripción) y las marcas visibles de `Nav.jsx` y las pantallas de login para mostrar "Mirador del Sol". El portal y el panel conservan sus funciones.

**Rationale:** el nombre de la página es Mirador del Sol; dejar "Hotel Reservas" en la cabecera interna rompería la coherencia de marca entre la cara pública y los flujos a los que deriva.

## Risks / Trade-offs

- **[Enlaces existentes a `/` que esperan el dashboard]** → Buscar y actualizar todas las referencias (`Nav`, login del personal, `RequireGuest`, enlaces de marca) y verificar manualmente login, panel, portal y landing antes de cerrar.
- **[Parpadeo de tema o warning de hidratación]** → Script inline antes de la pintura, atributo en `<html>`, CSS basado en atributo y `suppressHydrationWarning`; probar recarga con tema claro y oscuro guardados.
- **[Contraste insuficiente en crema/verde]** → Usar la escala definida con texto oscuro sobre crema y texto claro sobre verde; verificar AA en botones, badges y texto muted en ambos temas.
- **[El landing muestra navegación interna por error]** → `AppShell` no renderiza `Nav` en `/`; el landing tiene su propio `PublicHeader` sin enlaces de gestión; cubrir con revisión visual.
- **[Menú móvil inaccesible o que queda abierto]** → Botón con `aria-expanded`/`aria-controls`, cierre al seleccionar un ancla y foco visible; verificar con teclado.
- **[Peso o complejidad del hero SVG]** → Mantener el SVG en capas simples, sin filtros costosos, y usar `loading`/dimensiones explícitas; el fondo es decorativo y no bloquea el contenido.
- **[Contenido de demostración desactualizado]** → Centralizar todo el copy y los datos de contacto en `landing-content.js`; documentar que es reemplazable sin cambios estructurales.
- **[Regresión en el panel tras mover la ruta]** → Mover el archivo sin modificar su lógica y verificar que todas las acciones del dashboard siguen funcionando desde `/panel`.

## Migration Plan

1. Crear la landing, sus componentes, estilos y assets sin cambiar todavía la ruta del dashboard.
2. Mover el dashboard actual a `app/panel/page.js` y convertir `app/page.js` en el landing.
3. Actualizar `AppShell`, `Nav`, login del personal y `RequireGuest` para la nueva separación de rutas.
4. Actualizar metadata y marcas visibles a Mirador del Sol.
5. Ejecutar `npm run lint` y `npm run build`, y verificar manualmente `/`, `/panel`, `/login`, `/portal` y `/portal/login` en tema claro y oscuro y en ancho móvil.
6. **Rollback:** restaurar `app/page.js` como dashboard, eliminar `app/panel`, revertir los destinos de login/`RequireGuest`/`Nav` y quitar los assets y estilos del landing. No hay migraciones de datos ni cambios de API que revertir.

## Open Questions

- Los datos reales de contacto, dirección, habitaciones y fotografías del hotel se reemplazarán más adelante; por ahora se usan textos de demostración y arte SVG. Esto no cambia las specs ni la estructura del landing.
