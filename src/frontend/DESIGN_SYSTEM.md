# Design System

Frontend styling for the hotel management app: Tailwind CSS v4 utilities plus a small
set of reusable primitives in `src/frontend/components/ui/`. The public landing page
(`src/frontend/app/page.js` + `landing.css`) is intentionally outside this system.

## Installation

- `tailwindcss` and `@tailwindcss/postcss` (devDependencies), `clsx` and `tailwind-merge` (dependencies).
- `src/frontend/postcss.config.mjs` registers the `@tailwindcss/postcss` plugin.
- `src/frontend/app/globals.css` imports Tailwind CSS-first and declares the layer order:

```css
@layer theme, components, utilities;
@import './legacy.css' layer(components);
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);

@source '../app/**/*.{js,jsx}';
@source '../components/**/*.{js,jsx}';
@source '../lib/**/*.{js,jsx}';
```

Preflight is intentionally skipped (only `theme.css` and `utilities.css` are imported) so
legacy element styles keep working. Utilities are emitted in the `utilities` layer, which
wins over the `components` layer where the remaining base rules live.

`legacy.css` now only holds base heading typography. Every class-based legacy rule was
removed once all screens migrated.

## Tokens

Semantic tokens are declared in `@theme` and consumed as Tailwind utilities
(`bg-surface`, `text-muted`, `border-border-strong`, `rounded-card`, `shadow-card`, …).

| Token                                                                         | Utility examples                                  | Purpose                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------- |
| `--color-background` / `--color-background-alt`                               | `bg-background`, `bg-background-alt`              | Page background                  |
| `--color-surface` / `--color-surface-strong`                                  | `bg-surface`                                      | Cards, inputs, table headers     |
| `--color-border` / `-strong` / `-soft`                                        | `border-border`, `border-border-soft`             | Borders and dividers             |
| `--color-foreground` / `-soft`                                                | `text-foreground`                                 | Primary text                     |
| `--color-muted`                                                               | `text-muted`                                      | Secondary text, labels, captions |
| `--color-primary` / `-dark` / `-soft` / `-contrast`                           | `bg-primary`, `text-primary-contrast`             | Brand actions                    |
| `--color-success` / `-soft` / `-strong`                                       | `bg-success-soft`, `text-success-strong`          | Positive states                  |
| `--color-danger` / `-soft` / `-strong`                                        | `bg-danger`, `text-danger-strong`                 | Destructive and error states     |
| `--color-warning` / `-soft` / `-strong`                                       | `bg-warning-soft`                                 | Warning states                   |
| `--color-accent` / `-soft`                                                    | `bg-accent-soft`                                  | Maintenance / inactive states    |
| `--color-neutral-soft` / `-strong`, `--color-info-soft` / `-strong`           | `bg-neutral-soft`                                 | Pending and finished states      |
| `--radius-card`, `--radius-control`, `--radius-pill`                          | `rounded-card`, `rounded-control`, `rounded-pill` | Radii                            |
| `--shadow-card`, `--shadow-card-hover`, `--shadow-elevated`, `--shadow-modal` | `shadow-card`                                     | Elevation                        |
| `--font-sans`, `--font-display`                                               | `font-sans`, `font-display`                       | Body and heading fonts           |

Dark theme overrides the same tokens under `:root[data-landing-theme='dark']`, so no
component needs a `dark:` utility unless a token pair is not enough. The `dark:` variant
is registered as `@custom-variant dark (&:where([data-landing-theme='dark'], …))`.

Legacy token names (`--bg`, `--card`, `--border`, `--text`, `--primary`, `--danger`,
`--radius`, `--shadow*`, …) are aliased to the semantic tokens in `:root` so `landing.css`
and any remaining direct `var()` usage keep working.

## Components

All primitives are stateless, hook-free, and importable from server components.
Import them from the barrel: `import { Card, Btn } from '@/components/ui'`.
`@/components/ui` resolves to `components/ui.jsx`, which re-exports the primitives plus
`lib/constants`, `lib/format`, and `lib/search`.

| Component          | Props                                             | Variants / notes                                                                                                                                          |
| ------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button` (`Btn`)   | `variant`, `size`, native `<button>` props        | `primary`, `secondary` (default), `danger`, `ok`, `warn`, `ghost`; `sm`, `md`                                                                             |
| `buttonVariants()` | `variant`, `size`, `className`                    | Returns the class string for links styled as buttons                                                                                                      |
| `Card`             | `title`, `actions`, `className`, `children`       | Section with optional header and action slot                                                                                                              |
| `Field`            | `label`, `hint`, `error`, `className`, `children` | Label wrapper; renders hint or error below the control                                                                                                    |
| `Input`            | native `<input>` props                            | Also exports `inputClasses` for custom controls                                                                                                           |
| `Select`           | native `<select>` props                           | Reuses `inputClasses`                                                                                                                                     |
| `Alert`            | `tone`, `title`, `className`, `children`          | `error` (`role="alert"`), `success`, `warning`, `info`                                                                                                    |
| `ErrorMsg`         | `error`                                           | Alert for `{ message, details[] }` API errors                                                                                                             |
| `Msg`              | `children`                                        | Success alert, renders nothing when empty                                                                                                                 |
| `Badge`            | `kind`, `className`                               | Static state map: CONFIRMADA, PAGADA, DISPONIBLE, ACTIVO, ok, EN_CURSO, FINALIZADA, CANCELADA, down, NO_SHOW, PARCIAL, PENDIENTE, MANTENIMIENTO, INACTIVO |
| `Table`            | `headers`, `empty`, `className`, `children`       | Renders `<tr>` children; cell padding and row hover come from `[&_…]` variants                                                                            |
| `Pager`            | `pagination`, `onPage`                            | `page`, `pageSize`, `total`                                                                                                                               |
| `PageHeader`       | `title`, `description`, `actions`, `className`    | Page `<h1>` plus action slot                                                                                                                              |
| `StatCard`         | `href`, `label`, `value`, `icon`, `className`     | Optional link wrapper                                                                                                                                     |
| `EmptyState`       | `children`, `className`                           | Dashed empty placeholder                                                                                                                                  |
| `Loading`          | `children`                                        | `aria-live="polite"` loading text                                                                                                                         |

Constants and formatters live next to the primitives and are re-exported by the barrel:
`ROOM_TYPES`, `METODOS_PAGO`, `CATEGORIA_LABEL`, `UNIDAD_LABEL`, `DIAS`, `ESTADOS_RESERVA`,
`ESTADOS_PAGO` (`lib/constants.js`); `fmtMoney`, `fmtDate`, `fmtDateTime` (`lib/format.js`).

## Adoption rules

1. Prefer primitives over raw elements; prefer utilities over new CSS classes.
2. Never interpolate class names (`text-${tone}`). Use a static map keyed by the prop value,
   like `VARIANT_CLASSES` in `button.jsx`.
3. Merge caller classes with `cn()` from `@/lib/cn` so later utilities win predictably.
4. No `style={{}}` in migrated screens. Layout, spacing, and colors are utilities.
5. Interactive elements need `type` explicitly (`type="button"` outside forms,
   `type="submit"` inside a form).
6. Keep legacy class names out of new code. `legacy.css` only carries base typography;
   everything else is utilities or primitives.
7. Any new screen must render correctly in both themes and at 375 px width without
   horizontal overflow.

## Adding a component

1. Create `src/frontend/components/ui/<name>.jsx` with a static class map and `cn()` merge.
2. Keep it presentational: no hooks, no `'use client'`, no data fetching.
3. Export it from `src/frontend/components/ui/index.js` (barrel) and add a row to the table above.
4. Reuse existing tokens; add a token only if a needed semantic value is missing.
5. Verify contrast for text on the new color pairs (WCAG AA: 4.5:1 for normal text,
   3:1 for large text and UI borders).
6. Run `npm run lint`, `npm run build`, and check the screen in light, dark, and 375 px.

## Accessibility

Measured contrast ratios (WCAG 2.1, `relative luminance`) for the token pairs used by the
system. All exceed the 4.5:1 AA threshold for normal text.

| Pair                          | Light | Dark  |
| ----------------------------- | ----- | ----- |
| foreground / background       | 14.53 | 15.86 |
| foreground / surface          | 16.08 | 14.20 |
| muted / surface               | 5.56  | 9.20  |
| muted / background-alt        | 4.65  | 7.97  |
| primary-contrast / primary    | 7.51  | 9.21  |
| danger-strong / danger-soft   | 6.80  | 8.05  |
| success-strong / success-soft | 6.49  | 10.16 |
| warning-strong / warning-soft | 6.37  | 9.60  |
| neutral-strong / neutral-soft | 6.92  | 8.73  |
| info-strong / info-soft       | 9.27  | 10.10 |
| accent / accent-soft          | 4.73  | 8.72  |
| primary-dark / primary-soft   | 10.09 | 5.54  |

Additional guarantees: `Alert` uses `role="alert"` for errors and `role="status"`
otherwise; `Loading` is `aria-live="polite"`; icon-only decorations are `aria-hidden`.
