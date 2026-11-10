# Design System Specification

## Purpose

Define la base visual compartida del frontend de Mirador del Sol: una capa de estilos utilitaria compilada en el build, tokens semánticos de diseño y un conjunto de componentes reutilizables que landing, panel y portal consumen para mantener una identidad consistente sin reescribir cada pantalla.

## Requirements

### Requirement: Capa de estilos utilitaria compilada en el build

El frontend SHALL generar sus clases utilitarias de estilo durante el build, con Tailwind CSS como mecanismo adoptado, sin solicitar hojas de estilo a CDNs ni a servicios externos en tiempo de ejecución. La capa SHALL aplicarse tanto en desarrollo como en producción y en todas las rutas que sirve Express. El CSS entregado SHALL incluir únicamente las utilidades usadas por el código fuente del frontend.

#### Scenario: Build de producción con utilidades aplicadas

- **WHEN** se ejecuta el build del frontend y se sirve una página que usa clases utilitarias
- **THEN** el CSS generado contiene esas clases y la página las aplica visualmente

#### Scenario: Sin dependencias de estilo externas

- **WHEN** se carga cualquier ruta del frontend en el navegador
- **THEN** la página no solicita hojas de estilo ni fuentes a CDNs o servicios externos para su apariencia base

#### Scenario: CSS acotado al código usado

- **WHEN** se agrega una clase utilitaria que no se usa en ningún archivo del frontend
- **THEN** esa clase no se incluye en el CSS generado

### Requirement: Tokens de diseño semánticos

El sistema SHALL exponer tokens semánticos de color, tipografía, espaciado, radio y sombra, utilizables como variables CSS y como utilidades. La paleta SHALL conservar el verde como color principal y el blanco crema como color secundario de Mirador del Sol. Los tokens heredados de `globals.css` (`--bg`, `--bg-secondary`, `--card`, `--border`, `--text`, `--muted`, `--primary`, `--danger`, `--ok`, `--warn`, `--radius`, `--shadow*`) SHALL seguir resolviendo a los mismos valores semánticos mientras tengan consumidores. El tema claro y el tema oscuro SHALL resolverse con el atributo `data-landing-theme` en el elemento `<html>`, respetando la preferencia guardada y, en su defecto, la preferencia del sistema.

#### Scenario: Cambio de token en un solo lugar

- **WHEN** se modifica el valor de un token semántico de color
- **THEN** todos los componentes y páginas que lo consumen reflejan el nuevo valor sin editar sus archivos

#### Scenario: Tema oscuro

- **WHEN** el documento tiene `data-landing-theme="dark"`
- **THEN** superficies, bordes, texto y controles usan la escala oscura de los mismos tokens y mantienen contraste legible

#### Scenario: Tema claro

- **WHEN** el documento tiene `data-landing-theme="light"`
- **THEN** superficies, bordes, texto y controles usan la escala clara de los mismos tokens y mantienen contraste legible

#### Scenario: Contraste mínimo

- **WHEN** se revisa texto normal, texto atenuado y controles interactivos en ambos temas
- **THEN** cada combinación alcanza al menos el nivel AA de contraste

### Requirement: Componentes de interfaz reutilizables

El sistema SHALL proveer componentes presentacionales para botón, tarjeta, campo de formulario, entrada de texto, selector, tabla, badge de estado, alerta, paginador, encabezado de página, tarjeta de métrica y estado vacío. Cada componente SHALL ofrecer variantes y tamaños explícitos, SHALL reenviar las props nativas del elemento que envuelve (`className`, `onClick`, `disabled`, `type`, `aria-*`) y SHALL componer sus clases con las que agregue el consumidor en lugar de descartarlas. La ruta de importación `@/components/ui` SHALL seguir exportando las primitivas para no romper a sus consumidores actuales.

#### Scenario: Variantes de botón

- **WHEN** se renderiza un botón con cada variante disponible (primaria, secundaria, peligro, éxito, advertencia y fantasma)
- **THEN** cada variante aplica su tratamiento visual propio y conserva tamaño, foco y estado deshabilitado

#### Scenario: Reenvío de props nativas

- **WHEN** un consumidor pasa `onClick`, `disabled`, `type` o atributos `aria-*` a un componente
- **THEN** el elemento renderizado recibe esas props y conserva el comportamiento esperado

#### Scenario: Clases del consumidor

- **WHEN** un consumidor agrega `className` a un componente
- **THEN** las clases del componente y las del consumidor se combinan y no se descarta ninguna

#### Scenario: Importación existente

- **WHEN** una página importa una primitiva desde `@/components/ui`
- **THEN** la importación sigue resolviendo y el componente renderiza sin cambios en su contrato

### Requirement: Adopción incremental sin regresión funcional

La adopción del sistema SHALL realizarse pantalla por pantalla. Cada pantalla migrada SHALL preservar sus rutas, textos visibles, acciones, datos consultados y estados de carga, error y vacío. Ninguna hoja de estilos heredada SHALL eliminarse mientras existan consumidores de sus clases. Las pantallas migradas SHALL NOT usar estilos inline para apariencia y SHALL expresar su presentación con utilidades y variantes de componente. La adopción SHALL comenzar por el shell de navegación, el login del personal y el panel antes de continuar con el resto de las pantallas.

#### Scenario: Pantalla migrada conserva su comportamiento

- **WHEN** un usuario recorre una pantalla ya migrada
- **THEN** encuentra las mismas rutas, textos, acciones, datos y estados que antes de la migración

#### Scenario: Pantalla migrada sin estilos inline de apariencia

- **WHEN** se revisa el código de una pantalla migrada
- **THEN** no contiene atributos `style` para apariencia y su presentación proviene de utilidades o variantes

#### Scenario: Retiro seguro de estilos heredados

- **WHEN** una regla de `globals.css` o `landing.css` todavía tiene consumidores
- **THEN** la regla permanece; cuando deja de tener consumidores, puede retirarse sin afectar otras pantallas

#### Scenario: Rutas protegidas intactas

- **WHEN** un usuario sin sesión o con rol insuficiente accede a una pantalla protegida migrada
- **THEN** el sistema aplica la misma redirección o denegación que antes de la migración

### Requirement: Consistencia visual entre landing, panel y portal

El landing público, el panel del personal y el portal de huéspedes SHALL consumir los mismos tokens de diseño. El cambio SHALL NOT introducir una tercera familia cromática principal ni alterar el contrato vigente del landing público, que conserva su paleta verde y crema, su navegación y sus modos claro y oscuro.

#### Scenario: Misma paleta en las tres superficies

- **WHEN** se comparan colores de superficies, texto, acciones y estados entre landing, panel y portal
- **THEN** provienen del mismo conjunto de tokens y no de valores aislados por pantalla

#### Scenario: Contrato del landing preservado

- **WHEN** se recorre el landing público después de adoptar el sistema
- **THEN** mantiene su identidad verde y crema, su navegación y su alternancia de tema claro y oscuro

### Requirement: Accesibilidad y respuesta a tamaño de pantalla

Los componentes interactivos SHALL ser alcanzables por teclado y SHALL mostrar foco visible. Las alertas de error SHALL anunciarse como tales. Los campos inválidos SHALL exponer su estado de error de forma programática. Los layouts SHALL adaptarse a anchos móviles sin desbordamiento horizontal de la página. Las animaciones decorativas SHALL reducirse o desactivarse cuando el sistema tenga activada la preferencia de movimiento reducido.

#### Scenario: Navegación por teclado

- **WHEN** un usuario recorre una pantalla migrada con la tecla Tab y activa controles con Enter o Espacio
- **THEN** alcanza y activa botones, enlaces, campos y selectores, y el foco es visible en cada uno

#### Scenario: Anuncio de errores

- **WHEN** una pantalla muestra un error de validación o de operación
- **THEN** el mensaje se expone en un contenedor con rol de alerta y es anunciado por el lector de pantalla

#### Scenario: Tabla en pantalla pequeña

- **WHEN** una tabla con muchas columnas se muestra en un ancho móvil
- **THEN** la tabla se desplaza dentro de su contenedor sin desbordar horizontalmente la página

#### Scenario: Movimiento reducido

- **WHEN** el sistema operativo tiene activada la preferencia de movimiento reducido
- **THEN** las transiciones y animaciones decorativas se reducen o se desactivan

### Requirement: Documentación del sistema

El repositorio SHALL incluir documentación del sistema de diseño con la instalación, los tokens disponibles, los componentes con sus variantes y las reglas de adopción para pantallas nuevas. La documentación SHALL describir el procedimiento para agregar un componente nuevo y cuándo una clase utilitaria debe convertirse en componente.

#### Scenario: Documentación disponible

- **WHEN** un desarrollador busca cómo usar tokens o componentes
- **THEN** encuentra un documento en el repositorio con la lista de tokens, la API de cada componente y ejemplos de uso

#### Scenario: Procedimiento para un componente nuevo

- **WHEN** un desarrollador necesita un componente que no existe
- **THEN** la documentación indica dónde crearlo, cómo tipar sus variantes y cómo exportarlo desde el barrel
