const { guestRegisterSchema, guestLoginSchema } = require('../../src/schemas/auth.schema');

const validRegistration = {
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  dni: '12345678',
  telefono: '+5491123456789',
  password: 'clave-segura',
};

describe('esquemas de autenticación de huésped', () => {
  test('acepta un registro válido y normaliza espacios', () => {
    const parsed = guestRegisterSchema.parse({
      ...validRegistration,
      nombre: '  Juan Pérez  ',
      email: '  juan@example.com  ',
    });

    expect(parsed.nombre).toBe('Juan Pérez');
    expect(parsed.email).toBe('juan@example.com');
    expect(parsed.telefono).toBe('+5491123456789');
  });

  test('el teléfono es opcional', () => {
    const withoutPhone = { ...validRegistration };
    delete withoutPhone.telefono;
    expect(guestRegisterSchema.safeParse(withoutPhone).success).toBe(true);
  });

  test.each([
    ['email inválido', { email: 'no-es-email' }],
    ['dni inválido', { dni: '12' }],
    ['contraseña corta', { password: '1234567' }],
    ['nombre vacío', { nombre: '   ' }],
    ['teléfono inválido', { telefono: 'abc' }],
  ])('rechaza %s', (_label, override) => {
    const result = guestRegisterSchema.safeParse({ ...validRegistration, ...override });
    expect(result.success).toBe(false);
  });

  test('login exige email válido y contraseña', () => {
    expect(
      guestLoginSchema.safeParse({ email: 'juan@example.com', password: 'clave-segura' }).success,
    ).toBe(true);
    expect(guestLoginSchema.safeParse({ email: 'juan@example.com', password: '' }).success).toBe(
      false,
    );
    expect(guestLoginSchema.safeParse({ email: 'mal', password: 'x' }).success).toBe(false);
  });
});
