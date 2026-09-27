const { z } = require('zod');
const { roomTypes } = require('./room.schema');

const booleanFlag = z
  .enum(['true', 'false', '1', '0'], { message: 'Valor booleano inválido (usar true o false)' })
  .transform((value) => value === 'true' || value === '1');

const availabilityQuerySchema = z
  .object({
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    type: z.enum(roomTypes, { message: 'Tipo de habitación inválido' }).optional(),
    ocupantes: z.coerce
      .number({ invalid_type_error: 'Ocupantes inválidos' })
      .int('Los ocupantes deben ser un número entero')
      .positive('Los ocupantes deben ser mayores que cero')
      .optional(),
    earlyCheckIn: booleanFlag.optional(),
    lateCheckOut: booleanFlag.optional(),
  })
  .refine((d) => d.checkIn < d.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

module.exports = { availabilityQuerySchema, booleanFlag };
