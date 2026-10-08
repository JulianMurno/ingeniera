const {
  ESTADOS_MAINTENANCE,
  assertTransition,
  canTransition,
} = require('../../src/lib/maintenanceState');

describe('estados de mantenimiento', () => {
  test('expone cuatro estados', () => {
    expect(ESTADOS_MAINTENANCE).toEqual(['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CANCELADO']);
  });
});

describe('transiciones válidas de mantenimiento', () => {
  test('permite ABIERTO → EN_PROCESO → RESUELTO', () => {
    expect(canTransition('ABIERTO', 'EN_PROCESO')).toBe(true);
    expect(canTransition('EN_PROCESO', 'RESUELTO')).toBe(true);
  });

  test('permite resolver directo desde ABIERTO', () => {
    expect(canTransition('ABIERTO', 'RESUELTO')).toBe(true);
  });

  test('permite cancelar desde ABIERTO y EN_PROCESO', () => {
    expect(canTransition('ABIERTO', 'CANCELADO')).toBe(true);
    expect(canTransition('EN_PROCESO', 'CANCELADO')).toBe(true);
  });

  test('rechaza transiciones inválidas', () => {
    expect(canTransition('RESUELTO', 'EN_PROCESO')).toBe(false);
    expect(canTransition('CANCELADO', 'ABIERTO')).toBe(false);
    expect(canTransition('ABIERTO', 'ABIERTO')).toBe(false);
    expect(canTransition('EN_PROCESO', 'EN_PROCESO')).toBe(false);
  });

  test('los estados terminales no tienen salida', () => {
    for (const terminal of ['RESUELTO', 'CANCELADO']) {
      for (const destino of ESTADOS_MAINTENANCE) {
        expect(canTransition(terminal, destino)).toBe(false);
      }
    }
  });
});

describe('assertTransition de mantenimiento', () => {
  test('no lanza para una transición permitida', () => {
    expect(() => assertTransition('ABIERTO', 'EN_PROCESO')).not.toThrow();
  });

  test('lanza 409 CONFLICT para una transición inválida', () => {
    try {
      assertTransition('RESUELTO', 'EN_PROCESO');
      throw new Error('debería haber lanzado');
    } catch (err) {
      expect(err.status).toBe(409);
      expect(err.code).toBe('CONFLICT');
    }
  });
});