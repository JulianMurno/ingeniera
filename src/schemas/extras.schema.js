const { z } = require('zod');

const categorias = ['ALIMENTOS', 'LAVANDERIA', 'TRANSPORTE', 'SERVICIOS', 'OTROS'];
const unidades = ['NOCHE', 'POR_UNIDAD', 'DIA', 'ESTANCIA'];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

const optionalBoolean = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return value === 'true' || value === '1';
  });

const descripcion = z.string().trim().min(1, 'La descripción no puede estar vacía').nullable();

const extraBaseSchema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{2,20}$/, 'El código debe tener 2 a 20 caracteres A-Z, 0-9 o guiones'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  categoria: z.enum(categorias, { message: 'Categoría inválida' }),
  precio: z.number().int('El precio debe ser un entero').positive('El precio debe ser positivo'),
  unidad: z.enum(unidades, { message: 'Unidad de cobro inválida' }),
  descripcion: descripcion.optional(),
});

const extraCreateSchema = extraBaseSchema;

const extraUpdateSchema = extraBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviarse al menos un campo para actualizar el servicio',
    path: [],
  });

const extraQuerySchema = z.object({
  categoria: z.enum(categorias, { message: 'Categoría inválida' }).optional(),
  activo: optionalBoolean,
  page: z.coerce.number().int().positive('page inválida').default(1),
  pageSize: z.coerce.number().int().positive('pageSize inválido').max(100).default(10),
});

const extraConsumoQuerySchema = z
  .object({
    desde: isoDate,
    hasta: isoDate,
  })
  .refine((data) => data.desde < data.hasta, {
    message: 'La fecha inicial debe ser anterior a la final',
    path: ['desde'],
  });

const chargeCreateSchema = z.object({
  extraId: z.number().int().positive('extraId inválido'),
  cantidad: z.number().int('La cantidad debe ser un entero').min(1, 'La cantidad debe ser al menos 1'),
  nota: z.string().trim().min(1, 'La nota no puede estar vacía').nullable().optional(),
});

const chargeParamsSchema = z.object({
  id: z.coerce.number().int().positive('Id inválido'),
  chargeId: z.coerce.number().int().positive('chargeId inválido'),
});

module.exports = {
  categorias,
  unidades,
  extraCreateSchema,
  extraUpdateSchema,
  extraQuerySchema,
  extraConsumoQuerySchema,
  chargeCreateSchema,
  chargeParamsSchema,
};
