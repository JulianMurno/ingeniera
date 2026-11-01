const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const guestRegisterSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().email('El email no es válido'),
  dni: z
    .string()
    .trim()
    .min(1, 'El DNI es obligatorio')
    .regex(/^[A-Za-z0-9]{6,10}$/, 'El DNI debe tener entre 6 y 10 caracteres alfanuméricos'),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?\d{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos, con + opcional')
    .optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const guestLoginSchema = z.object({
  email: z.string().trim().email('El email no es válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['newPassword'],
  });

module.exports = {
  loginSchema,
  guestRegisterSchema,
  guestLoginSchema,
  changePasswordSchema,
};

