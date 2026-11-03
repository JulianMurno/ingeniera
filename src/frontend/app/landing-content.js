export const landingContent = {
  brand: {
    name: 'Mirador del Sol',
    note: 'Sierras de Córdoba · Argentina',
  },
  navigation: [
    { href: '#propuesta', label: 'La casa' },
    { href: '#habitaciones', label: 'Habitaciones' },
    { href: '#servicios', label: 'Servicios' },
    { href: '#confianza', label: 'Experiencias' },
    { href: '#contacto', label: 'Contacto' },
  ],
  actions: {
    book: { href: '/portal', label: 'Reservar una estadía' },
    guest: { href: '/portal/login', label: 'Ingreso de huéspedes' },
    staff: { href: '/login', label: 'Acceso personal' },
  },
  hero: {
    kicker: 'Hotel de sierra · Valle de Calamuchita',
    title: 'El día empieza donde termina la sierra.',
    lead: 'Una casa de campo entre quebradas, álamos y cielo abierto. Desayunos lentos, aire de altura y habitaciones pensadas para mirar el valle sin apuro.',
    note: 'Check-in 15:00 · Check-out 11:00 · Atención personalizada todos los días.',
    coordinate: '31°57′ S · 64°34′ O',
    aside: 'A 1.180 m sobre el nivel del mar, a doce minutos del pueblo y lejos del ruido.',
    facts: [
      { label: 'Habitaciones', value: '12 refugios' },
      { label: 'Temporada', value: 'Todo el año' },
      { label: 'Desayuno', value: 'De campo' },
    ],
  },
  values: {
    title: 'Menos agenda. Más horizonte.',
    intro: 'Mirador del Sol no es un hotel de paso. Es una casa que se abre al paisaje y propone otro ritmo: el de la luz que cambia sobre las sierras.',
    items: [
      {
        icon: 'leaf',
        title: 'Arquitectura que respira',
        text: 'Piedra, madera y cal. Materiales nobles que envejecen bien y mantienen la casa fresca incluso en enero.',
      },
      {
        icon: 'sun',
        title: 'Luz de altura',
        text: 'Ventanas generosas y terrazas orientadas al oeste para que cada atardecer sea parte de la estadía.',
      },
      {
        icon: 'star',
        title: 'Hospitalidad de casa',
        text: 'Un equipo pequeño que conoce tu nombre, recuerda cómo tomás el café y te ayuda a armar el día.',
      },
    ],
  },
  rooms: {
    title: 'Doce formas de despertar mirando el valle.',
    intro: 'Cada habitación tiene una lectura distinta del paisaje. Todas comparten lo esencial: silencio, luz natural y cama de plumas.',
    items: [
      {
        icon: 'bed',
        type: 'Suite mirador',
        name: 'Suite del Alba',
        text: 'La más amplia, con terraza privada y ventanal de piso a techo sobre la quebrada. Ideal para quedarse un día más.',
        meta: ['2 personas', '42 m²', 'Terraza oeste'],
        feature: true,
        tone: 'sunrise',
      },
      {
        icon: 'bed',
        type: 'Habitación doble',
        name: 'Cuarto de los Álamos',
        text: 'Rodeada de árboles y con balcón propio. La luz de la mañana entra desde el este.',
        meta: ['2 personas', '28 m²', 'Balcón'],
        tone: 'valley',
      },
      {
        icon: 'bed',
        type: 'Habitación superior',
        name: 'Refugio de Piedra',
        text: 'Techos altos, pared de piedra y una ventana baja para mirar el jardín de aromáticas.',
        meta: ['2–3 personas', '32 m²', 'Jardín'],
        tone: 'stone',
      },
    ],
  },
  amenities: {
    title: 'Lo necesario, bien hecho.',
    intro: 'Sin excesos ni ruido. Una serie de cuidados simples para que la estadía se sienta liviana.',
    items: [
      {
        icon: 'restaurant',
        name: 'Desayuno de campo',
        text: 'Pan de masa madre, dulces de la zona y café de especialidad.',
      },
      {
        icon: 'pool',
        name: 'Pileta entre sierras',
        text: 'Agua templada, reposeras de lona y sombra de palmeras.',
      },
      {
        icon: 'spa',
        name: 'Casa de baños',
        text: 'Ducha exterior, sauna de madera y masajes con turno previo.',
      },
      {
        icon: 'wifi',
        name: 'Wi-Fi sereno',
        text: 'Conexión estable en las áreas comunes. En las habitaciones, opcional.',
      },
      {
        icon: 'parking',
        name: 'Estacionamiento propio',
        text: 'Cochera cubierta y cargador para vehículos eléctricos.',
      },
      {
        icon: 'mapPin',
        name: 'Senderos privados',
        text: 'Tres caminos marcados para bajar al río o subir al filo.',
      },
    ],
  },
  trust: {
    quote: 'Llegamos por una noche y nos quedamos cuatro. El silencio, el desayuno y esa luz de las siete de la tarde no se olvidan.',
    author: 'Lucía y Tomás · Buenos Aires',
    facts: [
      { label: 'Huéspedes que vuelven', value: '68%' },
      { label: 'Puntaje de estadía', value: '9,4 / 10' },
      { label: 'Desde', value: '2016' },
    ],
  },
  contact: {
    title: 'Elegí una fecha. Del resto nos ocupamos.',
    text: 'Escribinos o reservá en línea. Si venís por primera vez, contanos qué te gustaría encontrar y armamos una recomendación a medida.',
    address: 'Camino del Mirador s/n, Valle de Calamuchita, Córdoba',
    phone: '+54 3546 00 0000',
    phoneHref: 'tel:+543546000000',
    email: 'reservas@miradordelsol.example',
    emailHref: 'mailto:reservas@miradordelsol.example',
    links: [
      { href: '/portal', label: 'Reservar' },
      { href: '/portal/login', label: 'Mi reserva' },
      { href: '/login', label: 'Acceso personal' },
    ],
    legal: 'Mirador del Sol · Alojamiento turístico habilitado. Sitio de demostración.',
  },
};
