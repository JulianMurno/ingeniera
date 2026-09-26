const { z } = require('zod');

const roomTypes = ['SINGLE', 'DOBLE', 'SUITE'];
const estadoMantenimiento = 'MANTENIMIENTO';
const roomStates = ['DISPONIBLE', estadoMantenimiento];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const roomBaseSchema = z.object({
  numero: z.string().min(1, 'El número es obligatorio'),
  tipo: z.enum(roomTypes, { message: 'Tipo de habitación inválido' }),
  tarifa: z.number().int().positive('La tarifa debe ser un entero positivo'),
  estado: z.enum(roomStates, { message: 'Estado de habitación inválido' }).optional(),
  capacidad: z
    .number()
    .int('La capacidad debe ser un número entero')
    .min(1, 'La capacidad debe ser mayor que cero')
    .optional(),
  descripcion: z.string().min(1, 'La descripción no puede estar vacía').nullable().optional(),
  comodidades: z
    .array(z.string().min(1, 'La comodidad no puede estar vacía'))
    .nullable()
    .optional()
    .describe('Comodidades ofrecidas por la habitación'),
  fotos: z
    .array(z.string().url('URL de foto inválida'))
    .nullable()
    .optional()
    .describe('URLs de imágenes de la habitación'),
});

const roomCreateSchema = roomBaseSchema;

const roomUpdateSchema = roomBaseSchema.partial();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Id inválido'),
});

const roomQuerySchema = z
  .object({
    tipo: z.enum(roomTypes, { message: 'Tipo de habitación inválido' }).optional(),
    estado: z.enum(roomStates, { message: 'Estado de habitación inválido' }).optional(),
    tarifaMin: z.coerce.number().int().positive('tarifaMin inválida').optional(),
    tarifaMax: z.coerce.number().int().positive('tarifaMax inválida').optional(),
    checkIn: isoDate.optional(),
    checkOut: isoDate.optional(),
    page: z.coerce.number().int().positive('page inválida').default(1),
    pageSize: z.coerce.number().int().positive('pageSize inválido').max(100).default(10),
  })
  .refine((d) => d.tarifaMin === undefined || d.tarifaMax === undefined || d.tarifaMin <= d.tarifaMax, {
    message: 'tarifaMin no puede ser mayor que tarifaMax',
    path: ['tarifaMin'],
  })
  .refine((d) => (d.checkIn === undefined) === (d.checkOut === undefined), {
    message: 'checkIn y checkOut deben enviarse juntos',
    path: ['checkOut'],
  })
  .refine((d) => !d.checkIn || !d.checkOut || d.checkIn < d.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

module.exports = {
  roomCreateSchema,
  roomUpdateSchema,
  roomQuerySchema,
  idParamSchema,
  roomTypes,
  roomStates,
  estadoMantenimiento,
};
