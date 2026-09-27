const { z } = require('zod');
const { ESTADOS_RESERVA } = require('../lib/reservationState');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const adultos = z
  .number()
  .int('adultos debe ser un número entero')
  .min(1, 'La reserva debe tener al menos un adulto');
const menores = z
  .number()
  .int('menores debe ser un número entero')
  .min(0, 'menores no puede ser negativo');
const notas = z.string().min(1, 'Las notas no pueden estar vacías').nullable();

const reservationCreateSchema = z
  .object({
    guestId: z.number().int().positive('guestId inválido'),
    roomId: z.number().int().positive('roomId inválido'),
    checkIn: isoDate,
    checkOut: isoDate,
    adultos: adultos.optional(),
    menores: menores.optional(),
    notas: notas.optional(),
    earlyCheckIn: z.boolean().optional(),
    lateCheckOut: z.boolean().optional(),
  })
  .refine((d) => d.checkIn < d.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

const reservationUpdateSchema = z
  .object({
    guestId: z.number().int().positive('guestId inválido').optional(),
    roomId: z.number().int().positive('roomId inválido').optional(),
    checkIn: isoDate.optional(),
    checkOut: isoDate.optional(),
    adultos: adultos.optional(),
    menores: menores.optional(),
    notas: notas.optional(),
    earlyCheckIn: z.boolean().optional(),
    lateCheckOut: z.boolean().optional(),
  })
  .refine((d) => !d.checkIn || !d.checkOut || d.checkIn < d.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

const reservationCancelSchema = z.object({
  motivo: z.string().min(1, 'El motivo no puede estar vacío').nullable().optional(),
});

const reservationQuerySchema = z.object({
  dni: z.string().optional(),
  roomId: z.coerce.number().int().positive('roomId inválido').optional(),
  fecha: isoDate.optional(),
  estado: z.enum(ESTADOS_RESERVA).optional(),
  guestId: z.coerce.number().int().positive('guestId inválido').optional(),
  page: z.coerce.number().int().positive('page inválida').default(1),
  pageSize: z.coerce.number().int().positive('pageSize inválido').max(100).default(10),
});

module.exports = {
  reservationCreateSchema,
  reservationUpdateSchema,
  reservationCancelSchema,
  reservationQuerySchema,
};
