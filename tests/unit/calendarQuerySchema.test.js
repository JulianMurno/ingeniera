const { calendarQuerySchema } = require('../../src/schemas/reservation.schema');

describe('calendarQuerySchema', () => {
  test('acepta un rango con desde anterior a hasta', () => {
    const parsed = calendarQuerySchema.parse({ desde: '2026-11-01', hasta: '2026-12-01' });

    expect(parsed).toEqual({ desde: '2026-11-01', hasta: '2026-12-01' });
  });

  test.each([
    ['fecha ausente', { hasta: '2026-12-01' }],
    ['fecha ausente', { desde: '2026-11-01' }],
    ['formato inválido', { desde: '2026-11-1', hasta: '2026-12-01' }],
    ['formato inválido', { desde: '2026-11-01', hasta: '01/12/2026' }],
    ['desde igual a hasta', { desde: '2026-11-01', hasta: '2026-11-01' }],
    ['desde posterior a hasta', { desde: '2026-12-01', hasta: '2026-11-01' }],
  ])('rechaza un rango con %s', (_label, query) => {
    expect(calendarQuerySchema.safeParse(query).success).toBe(false);
  });
});
