const { z } = require('zod');

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const paymentCreateSchema = z.object({
  monto: z
    .number()
    .int('monto debe ser un número entero')
    .positive('monto debe ser mayor que cero'),
  metodo: z.enum(METODOS_PAGO, { message: 'Método de pago inválido' }),
  pagadoEn: isoDate.optional().describe('Fecha del pago; por defecto, hoy (YYYY-MM-DD)'),
});

module.exports = { METODOS_PAGO, paymentCreateSchema };
