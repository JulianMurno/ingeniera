const swaggerUi = require('swagger-ui-express');

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Reservas de Hotel - MVP',
    version: '1.0.0',
    description:
      'API del MVP de reservas: autenticación, huéspedes, habitaciones, tarifas, disponibilidad y ' +
      'reservas. El ciclo de vida de una reserva es `CONFIRMADA → EN_CURSO → FINALIZADA`, con las ' +
      'salidas `CANCELADA` y `NO_SHOW`. Al crear y al cancelar una reserva se envía un email al ' +
      'huésped (transporte `log` por defecto, SMTP si se define `SMTP_URL`).',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth' },
    {
      name: 'Huéspedes',
      description:
        'Alta, edición, consulta paginada y baja lógica. `DELETE` archiva al huésped ' +
        '(`activo = false`) en lugar de borrarlo: sus reservas se conservan y quedan fuera ' +
        'del listado y del detalle (`404`).',
    },
    { name: 'Habitaciones' },
    { name: 'Tarifas' },
    { name: 'Disponibilidad' },
    { name: 'Reservas' },
    {
      name: 'Notificaciones',
      description:
        'Envío de emails al huésped. No expone endpoints: se dispara al crear una reserva ' +
        '(confirmación, con el código, las fechas y la habitación) y al cancelarla (con el motivo y ' +
        'la multa). El transporte es `log` salvo que se defina `SMTP_URL`.',
    },
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
        description:
          'El `dni` debe tener entre 6 y 10 caracteres alfanuméricos y es único entre los ' +
          'huéspedes. El `telefono` es opcional y admite un `+` inicial.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GuestCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Huésped creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Guest' } } },
          },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      get: {
        tags: ['Huéspedes'],
        summary: 'Lista huéspedes activos con filtros por DNI y nombre y paginación',
        description:
          'Solo devuelve huéspedes activos: los archivados con `DELETE` quedan fuera del listado ' +
          'y responden `404` en el detalle.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'dni', in: 'query', schema: { type: 'string' } },
          { name: 'nombre', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'Huéspedes paginados',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/GuestList' } },
            },
          },
          401: { $ref: '#/components/responses/Error401' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/guests/{id}': {
      get: {
        tags: ['Huéspedes'],
        summary: 'Obtiene un huésped por id',
        description: 'Un huésped archivado responde `404`.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Huésped encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Guest' } } },
          },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
      patch: {
        tags: ['Huéspedes'],
        summary: 'Modifica un huésped',
        description:
          'Actualiza solo los campos enviados. Revalida el formato del email y, si cambia el ' +
          '`dni`, comprueba su unicidad excluyendo al propio huésped (`409` si ya lo usa otro). ' +
          'Un huésped archivado responde `404`.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/GuestUpdate' } },
          },
        },
        responses: {
          200: {
            description: 'Huésped actualizado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Guest' } } },
          },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
      delete: {
        tags: ['Huéspedes'],
        summary: 'Archiva un huésped (borrado lógico)',
        description:
          'Marca el huésped como `activo = false` sin borrar datos: sus reservas se conservan ' +
          'y quedan fuera del listado y del detalle. No se pueden crear ni asignar reservas ' +
          'nuevas a un huésped archivado.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Huésped archivado' },
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
        summary: 'Crea una reserva validando disponibilidad, ocupación y fechas',
        description:
          'Responde `409` si la habitación está en `MANTENIMIENTO` o si el rango se solapa y la ' +
          'ocupación resultante supera su `capacidad`. Responde `422` si el rango no cumple la ' +
          'estancia mínima o máxima, si `checkIn` está en el pasado o no respeta la antelación ' +
          'mínima (`MIN_ADVANCE_NIGHTS`), o si los ocupantes superan la capacidad de la habitación. ' +
          'El total se calcula con la tarifa vigente de cada noche y la reserva nace con un `codigo` ' +
          'de confirmación único y en estado `CONFIRMADA` (con email de confirmación al huésped).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ReservationCreate' } },
          },
        },
        responses: {
          201: {
            description: 'Reserva creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Reservation' } },
            },
          },
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
        description:
          'Devuelve también el `codigo` de confirmación, las `notas`, los ocupantes y, si está ' +
          'cancelada, el `motivoCancelacion` y la `multaCancelacion`.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Reserva encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Reservation' } },
            },
          },
          404: { $ref: '#/components/responses/Error404' },
        },
      },
      patch: {
        tags: ['Reservas'],
        summary: 'Modifica una reserva revalidando disponibilidad, ocupación y fechas',
        description:
          'Responde `409` si la habitación destino está en `MANTENIMIENTO`, si el rango se solapa y la ' +
          'ocupación supera la capacidad, y `422` si el rango o los ocupantes quedan fuera de los ' +
          'límites, si `checkIn` queda en el pasado o no respeta la antelación mínima. El total se ' +
          'recalcula con la tarifa vigente de cada noche.',
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
        summary: 'Cancela una reserva confirmada y libera el rango',
        description:
          'Solo admite una reserva `CONFIRMADA`: una reserva `EN_CURSO` o `FINALIZADA` responde ' +
          '`409` sin cambiar de estado. Guarda el `motivo` recibido en `motivoCancelacion` y calcula ' +
          'la `multaCancelacion` como el `CANCELLATION_FEE_PERCENT` por ciento del total. Envía el ' +
          'email de cancelación al huésped.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ReservationCancel' } },
          },
        },
        responses: {
          200: { description: 'Reserva cancelada' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
          422: { $ref: '#/components/responses/Error422' },
        },
      },
    },
    '/reservations/{id}/checkin': {
      post: {
        tags: ['Reservas'],
        summary: 'Registra el check-in y pasa la reserva a EN_CURSO',
        description:
          'Solo admite una reserva `CONFIRMADA`; en cualquier otro estado responde `409`.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reserva en curso' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
        },
      },
    },
    '/reservations/{id}/checkout': {
      post: {
        tags: ['Reservas'],
        summary: 'Registra el check-out y pasa la reserva a FINALIZADA',
        description: 'Solo admite una reserva `EN_CURSO`; en cualquier otro estado responde `409`.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reserva finalizada' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
        },
      },
    },
    '/reservations/{id}/no-show': {
      post: {
        tags: ['Reservas'],
        summary: 'Marca la reserva confirmada como NO_SHOW y libera el rango',
        description:
          'Solo admite una reserva `CONFIRMADA`; en cualquier otro estado responde `409`. Al quedar ' +
          'en `NO_SHOW` la reserva deja de ocupar el rango y vuelve a estar disponible.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reserva marcada como no-presentación' },
          404: { $ref: '#/components/responses/Error404' },
          409: { $ref: '#/components/responses/Error409' },
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
      EstadoReserva: {
        type: 'string',
        enum: ['CONFIRMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA', 'NO_SHOW'],
        description:
          'Ciclo de vida: `CONFIRMADA → EN_CURSO` (check-in), `EN_CURSO → FINALIZADA` (check-out), ' +
          '`CONFIRMADA → CANCELADA` y `CONFIRMADA → NO_SHOW`. Cualquier otra transición responde `409`; ' +
          '`FINALIZADA`, `CANCELADA` y `NO_SHOW` son terminales.',
      },
      TransicionReserva: {
        type: 'string',
        enum: ['checkin', 'checkout', 'cancel', 'no-show'],
        description: 'Transiciones de estado expuestas como endpoints de la reserva',
      },
      Guest: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          dni: {
            type: 'string',
            pattern: '^[A-Za-z0-9]{6,10}$',
            description: 'Alfanumérico de 6 a 10 caracteres, único entre los huéspedes',
          },
          telefono: {
            type: 'string',
            nullable: true,
            pattern: '^\\+?\\d{7,15}$',
            description: 'Entre 7 y 15 dígitos, con `+` inicial opcional',
          },
          activo: {
            type: 'boolean',
            description: 'Por defecto `true`; `DELETE` lo pasa a `false` (borrado lógico)',
            default: true,
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      GuestCreate: {
        type: 'object',
        required: ['nombre', 'email', 'dni'],
        properties: {
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          dni: { type: 'string', pattern: '^[A-Za-z0-9]{6,10}$' },
          telefono: { type: 'string', pattern: '^\\+?\\d{7,15}$' },
        },
      },
      GuestUpdate: {
        type: 'object',
        description: 'Todos los campos son opcionales; se envía al menos uno.',
        properties: {
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          dni: { type: 'string', pattern: '^[A-Za-z0-9]{6,10}$' },
          telefono: { type: 'string', pattern: '^\\+?\\d{7,15}$' },
        },
      },
      GuestList: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Guest' } },
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
      Reservation: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          guestId: { type: 'integer' },
          roomId: { type: 'integer' },
          checkIn: { type: 'string', format: 'date' },
          checkOut: { type: 'string', format: 'date' },
          noches: { type: 'integer' },
          total: { type: 'integer' },
          estado: { $ref: '#/components/schemas/EstadoReserva' },
          adultos: {
            type: 'integer',
            minimum: 1,
            description: 'Adultos de la reserva; por defecto `1`',
            default: 1,
          },
          menores: {
            type: 'integer',
            minimum: 0,
            description: 'Menores de la reserva; por defecto `0`',
            default: 0,
          },
          codigo: {
            type: 'string',
            nullable: true,
            pattern: '^HR-[A-Z0-9]{6}$',
            description: 'Código de confirmación único asignado al crear la reserva',
          },
          notas: {
            type: 'string',
            nullable: true,
            description: 'Notas internas de la reserva',
          },
          motivoCancelacion: {
            type: 'string',
            nullable: true,
            description: 'Motivo registrado al cancelar la reserva',
          },
          multaCancelacion: {
            type: 'integer',
            minimum: 0,
            description: 'Multa aplicada al cancelar; por defecto `0`',
            default: 0,
          },
          earlyCheckIn: { $ref: '#/components/schemas/EarlyCheckIn' },
          lateCheckOut: { $ref: '#/components/schemas/LateCheckOut' },
        },
      },
      ReservationCreate: {
        type: 'object',
        required: ['guestId', 'roomId', 'checkIn', 'checkOut'],
        properties: {
          guestId: { type: 'integer' },
          roomId: { type: 'integer' },
          checkIn: {
            type: 'string',
            format: 'date',
            description:
              'No puede estar en el pasado y debe respetar `MIN_ADVANCE_NIGHTS`; de lo contrario `422`',
          },
          checkOut: { type: 'string', format: 'date' },
          adultos: { type: 'integer', minimum: 1, default: 1 },
          menores: { type: 'integer', minimum: 0, default: 0 },
          notas: { type: 'string', nullable: true },
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
          adultos: { type: 'integer', minimum: 1 },
          menores: { type: 'integer', minimum: 0 },
          notas: { type: 'string', nullable: true },
          earlyCheckIn: { $ref: '#/components/schemas/EarlyCheckIn' },
          lateCheckOut: { $ref: '#/components/schemas/LateCheckOut' },
        },
      },
      ReservationCancel: {
        type: 'object',
        properties: {
          motivo: {
            type: 'string',
            nullable: true,
            description: 'Motivo de la cancelación; se persiste en `motivoCancelacion`',
          },
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
