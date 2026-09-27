const {
  calculateNights,
  calculateTotal,
  calculateTotalFromNights,
  listNights,
  overlaps,
} = require('../../src/services/business.service');

const STAY_ENV = ['MIN_STAY_NIGHTS', 'MAX_STAY_NIGHTS', 'CHECK_IN_HOUR', 'CHECK_OUT_HOUR'];
const previousEnv = {};

beforeEach(() => {
  for (const key of STAY_ENV) {
    previousEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of STAY_ENV) {
    if (previousEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previousEnv[key];
    }
  }
});

describe('calculateNights', () => {
  test('calcula las noches entre dos fechas', () => {
    expect(calculateNights('2026-09-08', '2026-09-11')).toBe(3);
  });

  test('lanza error si checkIn es posterior a checkOut', () => {
    expect(() => calculateNights('2026-09-11', '2026-09-08')).toThrow(/rango/i);
  });

  test('lanza error con rango de cero noches', () => {
    expect(() => calculateNights('2026-09-08', '2026-09-08')).toThrow(/rango/i);
  });

  test('rechaza una estancia por debajo del mínimo configurado', () => {
    process.env.MIN_STAY_NIGHTS = '3';

    expect(() => calculateNights('2026-09-08', '2026-09-10')).toThrow(/estancia mínima/i);
    expect(calculateNights('2026-09-08', '2026-09-11')).toBe(3);
  });

  test('rechaza una estancia por encima del máximo configurado', () => {
    process.env.MAX_STAY_NIGHTS = '4';

    expect(() => calculateNights('2026-09-08', '2026-09-13')).toThrow(/estancia máxima/i);
    expect(calculateNights('2026-09-08', '2026-09-12')).toBe(4);
  });
});

describe('listNights', () => {
  test('devuelve una fecha por noche del rango', () => {
    const noches = listNights('2026-09-08', '2026-09-11');

    expect(noches.map((n) => n.toISOString().slice(0, 10))).toEqual([
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
    ]);
  });
});

describe('calculateTotal', () => {
  test('multiplica noches por la tarifa por noche', () => {
    expect(calculateTotal(3, 10000)).toBe(30000);
  });
});

describe('calculateTotalFromNights', () => {
  test('suma la tarifa vigente de cada noche', () => {
    expect(
      calculateTotalFromNights([
        { fecha: '2026-09-10', tarifa: 10000 },
        { fecha: '2026-09-11', tarifa: 20000 },
        { fecha: '2026-09-12', tarifa: 30000 },
      ]),
    ).toBe(60000);
  });
});

describe('overlaps', () => {
  test('detecta solapamiento de rangos', () => {
    expect(overlaps('2026-09-08', '2026-09-11', '2026-09-10', '2026-09-12')).toBe(true);
    expect(overlaps('2026-09-10', '2026-09-12', '2026-09-08', '2026-09-11')).toBe(true);
  });

  test('recambio el mismo día no se considera solapamiento', () => {
    expect(overlaps('2026-09-08', '2026-09-10', '2026-09-10', '2026-09-12')).toBe(false);
  });

  test('rangos disjuntos no se solapan', () => {
    expect(overlaps('2026-09-08', '2026-09-10', '2026-09-11', '2026-09-12')).toBe(false);
  });

  test('el late check-out impide el check-in del mismo día', () => {
    expect(
      overlaps('2026-09-08', '2026-09-10', '2026-09-10', '2026-09-12', {
        a: { lateCheckOut: true },
      }),
    ).toBe(true);
  });

  test('el early check-in impide el check-out de la noche anterior', () => {
    expect(
      overlaps('2026-09-08', '2026-09-10', '2026-09-10', '2026-09-12', {
        b: { earlyCheckIn: true },
      }),
    ).toBe(true);
  });

  test('el recambio estándar sigue permitido con horarios por defecto', () => {
    process.env.CHECK_IN_HOUR = '15:00';
    process.env.CHECK_OUT_HOUR = '11:00';

    expect(overlaps('2026-09-08', '2026-09-10', '2026-09-10', '2026-09-12')).toBe(false);
  });

  test('un check-out a medianoche habilita el early check-in del mismo día', () => {
    process.env.CHECK_OUT_HOUR = '00:00';

    expect(
      overlaps('2026-09-08', '2026-09-10', '2026-09-10', '2026-09-12', {
        b: { earlyCheckIn: true },
      }),
    ).toBe(false);
  });

  test('el late check-out no afecta a los días siguientes', () => {
    expect(
      overlaps('2026-09-08', '2026-09-10', '2026-09-11', '2026-09-12', {
        a: { lateCheckOut: true },
      }),
    ).toBe(false);
  });
});
