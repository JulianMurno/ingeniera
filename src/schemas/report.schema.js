const { z } = require('zod');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const reportQuerySchema = z
  .object({
    checkIn: isoDate,
    checkOut: isoDate,
  })
  .refine((data) => data.checkIn < data.checkOut, {
    message: 'checkIn debe ser anterior a checkOut',
    path: ['checkOut'],
  });

module.exports = { reportQuerySchema };
