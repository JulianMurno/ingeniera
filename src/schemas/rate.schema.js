const { z } = require('zod');
const { roomTypes } = require('./room.schema');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');
const roomType = z.enum(roomTypes, { message: 'Tipo de habitación inválido' });

const seasonCreateSchema = z
  .object({
    roomType,
    fechaInicio: isoDate,
    fechaFin: isoDate,
    tarifa: z.number().int().positive('La tarifa debe ser un entero positivo'),
  })
  .refine((d) => d.fechaInicio < d.fechaFin, {
    message: 'fechaInicio debe ser anterior a fechaFin',
    path: ['fechaFin'],
  });

const weekdayRateCreateSchema = z.object({
  roomType,
  diaSemana: z
    .number()
    .int('diaSemana debe ser un número entero')
    .min(0, 'diaSemana debe estar entre 0 (domingo) y 6 (sábado)')
    .max(6, 'diaSemana debe estar entre 0 (domingo) y 6 (sábado)'),
  tarifa: z.number().int().positive('La tarifa debe ser un entero positivo'),
});

const rateListQuerySchema = z.object({
  roomType: roomType.optional(),
});

const rateQuoteQuerySchema = z
  .object({
    roomType,
    checkIn: isoDate,
    checkOut: isoDate,
  })
  .refine((d) => d.checkIn < d.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

const rateIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Id inválido'),
});

module.exports = {
  rateIdParamSchema,
  rateListQuerySchema,
  rateQuoteQuerySchema,
  seasonCreateSchema,
  weekdayRateCreateSchema,
};
