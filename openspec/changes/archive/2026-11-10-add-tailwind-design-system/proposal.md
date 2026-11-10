## Why

El frontend acumula estilos en dos hojas globales (`app/globals.css` y `app/landing.css`), clases ad-hoc reutilizadas por nombre y 47 estilos inline repartidos en páginas y componentes. La única capa compartida, `components/ui.jsx`, mezcla constantes de dominio con primitivas visuales, así que cada pantalla nueva vuelve a decidir estructura, espaciado y color. El resultado es inconsistencia entre landing, panel y portal, y un costo alto para cambiar la apariencia. Instalar Tailwind y formalizar una capa de componentes reutilizables resuelve la base sin reescribir todo el producto de una vez.

## What Changes

- Instalar Tailwind CSS v4 en `src/frontend` con el plugin oficial de PostCSS (`tailwindcss` + `@tailwindcss/postcss`) y conectarlo al build de Next.js 15 que ya sirve Express. Sin CDN y sin configuración duplicada.
- Definir tokens de diseño semánticos (color, tipografía, espaciado, radios, sombras) como variables CSS expuestas a Tailwind mediante `@theme`, mapeados a la paleta verde/crema de Mirador del Sol y al modo claro/oscuro existente (`data-landing-theme`).
- Crear una librería de componentes presentacionales con Tailwind en `src/frontend/components/ui/`: `Button`, `Card`, `Field`, `Input`, `Select`, `Table`, `Badge`, `Alert`, `Pager`, `PageHeader`, `StatCard` y `EmptyState`, con variantes y tamaños explícitos.
- Mantener `@/components/ui` como barrel de reexportación para que los 21 imports actuales sigan funcionando; las constantes de dominio (`ESTADOS_RESERVA`, `ROOM_TYPES`, formateadores) se mueven a módulos propios.
- Adoptar el sistema de forma incremental y sin regresión funcional: primero `AppShell`/`Nav`, login del personal y panel; después las páginas de gestión y el portal, pantalla por pantalla.
- Reemplazar los estilos inline de cada pantalla migrada por clases utilitarias y variantes de componente; conservar `globals.css` y `landing.css` mientras tengan consumidores y retirar solo las reglas sin uso.
- Documentar instalación, tokens, API de componentes y reglas de adopción en `src/frontend/DESIGN_SYSTEM.md`.
- Sin cambios de comportamiento funcional, rutas, endpoints, modelos ni reglas de negocio.

## Capabilities

### New Capabilities

- `design-system`: base de Tailwind, tokens de diseño de Mirador del Sol, capa de componentes reutilizables y reglas de adopción incremental en el frontend, preservando el contrato visual y de accesibilidad vigente.

### Modified Capabilities

<!-- Ninguna capacidad existente cambia sus requisitos. `public-landing` conserva su paleta, sus temas y su navegación; el design system es la implementación compartida que debe seguir cumpliéndolos. -->

## Impact

- **Dependencias:** `tailwindcss` y `@tailwindcss/postcss` en `devDependencies`; nuevo `src/frontend/postcss.config.mjs`; sin cambios en `next.config.mjs` salvo que el build lo requiera.
- **Estilos:** `src/frontend/app/globals.css` pasa a importar Tailwind y a declarar tokens en `@theme`; `src/frontend/app/landing.css` se mantiene y migra por partes.
- **Componentes:** `src/frontend/components/ui.jsx` se divide en `components/ui/*` (primitivas) y módulos de dominio; `AppShell`, `Nav`, login del personal y panel son las primeras pantallas migradas, seguidas por las páginas de gestión y portal.
- **Páginas:** 21 archivos importan `@/components/ui`; la adopción es incremental, sin cambios de datos ni de flujo.
- **CI:** `npm run lint` y `npm run build` ya cubren el frontend; Tailwind v4 requiere Node 20+, que el workflow ya usa. No se agregan tests de backend.
- **Riesgo principal:** regresión visual o de comportamiento al migrar pantallas; se mitiga migrando por pantallas, conservando el barrel y verificando build, lint y recorrido manual de cada pantalla migrada en tema claro y oscuro.
