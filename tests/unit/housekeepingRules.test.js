const {
  getHousekeepingBlockCheckIn,
  HOUSEKEEPING_BLOCK_CHECKIN_DEFAULT,
} = require('../../src/config/housekeepingRules');

const ENV_KEY = 'HOUSEKEEPING_BLOCK_CHECKIN';
const previous = {};

beforeEach(() => {
  previous[ENV_KEY] = process.env[ENV_KEY];
  delete process.env[ENV_KEY];
});

afterEach(() => {
  if (previous[ENV_KEY] === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = previous[ENV_KEY];
  }
});

describe('HOUSEKEEPING_BLOCK_CHECKIN', () => {
  test('por defecto la regla está desactivada (false)', () => {
    expect(HOUSEKEEPING_BLOCK_CHECKIN_DEFAULT).toBe(false);
    expect(getHousekeepingBlockCheckIn()).toBe(false);
  });

  test('activa con valores verdaderos', () => {
    for (const value of ['true', 'TRUE', '1']) {
      process.env[ENV_KEY] = value;
      expect(getHousekeepingBlockCheckIn()).toBe(true);
    }
  });

  test('desactivada con valores falsos o ausentes', () => {
    for (const value of ['false', '0', '']) {
      process.env[ENV_KEY] = value;
      expect(getHousekeepingBlockCheckIn()).toBe(false);
    }
    delete process.env[ENV_KEY];
    expect(getHousekeepingBlockCheckIn()).toBe(false);
  });
});