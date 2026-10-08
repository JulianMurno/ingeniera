const { z } = require('zod');
const { ACCIONES_AUDITORIA, RECURSOS_AUDITORIA } = require('../lib/audit');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const auditQuerySchema = z
  .object({
    userId: z.coerce.number().int().positive('userId inválido').optional(),
    accion: z.enum(ACCIONES_AUDITORIA, { message: 'Acción inválida' }).optional(),
    recurso: z.enum(RECURSOS_AUDITORIA, { message: 'Recurso inválido' }).optional(),
    desde: isoDate.optional(),
    hasta: isoDate.optional(),
    page: z.coerce.number().int().positive('page inválida').default(1),
    pageSize: z.coerce.number().int().positive('pageSize inválido').max(100).default(10),
  })
  .refine((data) => !data.desde || !data.hasta || data.desde <= data.hasta, {
    message: 'desde no puede ser posterior a hasta',
    path: ['hasta'],
  });

module.exports = { auditQuerySchema };
