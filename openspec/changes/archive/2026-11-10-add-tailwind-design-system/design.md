## Context

Ver `proposal.md` para la motivación y `specs/design-system/spec.md` para el contrato de comportamiento.

Estado actual relevante:

- El frontend es Next.js 15 (App Router) en `src/frontend`, servido por Express en el mismo origen; `npm run build` ejecuta `next build src/frontend` desde la raíz del repo y CI usa Node 20.
- `app/globals.css` define tokens en `:root` (paleta azul) y un bloque `.branded-shell` que redefine los mismos nombres con la paleta verde/crema, más un segundo bloque para `:root[data-landing-theme='dark'] .branded-shell`.
- `app/landing.css` (913 líneas) define su propia escala `--ml-*` con prefijo de clases `ml-`; el landing queda fuera de `.branded-shell` y cumple el contrato de `public-landing`.
- `components/ui.jsx` concentra constantes de dominio, formateadores y primitivas (`Card`, `Field`, `Input`, `Select`, `Btn`, `Table`, `Badge`, `Pager`, `Loading`, `ErrorMsg`, `Msg`) con clases de `globals.css`. 21 páginas importan desde `@/components/ui`.
- Hay 47 usos de `style={{...}}` repartidos en páginas y componentes, y clases armadas por interpolación (por ejemplo `badge ${kind}`), que Tailwind no puede detectar de forma estática.
- No hay runner de tests de frontend; la validación disponible es `npm run lint`, `npm run format:check` y `npm run build`.

## Goals / Non-Goals

**Goals:**

- Dejar Tailwind operativo en el build real de Next/Express con el mínimo de configuración y sin CDN.
- Tener una única fuente de tokens semánticos que alimente utilidades, variables CSS y el tema claro/oscuro existente.
- Entregar la capa de componentes reutilizables con API compatible y clases estáticas detectables.
- Migrar shell, navegación, login del personal y panel como primera ola verificable.
- Documentar el sistema para que las pantallas restantes se migren sin decisiones nuevas.

**Non-Goals:**

- No se reescribe el landing público ni se retira `landing.css` en este cambio.
- No se migran todas las pantallas de gestión ni el portal completo; quedan preparadas y con ejemplos.
- No se agregan tests end-to-end ni un runner de tests de frontend.
- No se cambia el backend, Prisma, endpoints, rutas ni reglas de negocio.
- No se agrega una librería de componentes de terceros (Radix, shadcn, MUI) ni un sistema de variantes externo.

## Decisions

### 1. Tailwind CSS v4 con `@tailwindcss/postcss` y configuración CSS-first

Se instala `tailwindcss` y `@tailwindcss/postcss` en `devDependencies` de la raíz, se agrega `src/frontend/postcss.config.mjs` con el plugin oficial y `app/globals.css` importa Tailwind (`@import 'tailwindcss'`). La detección de clases se acota explícitamente con `@source` a `src/frontend/**/*.{js,jsx}` porque el build corre con cwd en la raíz del repo y la detección automática podría barrer `dist/`, `tests/` u `openspec/`.

**Rationale:** v4 resuelve tokens en CSS (`@theme`), que es el mismo mecanismo que ya usa el proyecto para temas; evita mantener un `tailwind.config.js` en paralelo a las variables y funciona con Next 15 y Node 20. El acotado explícito evita CSS inflado y clases accidentales de archivos ajenos al frontend.

**Alternativas consideradas:** (a) Tailwind v3 con `tailwind.config.js` y `content`: obliga a duplicar la paleta en JS y CSS y a migrar después; (b) framework de UI completo: introduce dependencias y una identidad ajena al pedido; (c) CSS Modules por componente: no da utilidades ni tokens compartidos y no resuelve la duplicación actual.

### 2. Tokens semánticos únicos con una sola identidad verde/crema

`app/globals.css` define con `@theme` un conjunto semántico (`--color-background`, `--color-surface`, `--color-border`, `--color-foreground`, `--color-muted`, `--color-primary`, `--color-danger`, `--color-success`, `--color-warning`, `--radius-*`, `--shadow-*`, `--font-*`) y lo publica también como variables CSS. Los nombres heredados (`--bg`, `--card`, `--primary`, `--radius`, `--shadow*`, etc.) quedan como alias de los tokens semánticos para no romper las reglas existentes. La identidad por defecto pasa a ser la verde/crema de Mirador del Sol; `.branded-shell` y `.landing` conservan sus overrides contextuales y el landing mantiene sus `--ml-*` apuntando a la escala compartida.

**Rationale:** hoy conviven dos identidades (azul por defecto, verde en el shell) porque los tokens se crearon en dos momentos. Unificar el valor por defecto elimina esa duplicación, refuerza la marca en el login del personal y deja un solo lugar donde cambiar la paleta. Mantener los alias hace que la migración sea óptica y no obligue a editar todas las pantallas a la vez.

**Alternativas consideradas:** (a) conservar azul por defecto y solo agregar tokens nuevos: perpetúa dos identidades y contradice el objetivo de reforzar estilos; (b) renombrar todos los tokens y reescribir las hojas de una vez: máximo riesgo de regresión visual y un diff enorme sin beneficio funcional.

### 3. Modo oscuro por atributo, con variante `dark` personalizada

Se define `@custom-variant dark (&:where([data-landing-theme='dark'], [data-landing-theme='dark'] *))` y se prefiere que los componentes consuman tokens semánticos en lugar de prefijos `dark:`; el prefijo queda para excepciones puntuales. El script previo a la pintura de `app/layout.js` no cambia.

**Rationale:** el proyecto ya resuelve el tema con `data-landing-theme` para evitar parpadeo; la variante por defecto de Tailwind (`prefers-color-scheme`) ignoraría el toggle manual. Consumir tokens en vez de `dark:` reduce clases duplicadas y mantiene una sola definición de cada color.

**Alternativas consideradas:** (a) `darkMode: 'class'` de v3 con una clase en `<html>`: obliga a tocar el script y el contrato de tema del landing; (b) duplicar cada regla con `dark:`: multiplica clases, dificulta el mantenimiento y deja el color en dos lugares.

### 4. Capa de componentes en `components/ui/` con `cn` y mapas de variantes estáticos

Se crea `src/frontend/components/ui/` con un archivo por primitiva (`button.jsx`, `card.jsx`, `field.jsx`, `input.jsx`, `select.jsx`, `table.jsx`, `badge.jsx`, `alert.jsx`, `pager.jsx`, `page-header.jsx`, `stat-card.jsx`, `empty-state.jsx`) y un `index.js` interno. Se agrega `lib/cn.js` con `clsx` + `tailwind-merge` para combinar clases resolviendo conflictos. Las variantes y tamaños se declaran en mapas de objetos estáticos; no se usa interpolación dinámica de clases ni `class-variance-authority`. `components/ui.jsx` queda como barrel que reexporta primitivas y, desde `lib/constants.js` y `lib/format.js`, las constantes de dominio y formateadores que hoy viven ahí. Las primitivas no llevan `'use client'` ni hooks, para poder usarse desde server y client components. `Badge` reemplaza el `badge ${kind}` interpolado por un mapa `estado → clases`.

**Rationale:** los mapas estáticos son la única forma de que Tailwind detecte todas las variantes en build; la interpolación dinámica es la causa más común de estilos que “desaparecen” en producción. `tailwind-merge` evita que una clase del consumidor quede anulada por el orden, y el barrel preserva los 21 imports existentes sin tocar páginas no migradas. Separar constantes y formateadores deja `ui.jsx` como superficie de UI y no de dominio.

**Alternativas consideradas:** (a) `class-variance-authority`: agrega dependencia y una capa extra para doce componentes con pocas variantes; (b) `cn` casero que solo concatena: no resuelve conflictos como `p-2` contra `p-4`; (c) mantener todo en `ui.jsx`: impide el tree-shaking por componente y mezcla responsabilidades.

### 5. Adopción por pantallas en tres olas, sin retirar CSS heredado antes de tiempo

Ola 1: `AppShell`, `Nav`, login del personal y panel. Ola 2: páginas de gestión (reservas, huéspedes, habitaciones, tarifas, disponibilidad, limpieza, mantenimiento, catálogo, consumo, reportes, usuarios, auditoría, salud). Ola 3: portal de huéspedes. Cada pantalla es un commit verificable; una regla de `globals.css` o `landing.css` se retira solo cuando no queda ningún consumidor. Las pantallas migradas reemplazan `style={{...}}` por utilidades o props de variante.

**Rationale:** el shell y el panel concentran los patrones que el resto reutiliza (card, tabla, badge, alerta, pager); migrarlos primero valida la API antes de tocar veinte pantallas. Retirar CSS antes de tiempo rompería pantallas no migradas sin que el build lo detecte.

**Alternativas consideradas:** (a) migración total en un solo commit: diff inmanejable y riesgo alto de regresión visual sin tests de UI; (b) dejar todo preparado sin migrar nada: no valida que el sistema funcione en una pantalla real.

### 6. Accesibilidad incorporada en las primitivas

`Button` conserva `focus-visible` con anillo por token y soporta `disabled`; `Alert` usa `role="alert"`; `Field` conecta label y control y propaga `aria-invalid`/`aria-describedby` cuando hay error; `Table` envuelve en un contenedor con scroll horizontal propio; `Pager` mantiene botones deshabilitados con estado accesible. Las transiciones respetan la media query de movimiento reducido que ya existe en `globals.css`.

**Rationale:** el contrato de `public-landing` ya exige teclado, foco visible y movimiento reducido; centralizar esas reglas en las primitivas evita que cada pantalla migrada las reintroduzca de forma distinta.

**Alternativas consideradas:** dejar la accesibilidad a cada pantalla: produce inconsistencias y regresiones difíciles de detectar sin tests de UI.

### 7. Verificación sin nuevo runner de tests

La verificación de cada ola es: `npm run lint`, `npm run format:check`, `npm run build`, inspección del CSS generado (incluye utilidades usadas y no incluye una clase centinela sin uso) y recorrido manual de las pantallas migradas en tema claro y oscuro, en escritorio y ancho móvil, con teclado. Los tests de backend no cambian.

**Rationale:** no hay infraestructura de tests de frontend y agregarla excede el pedido; el build es la señal objetiva de que las clases se compilan y el recorrido manual cubre lo visual. La clase centinela detecta que el acotado de `@source` funciona.

**Alternativas consideradas:** (a) Playwright end-to-end: valioso pero implica infraestructura, datos y tiempo fuera de alcance; (b) snapshot de CSS: frágil ante cualquier clase nueva.

### 8. Documentación en el repositorio

`src/frontend/DESIGN_SYSTEM.md` documenta instalación, tokens, tabla de componentes con variantes, reglas de adopción, convención de clases estáticas y el procedimiento para agregar un componente (ubicación, props, variantes, export en el barrel).

**Rationale:** el cambio se apoya en que el resto de las pantallas se migren después sin repetir decisiones; sin documentación la adopción se vuelve interpretación.

## Risks / Trade-offs

- **[Clases dinámicas que Tailwind no detecta]** → prohibir la interpolación de clases, mapear estados a mapas estáticos y verificar el CSS generado con una clase centinela.
- **[El build barre archivos ajenos al frontend]** → `@source` explícito a `src/frontend` y comprobación del tamaño y contenido del CSS emitido.
- **[Regresión visual al unificar la paleta por defecto]** → migrar primero login y panel, comparar ambos temas y ancho móvil, y conservar los alias de tokens para el resto de las pantallas.
- **[Conflicto entre clases del componente y del consumidor]** → `tailwind-merge` en `cn` y prueba explícita de composición de `className`.
- **[Doble configuración de PostCSS o resolución desde la raíz]** → un único `src/frontend/postcss.config.mjs`, dependencias en la raíz y verificación con `npm run build` desde la raíz como en CI.
- **[`components/ui.jsx` deja de ser el único origen]** → mantenerlo como barrel y verificar que una página no migrada sigue compilando sin cambios.
- **[Retiro prematuro de reglas heredadas]** → retirar solo tras buscar consumidores de cada clase y con build verde.
- **[Sin tests de UI, el error visual aparece en producción]** → checklist manual por pantalla en ambos temas y revisión del diff de cada ola antes de continuar.

## Migration Plan

1. Instalar `tailwindcss`, `@tailwindcss/postcss`, `clsx` y `tailwind-merge`; crear `src/frontend/postcss.config.mjs` e importar Tailwind en `app/globals.css` con `@source` acotado. Verificar que `npm run build` sigue sirviendo el frontend.
2. Declarar tokens semánticos en `@theme`, aliasar los nombres heredados y definir la variante `dark` por atributo. Verificar landing, panel y login en ambos temas.
3. Crear `lib/cn.js`, `lib/constants.js`, `lib/format.js` y la carpeta `components/ui/` con las doce primitivas; convertir `components/ui.jsx` en barrel.
4. Ola 1: migrar `AppShell`, `Nav`, login del personal y panel; eliminar sus estilos inline y verificar navegación, guardas de rol y estados de carga/error/vacío.
5. Ola 2: migrar las páginas de gestión en commits separados; retirar reglas de `globals.css` sin consumidores al final de la ola.
6. Ola 3: migrar el portal de huéspedes y retirar las reglas restantes sin uso.
7. Escribir `src/frontend/DESIGN_SYSTEM.md` y ejecutar la verificación completa (`lint`, `format:check`, `build`, recorrido manual).

**Rollback:** cada ola es un commit independiente; revertir la ola restaura la pantalla porque `globals.css` y `landing.css` se conservan hasta que no queden consumidores. Revertir la instalación completa implica quitar el `postcss.config.mjs`, el `@import` de Tailwind y las cuatro dependencias; no hay migraciones de datos ni cambios de API.
