const {
  assertStayWithinLimits,
  getCheckInHour,
  getCheckOutHour,
  getMaxStayNights,
  getMinStayNights,
} = require('../../src/config/availabilityRules');

const RULES_ENV = ['MIN_STAY_NIGHTS', 'MAX_STAY_NIGHTS', 'CHECK_IN_HOUR', 'CHECK_OUT_HOUR'];
const previousEnv = {};

beforeEach(() => {
  for (const key of RULES_ENV) {
    previousEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of RULES_ENV) {
    if (previousEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previousEnv[key];
    }
  }
});

describe('lectura de las reglas por entorno', () => {
  test('sin variables define valores por defecto utilizables', () => {
    expect(getMinStayNights()).toBe(1);
    expect(getMaxStayNights()).toBe(30);
    expect(getCheckInHour()).toBe(15 * 60);
    expect(getCheckOutHour()).toBe(11 * 60);
  });

  test('lee MIN_STAY_NIGHTS y MAX_STAY_NIGHTS del entorno', () => {
    process.env.MIN_STAY_NIGHTS = '2';
    process.env.MAX_STAY_NIGHTS = '14';

    expect(getMinStayNights()).toBe(2);
    expect(getMaxStayNights()).toBe(14);
  });

  test('lee CHECK_IN_HOUR y CHECK_OUT_HOUR en HH:mm y en HH', () => {
    process.env.CHECK_IN_HOUR = '14:30';
    process.env.CHECK_OUT_HOUR = '10';

    expect(getCheckInHour()).toBe(14 * 60 + 30);
    expect(getCheckOutHour()).toBe(10 * 60);
  });

  test('un valor inválido o vacío cae en el valor por defecto', () => {
    process.env.MIN_STAY_NIGHTS = 'no-es-un-numero';
    process.env.CHECK_IN_HOUR = '25:99';
    process.env.CHECK_OUT_HOUR = '';

    expect(getMinStayNights()).toBe(1);
    expect(getCheckInHour()).toBe(15 * 60);
    expect(getCheckOutHour()).toBe(11 * 60);
  });
});

describe('assertStayWithinLimits', () => {
  test('acepta una estancia dentro de los límites', () => {
    process.env.MIN_STAY_NIGHTS = '2';
    process.env.MAX_STAY_NIGHTS = '5';

    expect(assertStayWithinLimits(2)).toBe(2);
    expect(assertStayWithinLimits(5)).toBe(5);
  });

  test('rechaza por debajo del mínimo con 422', () => {
    process.env.MIN_STAY_NIGHTS = '2';

    expect(() => assertStayWithinLimits(1)).toThrow(/estancia mínima/i);
    try {
      assertStayWithinLimits(1);
    } catch (err) {
      expect(err.status).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
    }
  });

  test('rechaza por encima del máximo con 422', () => {
    process.env.MAX_STAY_NIGHTS = '4';

    expect(() => assertStayWithinLimits(5)).toThrow(/estancia máxima/i);
    try {
      assertStayWithinLimits(5);
    } catch (err) {
      expect(err.status).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
    }
  });
});
