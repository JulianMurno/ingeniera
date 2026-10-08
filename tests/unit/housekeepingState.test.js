const {
  ESTADOS_HOUSEKEEPING,
  assertTransition,
  canTransition,
} = require('../../src/lib/housekeepingState');

describe('estados de housekeeping', () => {
  test('expone los siete estados', () => {
    expect(ESTADOS_HOUSEKEEPING).toEqual([
      'PENDIENTE',
      'EN_PROCESO',
      'LIMPIA',
      'EN_INSPECCION',
      'INSPECCION_OK',
      'INSPECCION_FALLA',
      'CANCELADA',
    ]);
  });
});

describe('transiciones válidas de housekeeping', () => {
  test('permite la cadena principal PENDIENTE → EN_PROCESO → LIMPIA → EN_INSPECCION', () => {
    expect(canTransition('PENDIENTE', 'EN_PROCESO')).toBe(true);
    expect(canTransition('EN_PROCESO', 'LIMPIA')).toBe(true);
    expect(canTransition('LIMPIA', 'EN_INSPECCION')).toBe(true);
  });

  test('permite los dos desenlaces de la inspección y el reingreso a proceso', () => {
    expect(canTransition('EN_INSPECCION', 'INSPECCION_OK')).toBe(true);
    expect(canTransition('EN_INSPECCION', 'INSPECCION_FALLA')).toBe(true);
    expect(canTransition('INSPECCION_FALLA', 'EN_PROCESO')).toBe(true);
  });

  test('permite cancelar desde los estados activos', () => {
    for (const from of ['PENDIENTE', 'EN_PROCESO', 'LIMPIA']) {
      expect(canTransition(from, 'CANCELADA')).toBe(true);
    }
    expect(canTransition('EN_INSPECCION', 'CANCELADA')).toBe(false);
  });

  test('rechaza transiciones que saltean estados o vuelven atrás', () => {
    expect(canTransition('PENDIENTE', 'LIMPIA')).toBe(false);
    expect(canTransition('LIMPIA', 'PENDIENTE')).toBe(false);
    expect(canTransition('EN_PROCESO', 'INSPECCION_OK')).toBe(false);
    expect(canTransition('INSPECCION_FALLA', 'LIMPIA')).toBe(false);
  });

  test('los estados terminales no tienen salida', () => {
    for (const terminal of ['INSPECCION_OK', 'CANCELADA']) {
      for (const destino of ESTADOS_HOUSEKEEPING) {
        expect(canTransition(terminal, destino)).toBe(false);
      }
    }
  });
});

describe('assertTransition de housekeeping', () => {
  test('no lanza para una transición permitida', () => {
    expect(() => assertTransition('PENDIENTE', 'EN_PROCESO')).not.toThrow();
  });

  test('lanza 409 CONFLICT para una transición inválida', () => {
    try {
      assertTransition('PENDIENTE', 'LIMPIA');
      throw new Error('debería haber lanzado');
    } catch (err) {
      expect(err.status).toBe(409);
      expect(err.code).toBe('CONFLICT');
    }
  });

  test('lanza 409 al intentar mover un estado terminal', () => {
    expect(() => assertTransition('INSPECCION_OK', 'EN_PROCESO')).toThrow();
  });
});