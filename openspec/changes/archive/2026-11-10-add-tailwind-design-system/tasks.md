## 1. Instalación de Tailwind

- [x] 1.1 Agregar `tailwindcss`, `@tailwindcss/postcss`, `clsx` y `tailwind-merge` a `devDependencies`/`dependencies` según corresponda y verificar que `npm install` termina sin errores y actualiza `package-lock.json`.
- [x] 1.2 Crear `src/frontend/postcss.config.mjs` con el plugin `@tailwindcss/postcss` y verificar que Next lo resuelve al ejecutar `npm run build` desde la raíz del repo.
- [x] 1.3 Importar Tailwind en `src/frontend/app/globals.css` con `@source` acotado a `src/frontend/**/*.{js,jsx}` y verificar que el CSS emitido en `.next/static/css` incluye una utilidad usada en una página existente y no incluye `dist/`, `tests/` ni `openspec/`.
- [x] 1.4 Verificar que el frontend sigue sirviéndose igual: `npm run dev`, abrir `/`, `/login` y `/panel`, y confirmar que no hay errores de PostCSS ni de hidratación en consola.

## 2. Tokens y tema

- [x] 2.1 Declarar los tokens semánticos en `@theme` (`--color-background`, `--color-surface`, `--color-border`, `--color-foreground`, `--color-muted`, `--color-primary`, `--color-danger`, `--color-success`, `--color-warning`, `--radius-*`, `--shadow-*`, `--font-*`) con la paleta verde/crema como identidad por defecto y verificar que una utilidad de color y una de radio se aplican en una página de prueba temporal.
- [x] 2.2 Aliasar los nombres heredados (`--bg`, `--bg-secondary`, `--card`, `--border`, `--border-strong`, `--border-light`, `--text`, `--text-secondary`, `--muted`, `--primary`, `--primary-dark`, `--primary-light`, `--danger`, `--danger-light`, `--ok`, `--ok-light`, `--warn`, `--warn-light`, `--purple`, `--purple-light`, `--radius`, `--radius-sm`, `--shadow*`) a los tokens semánticos y verificar que las reglas existentes de `globals.css` y `landing.css` siguen aplicándose sin cambios visuales inesperados en `/`, `/panel` y `/login`.
- [x] 2.3 Definir `@custom-variant dark` sobre `[data-landing-theme='dark']` y verificar que un componente con utilidad `dark:` reacciona al toggle del landing y al atributo guardado en `localStorage`.
- [x] 2.4 Revisar contraste AA de texto normal, texto atenuado, botones y badges en ambos temas y dejar registrado el resultado en el PR de la ola.
  - Resultado medido (WCAG 2.1) en `src/frontend/DESIGN_SYSTEM.md`, sección Accessibility: 12 pares de tokens por tema, todos ≥ 4.5:1. Se corrigieron `text-danger` → `text-danger-strong` en `Field` y `salud`, el texto de los botones `danger`, y las variantes `ok`/`warn` pasaron a fondo suave con texto fuerte porque `text-white` no alcanzaba AA.

## 3. Librería de componentes

- [x] 3.1 Crear `src/frontend/lib/cn.js` con `clsx` + `tailwind-merge` y verificar con una comprobación manual que `cn('p-4', 'p-2')` conserva solo la última clase de padding.
- [x] 3.2 Extraer `ESTADOS_RESERVA`, `ESTADOS_PAGO`, `ROOM_TYPES`, `METODOS_PAGO`, `CATEGORIA_LABEL`, `UNIDAD_LABEL` y `DIAS` a `src/frontend/lib/constants.js` y `fmtMoney`, `fmtDate`, `fmtDateTime` a `src/frontend/lib/format.js`, y verificar que los valores y el formato de salida son idénticos a los actuales.
- [x] 3.3 Implementar `Button`, `Card`, `Field`, `Input`, `Select` y `Alert` en `src/frontend/components/ui/` con variantes y tamaños por mapas estáticos, reenvío de props nativas y `cn`; verificar que cada variante de `Button` renderiza su clase y que `Alert` usa `role="alert"`.
- [x] 3.4 Implementar `Table`, `Badge`, `Pager`, `PageHeader`, `StatCard` y `EmptyState`; reemplazar en `Badge` la interpolación `badge ${kind}` por un mapa estático estado → clases y verificar que cada estado conocido (CONFIRMADA, EN_CURSO, FINALIZADA, CANCELADA, NO_SHOW, PENDIENTE, PARCIAL, PAGADA, DISPONIBLE, MANTENIMIENTO, ACTIVO, INACTIVO, ok, down) tiene su clase en el CSS compilado.
- [x] 3.5 Convertir `src/frontend/components/ui.jsx` en barrel que reexporta primitivas desde `components/ui/` y constantes/formateadores desde `lib/`, y verificar que las 21 páginas que importan `@/components/ui` compilan sin modificar sus imports (`npm run build`).
- [x] 3.6 Confirmar que ninguna primitiva usa hooks ni `'use client'` y que una página server component puede importarlas; verificar con el build y con `/` (landing) sin errores de límite cliente/servidor.

## 4. Ola 1: shell, navegación, login y panel

- [x] 4.1 Migrar `src/frontend/components/AppShell.jsx` y `src/frontend/components/Nav.jsx` a utilidades y primitivas, sin estilos inline, y verificar navegación de personal, de huésped y de visitante, guardas de rol y estado activo del enlace en ambos temas y en ancho móvil.
- [x] 4.2 Migrar `src/frontend/app/login/page.js` a `Card`, `Field`, `Input`, `Button` y `Alert`, sin `style`, y verificar login válido, credenciales inválidas, estado de envío y redirección a `/panel`.
- [x] 4.3 Migrar `src/frontend/app/panel/page.js` a `PageHeader`, `StatCard`, `Card`, `Table`, `Badge` y `Alert`, sin `style`, y verificar métricas, últimas reservas, enlaces a detalle, estado de carga y estado sin datos.
- [x] 4.4 Verificar la ola 1 completa: `npm run lint`, `npm run format:check`, `npm run build`, y recorrido manual de `/`, `/login`, `/panel` y una ruta protegida sin sesión en tema claro y oscuro.

## 5. Ola 2: páginas de gestión

- [x] 5.1 Migrar `reservas` (lista y detalle), `huespedes` y `habitaciones`, y verificar listados, filtros, paginación, acciones y detalle con datos reales del entorno local.
  - Detalle verificado contra la API real: `GET /api/v1/reservations/1` → página muestra `HR-4YMUM7`, huésped, habitación, rango, ocupantes, total, pagado/saldo, acciones y el formulario de cargos. La factura se abre con "Ver factura" y muestra número, cliente, estancia, totales, pagos y saldo. Requirió la corrección de `useData.js` documentada en la sección 8.
- [x] 5.2 Migrar `tarifas`, `disponibilidad`, `catalogo` y `consumo`, y verificar que los formularios y tablas mantienen validaciones y mensajes de error visibles.
- [x] 5.3 Migrar `limpieza`, `mantenimiento`, `reportes`, `usuarios`, `auditoria` y `salud`, y verificar las acciones por rol y los estados de error del sistema.
  - `limpieza` y `mantenimiento` renderizan sus formularios en `grid gap-5 md:grid-cols-2`; `reportes` y `disponibilidad` muestran la alerta de validación de fechas (`role="alert"`) con el detalle de la API.
- [x] 5.4 Buscar reglas de `globals.css` sin consumidores tras la ola 2, retirarlas y verificar con `npm run build` y un recorrido de las pantallas no migradas que nada se rompió.
  - `legacy.css` quedó reducido a la tipografía base (`h1`, `h2`, fuente display del shell). El ritmo vertical `.branded-shell main > * + *` pasó a la utilidad `[&>*+*]:mt-6` en `AppShell`. El CSS emitido ya no contiene `.row`, `.btn`, `.card` ni `.container`.

## 6. Ola 3: portal de huéspedes

- [x] 6.1 Migrar `portal`, `portal/login`, `portal/registro`, `portal/reservar`, `portal/mis-reservas` y `portal/mis-reservas/[id]`, y verificar registro, login de huésped, reserva y consulta de reservas propias.
  - Login de huésped (`huesped@hotel.local`), listado `Mis reservas` con la reserva `HR-4YMUM7` y detalle `/portal/mis-reservas/1` con habitación, fechas, ocupantes, total y acciones de cancelación. Sin errores de consola.
- [x] 6.2 Retirar las reglas restantes sin consumidores de `globals.css` y verificar que `landing.css` sigue intacta porque el landing no se migra en este cambio.
  - `/` conserva `.landing`, paleta verde/crema, 5 secciones y el toggle de tema (`mirador-theme` en `localStorage` → `data-landing-theme`). `landing.css` no se modificó.

## 7. Documentación y cierre

- [x] 7.1 Escribir `src/frontend/DESIGN_SYSTEM.md` con instalación, tokens, tabla de componentes y variantes, reglas de adopción y procedimiento para agregar un componente, y verificar que cada componente existente figura en la tabla.
- [x] 7.2 Verificación final del cambio: `npm run lint`, `npm run format:check`, `npm run build`, `npm test` sin regresiones de backend y revisión del CSS emitido para confirmar que no hay clases sin uso ni estilos inline en las pantallas migradas.
  - `lint` limpio; `build` correcto; `test` 432/432; CSS emitido 41.8 kB con `.bg-surface` presente, sin `.row`/`.btn`/`.card`/`.container` y con `prefers-reduced-motion`. `format:check` falla por 365 archivos ya desformateados antes de este cambio (backend y tests, fuera de `src/frontend/`); los archivos de este cambio sí quedaron formateados.
  - Sin estilos inline ni clases heredadas en las 22 pantallas migradas, en tema claro y oscuro, y sin desbordamiento horizontal a 375 px.

## 8. Hallazgos y corrección de bloqueo

### 8.1 Corregido: `useData` descartaba respuestas de objeto

- Bug preexistente en `src/frontend/lib/useData.js`: `data: Array.isArray(res) ? res : res.data` descartaba las respuestas que son un objeto plano. Por eso `/reservas/[id]`, `/portal/mis-reservas/[id]`, el panel de estado de habitación de `limpieza` y la factura de reserva mostraban su estado vacío aunque la API respondía 200 con datos.
- Evidencia previa: `GET /api/v1/reservations/1` devolvía `{"id":1,...}` y la página mostraba "Reserva no encontrada"; `useData.js` y las páginas involucradas no habían cambiado en este cambio (`git show HEAD:` idéntico).
- Corrección aplicada con autorización explícita del usuario, para poder cerrar la verificación de detalle de 5.1 y 6.1:
  - `data: Array.isArray(res) ? res : (res?.data ?? res)`
  - `pagination: Array.isArray(res) ? null : (res?.pagination ?? null)`
- Verificación: `/reservas/1` con datos reales (incluida la factura), panel de estado por habitación en `/limpieza` (`Limpieza: PENDIENTE`, `Incidencias abiertas: 0`), `/portal/mis-reservas` y `/portal/mis-reservas/1`. Sin errores de consola, `npm run lint` limpio, `npm test` 432/432.
- Sin test automatizado: el frontend no tiene runner de tests de hooks (Jest corre con `testEnvironment: 'node'` y `testMatch: tests/**/*.test.js`); la verificación fue funcional en navegador sobre el build de producción.

### 8.2 Pendiente, fuera de alcance: tarifa base en detalle de reserva

- `src/frontend/app/reservas/[id]/page.js` imprime `fmtMoney(r.room?.tarifaBase)`, pero `GET /api/v1/reservations/:id` devuelve `room.tarifa` (12.000) y no `tarifaBase`; el detalle muestra "tarifa base $0".
- Confirmado preexistente: la línea es idéntica en `git show HEAD:src/frontend/app/reservas/[id]/page.js`. No se corrigió para no ampliar el alcance de este cambio.
