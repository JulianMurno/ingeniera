const swaggerUi = require('swagger-ui-express');

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Reservas de Hotel - MVP',
    version: '1.0.0',
    description:
      'API del MVP de reservas: autenticación, huéspedes, habitaciones, tarifas, disponibilidad y reservas.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth' },
    { name: 'Huéspedes' },
    { name: 'Habitaciones' },
    { name: 'Tarifas' },
    { name: 'Disponibilidad' },
    { name: 'Reservas' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inicia sesión y obtiene un token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Token emitido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Error401' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/guests': {
      post: {
        tags: ['Huéspedes'],
        summary: 'Registra un huésped',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Guest' },
            },
          },
        },
        responses: {
          201: { description: 'Huésped creado' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      get: {
        tags: ['Huéspedes'],
        summary: 'Lista huéspedes con filtros por DNI y nombre',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'dni', in: 'query', schema: { type: 'string' } },
          { name: 'nombre', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Lista de huéspedes' } },
      },
    },
    '/guests/{id}': {
      get: {
        tags: ['Huéspedes'],
        summary: 'Obtiene un huésped por id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Huésped encontrado' },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
    },
    '/rooms': {
      post: {
        tags: ['Habitaciones'],
        summary: 'Registra una habitación (solo Administrador)',
        description:
          'Las habitaciones nacen en estado `DISPONIBLE` con capacidad 1. `comodidades` y `fotos` ' +
          'se envian como listas de strings y la API las persiste como JSON.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Room' } },
          },
        },
        responses: {
          201: { description: 'Habitación creada' },
          403: { $ref: '#/components/responses/Error403' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      get: {
        tags: ['Habitaciones'],
        summary: 'Lista las habitaciones con filtros y paginación',
        description:
          'Filtros combinables: `tipo`, `tarifaMin`/`tarifaMax`, `estado` y disponibilidad real en ' +
          'un rango (`checkIn`/`checkOut`, ambos obligatorios y con `checkIn` < `checkOut`). ' +
          'El filtro de rango excluye habitaciones en `MANTENIMIENTO` y las que ya tienen una ' +
          'reserva `CONFIRMADA` que solapa.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tipo', in: 'query', schema: { $ref: '#/components/schemas/RoomType' } },
          {
            name: 'estado',
            in: 'query',
            schema: { $ref: '#/components/schemas/EstadoHabitacion' },
          },
          { name: 'tarifaMin', in: 'query', schema: { type: 'integer' } },
          { name: 'tarifaMax', in: 'query', schema: { type: 'integer' } },
          {
            name: 'checkIn',
            in: 'query',
            description: 'Inicio del rango de disponibilidad (requiere checkOut)',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'checkOut',
            in: 'query',
            description: 'Fin del rango de disponibilidad (requiere checkIn)',
            schema: { type: 'string', format: 'date' },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'Habitaciones paginadas',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RoomList' } },
            },
          },
          401: { $ref: '#/components/responses/Error401' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/rooms/{id}': {
      get: {
        tags: ['Habitaciones'],
        summary: 'Obtiene una habitación por id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Habitación encontrada' },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
      patch: {
        tags: ['Habitaciones'],
        summary: 'Modifica una habitación (solo Administrador)',
        description:
          'Permite cambiar `estado` (puesta en mantenimiento y regreso a disponible), `capacidad` ' +
          'y los datos descriptivos. Enviar `null` en un texto o lista lo clears.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RoomUpdate' } },
          },
        },
        responses: {
          200: { description: 'Habitación actualizada' },
          403: { $ref: '#/components/responses/Error403' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      delete: {
        tags: ['Habitaciones'],
        summary: 'Elimina una habitación (solo Administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Habitación eliminada' },
          403: { $ref: '#/components/responses/Error403' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
        },
      },
    },
    '/rates/seasons': {
      post: {
        tags: ['Tarifas'],
        summary: 'Define una tarifa por temporada de un tipo de habitación (solo Administrador)',
        description:
          'El rango es semiabierto `[fechaInicio, fechaFin)`: la noche de `fechaFin` ya no pertenece a ' +
          'la temporada. Dos temporadas del mismo tipo no pueden superponerse (`409`).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SeasonCreate' } },
          },
        },
        responses: {
          201: { description: 'Temporada creada' },
          403: { $ref: '#/components/responses/Error403' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      get: {
        tags: ['Tarifas'],
        summary: 'Lista las temporadas de tarifa, opcionalmente por tipo de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'roomType', in: 'query', schema: { $ref: '#/components/schemas/RoomType' } },
        ],
        responses: {
          200: {
            description: 'Temporadas registradas',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Season' } },
              },
            },
          },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/rates/seasons/{id}': {
      delete: {
        tags: ['Tarifas'],
        summary: 'Elimina una temporada de tarifa (solo Administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Temporada eliminada' },
          403: { $ref: '#/components/responses/Error403' },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
    },
    '/rates/weekdays': {
      post: {
        tags: ['Tarifas'],
        summary: 'Define la tarifa de un día de la semana (solo Administrador)',
        description:
          'Una sola tarifa por tipo de habitación y día (`diaSemana` de `0` domingo a `6` sábado). ' +
          'Repetirla para el mismo par responde `409`.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WeekdayRateCreate' } },
          },
        },
        responses: {
          201: { description: 'Tarifa por día de semana creada' },
          403: { $ref: '#/components/responses/Error403' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      get: {
        tags: ['Tarifas'],
        summary: 'Lista las tarifas por día de semana, opcionalmente por tipo de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'roomType', in: 'query', schema: { $ref: '#/components/schemas/RoomType' } },
        ],
        responses: {
          200: {
            description: 'Tarifas por día de semana registradas',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/WeekdayRate' } },
              },
            },
          },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/rates/weekdays/{id}': {
      delete: {
        tags: ['Tarifas'],
        summary: 'Elimina la tarifa de un día de la semana (solo Administrador)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Tarifa eliminada' },
          403: { $ref: '#/components/responses/Error403' },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
    },
    '/rates/quote': {
      get: {
        tags: ['Tarifas'],
        summary: 'Consulta la tarifa vigente de un tipo de habitación para un rango',
        description:
          'Devuelve el desglose noche por noche con la tarifa aplicada y su origen. La precedencia es ' +
          'tarifa por día de semana (`WEEKDAY`) > tarifa de temporada (`SEASON`) > tarifa base de la ' +
          'habitación (`BASE`).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'roomType',
            in: 'query',
            required: true,
            schema: { $ref: '#/components/schemas/RoomType' },
          },
          {
            name: 'checkIn',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'checkOut',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          200: {
            description: 'Tarifa vigente por noche y total del rango',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RateQuote' } },
            },
          },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/availability': {
      get: {
        tags: ['Disponibilidad'],
        summary: 'Consulta habitaciones disponibles por rango de fechas, tipo y ocupantes',
        description:
          'Las habitaciones en estado `MANTENIMIENTO` quedan fuera del resultado aunque no tengan ' +
          'reservas que solapen el rango. Se aplican las reglas de estancia mínima y máxima ' +
          'configuradas por entorno (`MIN_STAY_NIGHTS` / `MAX_STAY_NIGHTS`): un rango fuera de los ' +
          'límites responde `422`. Con `earlyCheckIn` o `lateCheckOut` se consulta la disponibilidad ' +
          'teniendo en cuenta los horarios de check-in y check-out, de modo que el recambio del mismo ' +
          'día solo se permite si no se pisan.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'checkIn',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'checkOut',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/RoomType' } },
          {
            name: 'ocupantes',
            in: 'query',
            description:
              'Cantidad de huéspedes; solo devuelve habitaciones con esa capacidad o más',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'earlyCheckIn',
            in: 'query',
            description:
              'Ingreso antes de `CHECK_IN_HOUR`; bloquea el check-out de la noche anterior',
            schema: { type: 'boolean' },
          },
          {
            name: 'lateCheckOut',
            in: 'query',
            description: 'Salida después de `CHECK_OUT_HOUR`; bloquea el check-in del mismo día',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          200: { description: 'Lista de habitaciones disponibles' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/reservations': {
      post: {
        tags: ['Reservas'],
        summary: 'Crea una reserva validando disponibilidad',
        description:
          'Responde `409` si la habitación está en `MANTENIMIENTO` o el rango se solapa (incluido el ' +
          'solapamiento por horarios del día). Responde `422` si el rango no cumple la estancia mínima o ' +
          'máxima configurada. El total se calcula con la tarifa vigente de cada noche.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ReservationCreate' } },
          },
        },
        responses: {
          201: { description: 'Reserva creada' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      get: {
        tags: ['Reservas'],
        summary: 'Lista reservas con filtros y paginación',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'dni', in: 'query', schema: { type: 'string' } },
          { name: 'roomId', in: 'query', schema: { type: 'integer' } },
          { name: 'fecha', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'estado', in: 'query', schema: { $ref: '#/components/schemas/EstadoReserva' } },
          { name: 'guestId', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Reservas paginadas' } },
      },
    },
    '/reservations/{id}': {
      get: {
        tags: ['Reservas'],
        summary: 'Obtiene una reserva por id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reserva encontrada' },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
      patch: {
        tags: ['Reservas'],
        summary: 'Modifica una reserva revalidando disponibilidad',
        description:
          'Responde `409` si la habitación destino está en `MANTENIMIENTO` o el rango se solapa, y `422` ' +
          'si el rango resultante queda fuera de los límites de estancia. El total se recalcula con la ' +
          'tarifa vigente de cada noche.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ReservationUpdate' } },
          },
        },
        responses: {
          200: { description: 'Reserva actualizada' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/reservations/{id}/cancel': {
      post: {
        tags: ['Reservas'],
        summary: 'Cancela una reserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reserva cancelada' },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    responses: {
      Error400: {
        description: 'Solicitud inválida',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Error401: {
        description: 'No autenticado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Error403: {
        description: 'No autorizado para la operación',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Error404: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Error409: {
        description: 'Conflicto (duplicado o solape)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Error422: {
        description: 'Error de validación',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              rol: { $ref: '#/components/schemas/Rol' },
            },
          },
        },
      },
      Rol: { type: 'string', enum: ['RECEPCIONISTA', 'ADMINISTRADOR'] },
      RoomType: { type: 'string', enum: ['SINGLE', 'DOBLE', 'SUITE'] },
      EstadoHabitacion: { type: 'string', enum: ['DISPONIBLE', 'MANTENIMIENTO'] },
      EstadoReserva: { type: 'string', enum: ['CONFIRMADA', 'CANCELADA'] },
      Guest: {
        type: 'object',
        required: ['nombre', 'email', 'dni'],
        properties: {
          nombre: { type: 'string' },
          email: { type: 'string' },
          dni: { type: 'string' },
          telefono: { type: 'string' },
        },
      },
      Room: {
        type: 'object',
        required: ['numero', 'tipo', 'tarifa'],
        properties: {
          numero: { type: 'string' },
          tipo: { $ref: '#/components/schemas/RoomType' },
          tarifa: {
            type: 'integer',
            description: 'Tarifa por noche en la unidad base de la moneda',
          },
          estado: {
            allOf: [{ $ref: '#/components/schemas/EstadoHabitacion' }],
            description: 'Por defecto `DISPONIBLE`; en `MANTENIMIENTO` sale de la disponibilidad',
            default: 'DISPONIBLE',
          },
          capacidad: {
            type: 'integer',
            minimum: 1,
            description: 'Ocupantes máximos; debe ser mayor que cero',
            default: 1,
          },
          descripcion: {
            type: 'string',
            nullable: true,
            description: 'Texto libre descriptivo de la habitación',
          },
          comodidades: {
            type: 'array',
            nullable: true,
            items: { type: 'string' },
            description: 'Comodidades ofrecidas (persISTidas como JSON)',
          },
          fotos: {
            type: 'array',
            nullable: true,
            items: { type: 'string', format: 'uri' },
            description: 'URLs de imágenes de la habitación (persistidas como JSON)',
          },
        },
      },
      RoomUpdate: {
        type: 'object',
        properties: {
          numero: { type: 'string' },
          tipo: { $ref: '#/components/schemas/RoomType' },
          tarifa: { type: 'integer' },
          estado: { $ref: '#/components/schemas/EstadoHabitacion' },
          capacidad: { type: 'integer', minimum: 1 },
          descripcion: { type: 'string', nullable: true },
          comodidades: { type: 'array', nullable: true, items: { type: 'string' } },
          fotos: { type: 'array', nullable: true, items: { type: 'string', format: 'uri' } },
        },
      },
      RoomList: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Room' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
      ReservationCreate: {
        type: 'object',
        required: ['guestId', 'roomId', 'checkIn', 'checkOut'],
        properties: {
          guestId: { type: 'integer' },
          roomId: { type: 'integer' },
          checkIn: { type: 'string', format: 'date' },
          checkOut: { type: 'string', format: 'date' },
          earlyCheckIn: { $ref: '#/components/schemas/EarlyCheckIn' },
          lateCheckOut: { $ref: '#/components/schemas/LateCheckOut' },
        },
      },
      ReservationUpdate: {
        type: 'object',
        properties: {
          guestId: { type: 'integer' },
          roomId: { type: 'integer' },
          checkIn: { type: 'string', format: 'date' },
          checkOut: { type: 'string', format: 'date' },
          earlyCheckIn: { $ref: '#/components/schemas/EarlyCheckIn' },
          lateCheckOut: { $ref: '#/components/schemas/LateCheckOut' },
        },
      },
      EarlyCheckIn: {
        type: 'boolean',
        description:
          'El huésped ingresa antes de `CHECK_IN_HOUR`; ocupa la habitación desde el inicio del día de ' +
          '`checkIn` y por eso impide el check-out de otra reserva ese mismo día.',
        default: false,
      },
      LateCheckOut: {
        type: 'boolean',
        description:
          'El huésped sale después de `CHECK_OUT_HOUR`; ocupa la habitación hasta el final del día de ' +
          '`checkOut` y por eso impide el check-in de otra reserva ese mismo día.',
        default: false,
      },
      Season: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          roomType: { $ref: '#/components/schemas/RoomType' },
          fechaInicio: { type: 'string', format: 'date' },
          fechaFin: {
            type: 'string',
            format: 'date',
            description: 'Excluida: la temporada cubre `[fechaInicio, fechaFin)`',
          },
          tarifa: { type: 'integer', description: 'Tarifa por noche durante la temporada' },
        },
      },
      SeasonCreate: {
        type: 'object',
        required: ['roomType', 'fechaInicio', 'fechaFin', 'tarifa'],
        properties: {
          roomType: { $ref: '#/components/schemas/RoomType' },
          fechaInicio: { type: 'string', format: 'date' },
          fechaFin: { type: 'string', format: 'date' },
          tarifa: { type: 'integer', minimum: 1 },
        },
      },
      WeekdayRate: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          roomType: { $ref: '#/components/schemas/RoomType' },
          diaSemana: { $ref: '#/components/schemas/DiaSemana' },
          tarifa: { type: 'integer', description: 'Tarifa por noche para ese día de la semana' },
        },
      },
      WeekdayRateCreate: {
        type: 'object',
        required: ['roomType', 'diaSemana', 'tarifa'],
        properties: {
          roomType: { $ref: '#/components/schemas/RoomType' },
          diaSemana: { $ref: '#/components/schemas/DiaSemana' },
          tarifa: { type: 'integer', minimum: 1 },
        },
      },
      DiaSemana: {
        type: 'integer',
        minimum: 0,
        maximum: 6,
        description: '0 domingo, 1 lunes, 2 martes, 3 miércoles, 4 jueves, 5 viernes, 6 sábado',
      },
      RateQuote: {
        type: 'object',
        properties: {
          roomType: { $ref: '#/components/schemas/RoomType' },
          checkIn: { type: 'string', format: 'date' },
          checkOut: { type: 'string', format: 'date' },
          noches: { type: 'integer' },
          tarifaBase: {
            type: 'integer',
            description: 'Tarifa base del tipo de habitación usada cuando no hay override',
          },
          total: { type: 'integer' },
          detalle: { type: 'array', items: { $ref: '#/components/schemas/RateNight' } },
        },
      },
      RateNight: {
        type: 'object',
        properties: {
          fecha: { type: 'string', format: 'date' },
          diaSemana: { $ref: '#/components/schemas/DiaSemana' },
          dia: { type: 'string', description: 'Nombre del día de la semana' },
          tarifa: { type: 'integer' },
          origen: { type: 'string', enum: ['WEEKDAY', 'SEASON', 'BASE'] },
        },
      },
    },
  },
};

const serve = swaggerUi.serve;
const setup = swaggerUi.setup(spec);

module.exports = { serve, setup, spec };
