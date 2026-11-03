## 1. Tokens, assets e iconografía

- [ ] 1.1 Crear `src/frontend/app/landing.css` con los tokens `--ml-*` (verde principal, crema secundario, texto y superficies) para tema claro y las variantes oscuras bajo `:root[data-landing-theme='dark'] .landing`; verificar que los colores declarados coinciden con la paleta de `design.md` y que ninguna clase usa la paleta azul del panel.
- [ ] 1.2 Crear `src/frontend/public/landing/hero-mirador.svg` (sol, sierras y vegetación en capas) y `src/frontend/public/landing/grain.svg` (textura sutil); verificar en desarrollo que `http://localhost:3000/landing/hero-mirador.svg` y `/landing/grain.svg` responden `200` sin errores.
- [ ] 1.3 Crear `src/frontend/components/landing/icons.jsx` con los iconos SVG inline `Sun`, `Moon`, `Menu`, `Close`, `ArrowRight`, `Bed`, `Pool`, `Spa`, `Restaurant`, `Wifi`, `Parking`, `MapPin`, `Phone`, `Mail`, `Star`, `Leaf` y `Check`; verificar que todos usan `currentColor`, que los decorativos tienen `aria-hidden` y que el archivo no importa dependencias nuevas.

## 2. Contenido y componentes del landing

- [ ] 2.1 Crear `src/frontend/app/landing-content.js` con el nombre Mirador del Sol, tagline, hero, propuesta de valor, habitaciones destacadas, servicios, bloque de confianza y datos de contacto de demostración; verificar que el copy vive solo en este módulo y que los componentes lo consumen desde ahí.
- [ ] 2.2 Crear `src/frontend/components/landing/ThemeToggle.jsx` que lea el atributo `data-landing-theme`, alterne entre claro y oscuro, guarde la elección en `localStorage` y exponga un `aria-label` claro; verificar que alterna el tema, que persiste tras recargar y que el icono mostrado corresponde al tema activo.
- [ ] 2.3 Crear `src/frontend/components/landing/PublicHeader.jsx` con marca, enlaces de ancla a las secciones, CTA de reserva, acceso de huéspedes, acceso del personal, toggle de tema y menú móvil; verificar que el menú abre/cierra con teclado, usa `aria-expanded`/`aria-controls` y se cierra al elegir un ancla.
- [ ] 2.4 Crear `src/frontend/components/landing/Hero.jsx` usando `hero-mirador.svg` como fondo de pantalla, el nombre Mirador del Sol y los CTAs principales; verificar que el hero se ve completo en tema claro y oscuro y que el SVG es decorativo (`aria-hidden`).
- [ ] 2.5 Crear `src/frontend/components/landing/ValueProps.jsx`, `RoomShowcase.jsx`, `Amenities.jsx`, `TrustSection.jsx` y `ContactFooter.jsx`; verificar que cada sección tiene su ancla (`#propuesta`, `#habitaciones`, `#servicios`, `#confianza`, `#contacto`) y que renderiza el contenido del módulo estático.
- [ ] 2.6 Componer `src/frontend/app/page.js` como landing público importando `landing.css`, el contenido y las secciones; verificar que `/` muestra el landing completo sin solicitar sesión y sin enlaces a la gestión interna.

## 3. Tema claro/oscuro sin parpadeo

- [ ] 3.1 Agregar en `src/frontend/app/layout.js` un script previo a la pintura que lea `localStorage['mirador-theme']` o `prefers-color-scheme` y setee `data-landing-theme` en `<html>`; agregar `suppressHydrationWarning` al elemento `<html>`; verificar que no hay warning de hidratación y que el tema guardado aparece desde el primer frame.
- [ ] 3.2 Verificar la matriz de temas: sin preferencia + sistema oscuro, sin preferencia + sistema claro, preferencia guardada clara y preferencia guardada oscura; comprobar que en los cuatro casos el landing arranca en el tema esperado y que el toggle puede cambiarlo.

## 4. Layout condicional y separación de rutas

- [ ] 4.1 Crear `src/frontend/components/AppShell.jsx` con `usePathname` que en `/` renderice solo `{children}` y en el resto mantenga `<Nav />` y `<main className="container">{children}</main>`; actualizar `app/layout.js` para usar `AppShell`; verificar que `/` ocupa ancho completo sin la barra de gestión y que `/panel` y `/portal` conservan la navegación y el contenedor.
- [ ] 4.2 Mover el contenido actual de `src/frontend/app/page.js` a `src/frontend/app/panel/page.js` sin cambiar su lógica; verificar que `/panel` muestra el dashboard con salud, reservas y enlaces de gestión como antes.
- [ ] 4.3 Actualizar `src/frontend/app/login/page.js` para redirigir a `/panel` después de un login de personal exitoso; verificar que `admin` y `recepcionista` terminan en `/panel`.
- [ ] 4.4 Actualizar `src/frontend/components/RequireGuest.jsx` para redirigir a `/panel` cuando el usuario autenticado no es `HUESPED`; verificar que un usuario de personal que abre `/portal` termina en `/panel`.
- [ ] 4.5 Actualizar `src/frontend/components/Nav.jsx`: enlace "Panel" y marca del personal a `/panel`, marca visible "Mirador del Sol", y conservar los enlaces de huésped sin cambios; verificar que la navegación de cada rol no tiene enlaces rotos.
- [ ] 4.6 Revisar el resto de `src/frontend` en busca de enlaces o redirecciones a `/` que esperaban el dashboard (por ejemplo `href="/"`, `router.push('/')`, `router.replace('/')`); actualizar los que correspondan a `/panel` o dejar explícitos los que apuntan al landing público; verificar que no queda ningún destino ambiguo.

## 5. Marca y documentación

- [ ] 5.1 Actualizar `src/frontend/app/layout.js` con `metadata.title = 'Mirador del Sol'` y una descripción acorde; actualizar las marcas visibles de `src/frontend/app/login/page.js` y `src/frontend/app/portal/login/page.js` a Mirador del Sol; verificar el título de la pestaña y las cabeceras.
- [ ] 5.2 Conectar y revisar los CTAs del landing: reserva a `/portal`, ingreso de huésped a `/portal/login` y acceso del personal a `/login`; verificar cada destino con clic real.
- [ ] 5.3 Actualizar la sección Frontend de `README.md` para documentar el landing público en `/`, el panel en `/panel` y los accesos de `/portal` y `/login`; verificar que las instrucciones coinciden con las rutas implementadas.

## 6. Verificación final

- [ ] 6.1 Verificar accesibilidad: enlace "Saltar al contenido", landmarks semánticos, foco visible, navegación completa por Tab, `aria-expanded` del menú móvil y `prefers-reduced-motion`; comprobar que no hay trampas de foco ni controles inalcanzables.
- [ ] 6.2 Verificar respuesta visual en anchos de 360 px, 768 px y 1280 px: sin scroll horizontal, hero legible, grillas que colapsan y menú móvil usable.
- [ ] 6.3 Ejecutar `npm run lint` y `npm run build`; verificar que ambos terminan sin errores ni warnings nuevos atribuibles al landing.
- [ ] 6.4 Ejecutar la regresión manual de rutas: `/`, `/panel`, `/login`, `/portal`, `/portal/login` y `/portal/mis-reservas` con una sesión de huésped; comprobar que el landing no expone gestión, que el panel sigue funcionando y que el portal conserva su flujo.
- [ ] 6.5 Verificar el contraste de la paleta en ambos temas para texto normal, texto muted, botones primarios y enlaces; comprobar que los pares verde/crema y verde oscuro/texto claro cumplen AA.
