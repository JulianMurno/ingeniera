## Purpose

Permite al personal del hotel ver en una grilla de fechas por habitación qué noches están disponibles, reservadas o en mantenimiento, y alternar esa vista con el listado de reservas existente.

## ADDED Requirements

### Requirement: Alternar entre Listado y Calendario

La sección Reservas del panel SHALL ofrecer un selector de vista con las opciones "Listado" y "Calendario". Al abrir la sección, la vista activa SHALL ser "Listado". Al elegir "Calendario", la sección SHALL mostrar la grilla calendario en lugar del listado. Al elegir "Listado", la sección SHALL volver al listado con sus filtros y su paginación.

#### Scenario: Vista inicial

- **WHEN** el personal abre la sección Reservas
- **THEN** se muestra la vista "Listado" y el selector con las dos opciones

#### Scenario: Cambio a Calendario

- **WHEN** el personal selecciona "Calendario"
- **THEN** se muestra la grilla calendario y se ocultan el listado, los filtros y la paginación

#### Scenario: Cambio a Listado

- **WHEN** el personal vuelve a seleccionar "Listado"
- **THEN** se muestra nuevamente el listado de reservas con sus filtros y su paginación

### Requirement: Grilla de fechas por habitación

La vista Calendario SHALL mostrar una grilla con una columna por cada fecha del rango visible, ordenadas de menor a mayor, y una fila por cada habitación existente, ordenadas por número. Cada intersección entre una habitación y una fecha SHALL ser una celda. La columna de habitaciones SHALL identificar cada fila con su número y su tipo.

#### Scenario: Grilla con habitaciones y fechas

- **WHEN** el personal abre la vista Calendario
- **THEN** ve todas las habitaciones como filas y todas las fechas del rango visible como columnas

#### Scenario: Habitación sin reservas en el rango

- **WHEN** una habitación no tiene reservas ni mantenimiento en el rango visible
- **THEN** la habitación igualmente aparece como fila y sus celdas se muestran como disponibles

### Requirement: Estado de cada celda

Cada celda SHALL reflejar el estado de esa habitación para esa noche: "reservada" si existe una reserva en estado `CONFIRMADA`, `EN_CURSO` o `FINALIZADA` que cubre esa noche dentro de `[checkIn, checkOut)`; "en mantenimiento" si la habitación está en estado `MANTENIMIENTO` y ninguna reserva cubre esa noche; "disponible" en cualquier otro caso. Las reservas en estado `CANCELADA` o `NO_SHOW` SHALL NOT ocupar celdas.

#### Scenario: Noches reservadas

- **WHEN** una habitación tiene una reserva vigente del 10 al 13
- **THEN** las celdas de las noches 10, 11 y 12 se muestran como reservadas y la noche 13 como disponible

#### Scenario: Reserva cancelada

- **WHEN** la reserva que cubría una noche se encuentra en estado `CANCELADA`
- **THEN** esa celda se muestra como disponible

#### Scenario: Reserva no-show

- **WHEN** la reserva que cubría una noche se encuentra en estado `NO_SHOW`
- **THEN** esa celda se muestra como disponible

#### Scenario: Habitación en mantenimiento

- **WHEN** una habitación está en estado `MANTENIMIENTO` y no tiene reservas que cubran sus noches en el rango
- **THEN** sus celdas del rango se muestran como en mantenimiento

#### Scenario: Reserva sobre habitación en mantenimiento

- **WHEN** una habitación en estado `MANTENIMIENTO` tiene una reserva vigente que cubre una noche del rango
- **THEN** esa noche se muestra como reservada y el resto de las noches de la habitación como en mantenimiento

#### Scenario: Noche disponible

- **WHEN** una noche no está cubierta por ninguna reserva vigente y la habitación no está en mantenimiento
- **THEN** la celda se muestra como disponible

### Requirement: Representación visual y leyenda de estados

La vista Calendario SHALL distinguir visualmente los tres estados: las celdas disponibles con relleno, las reservadas con contorno y el código de confirmación, y las celdas en mantenimiento sin relleno ni contorno propio con la indicación "Mantenimiento". La vista SHALL mostrar una leyenda que asocie cada representación con su estado.

#### Scenario: Leyenda visible

- **WHEN** se muestra la vista Calendario
- **THEN** la leyenda lista "Disponible", "Reservada" y "En mantenimiento" con su representación visual

#### Scenario: Código en celda reservada

- **WHEN** una celda está reservada
- **THEN** la celda muestra el código de confirmación de la reserva que la ocupa

### Requirement: Reservas de varias noches

Una reserva que abarca varias noches SHALL ocupar todas sus noches como celdas reservadas contiguas y SHALL mostrar su código en la primera celda visible de la serie.

#### Scenario: Reserva de varias noches

- **WHEN** una reserva vigente abarca del 10 al 13 y el rango visible comienza el 8
- **THEN** las celdas 10, 11 y 12 aparecen como reservadas contiguas y el código se muestra en la celda del 10

### Requirement: Navegación del rango visible

La vista Calendario SHALL mostrar por defecto 30 fechas consecutivas comenzando en la fecha actual y SHALL indicar la fecha inicial y la final del rango visible. SHALL ofrecer los controles "Anterior", "Siguiente" y "Hoy": "Anterior" y "Siguiente" desplazan el rango 30 días hacia atrás o adelante, y "Hoy" vuelve al rango que comienza en la fecha actual.

#### Scenario: Rango inicial

- **WHEN** el personal abre la vista Calendario
- **THEN** el rango visible comienza en la fecha actual y abarca 30 fechas consecutivas

#### Scenario: Rango siguiente

- **WHEN** el personal selecciona "Siguiente"
- **THEN** el rango visible se desplaza 30 días hacia adelante

#### Scenario: Rango anterior

- **WHEN** el personal selecciona "Anterior"
- **THEN** el rango visible se desplaza 30 días hacia atrás

#### Scenario: Volver a hoy

- **WHEN** el personal selecciona "Hoy"
- **THEN** el rango visible vuelve a comenzar en la fecha actual

### Requirement: Enlace al detalle de la reserva

Cada celda reservada SHALL enlazar al detalle de la reserva que la ocupa en `/reservas/{id}`. Las celdas disponibles y en mantenimiento SHALL NOT ser enlaces.

#### Scenario: Abrir reserva desde el calendario

- **WHEN** el personal activa una celda reservada
- **THEN** navega al detalle de esa reserva

### Requirement: Estados de carga, error y sin habitaciones

La vista Calendario SHALL mostrar un indicador de carga mientras obtiene los datos, un mensaje de error si la consulta falla y un estado vacío si no hay habitaciones para mostrar.

#### Scenario: Consulta en curso

- **WHEN** la vista Calendario solicita los datos del rango
- **THEN** muestra un indicador de carga

#### Scenario: Consulta fallida

- **WHEN** la consulta de datos del rango falla
- **THEN** muestra un mensaje de error

#### Scenario: Sin habitaciones

- **WHEN** no existen habitaciones registradas
- **THEN** muestra un estado vacío en lugar de la grilla
