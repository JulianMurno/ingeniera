const { z } = require('zod');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const reservationCreateSchema = z
  .object({
    guestId: z.number().int().positive('guestId inválido'),
    roomId: z.number().int().positive('roomId inválido'),
    checkIn: isoDate,
    checkOut: isoDate,
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
    earlyCheckIn: z.boolean().optional(),
    lateCheckOut: z.boolean().optional(),
  })
  .refine((d) => !d.checkIn || !d.checkOut || d.checkIn < d.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

const reservationQuerySchema = z.object({
  dni: z.string().optional(),
  roomId: z.coerce.number().int().positive('roomId inválido').optional(),
  fecha: isoDate.optional(),
  estado: z.enum(['CONFIRMADA', 'CANCELADA']).optional(),
  guestId: z.coerce.number().int().positive('guestId inválido').optional(),
  page: z.coerce.number().int().positive('page inválida').default(1),
  pageSize: z.coerce.number().int().positive('pageSize inválido').max(100).default(10),
});

module.exports = { reservationCreateSchema, reservationUpdateSchema, reservationQuerySchema };
