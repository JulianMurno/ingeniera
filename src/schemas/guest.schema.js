const { z } = require('zod');

const dni = z
  .string()
  .trim()
  .min(1, 'El DNI es obligatorio')
  .regex(/^[A-Za-z0-9]{6,10}$/, 'El DNI debe tener entre 6 y 10 caracteres alfanuméricos');

const telefono = z
  .string()
  .trim()
  .regex(/^\+?\d{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos, con + opcional');

const guestBaseSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().email('El email no es válido'),
  dni,
  telefono: telefono.optional(),
});

const guestCreateSchema = guestBaseSchema;

const guestUpdateSchema = guestBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviarse al menos un campo para actualizar el huésped',
    path: [],
  });

const guestQuerySchema = z.object({
  dni: z.string().optional(),
  nombre: z.string().optional(),
  page: z.coerce.number().int().positive('page inválida').default(1),
  pageSize: z.coerce.number().int().positive('pageSize inválido').max(100).default(10),
});

module.exports = { guestCreateSchema, guestUpdateSchema, guestQuerySchema };
