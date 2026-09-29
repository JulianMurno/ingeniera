const { z } = require('zod');

const roles = ['RECEPCIONISTA', 'ADMINISTRADOR'];

const username = z
  .string()
  .trim()
  .min(3, 'El usuario debe tener al menos 3 caracteres')
  .max(50, 'El usuario no puede superar los 50 caracteres')
  .regex(/^[A-Za-z0-9._-]+$/, 'El usuario solo admite letras, números, punto, guion y guion bajo');

const password = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100);

const rol = z.enum(roles, { message: 'Rol inválido' });

const userBaseSchema = z.object({
  username,
  password,
  rol,
});

const userCreateSchema = userBaseSchema;

const userUpdateSchema = userBaseSchema
  .partial()
  .extend({ activo: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviarse al menos un campo para actualizar el usuario',
    path: [],
  });

module.exports = { userCreateSchema, userUpdateSchema, roles };
