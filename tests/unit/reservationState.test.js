const {
  CANCELADA,
  CONFIRMADA,
  EN_CURSO,
  ESTADOS_RESERVA,
  FINALIZADA,
  NO_SHOW,
  assertTransition,
  canTransition,
  isEstadoReserva,
} = require('../../src/lib/reservationState');

describe('estados de reserva', () => {
  test('el ciclo de vida expone los cinco estados', () => {
    expect(ESTADOS_RESERVA).toEqual([
      'CONFIRMADA',
      'EN_CURSO',
      'FINALIZADA',
      'CANCELADA',
      'NO_SHOW',
    ]);
  });

  test('reconoce los estados válidos y rechaza los desconocidos', () => {
    expect(isEstadoReserva(EN_CURSO)).toBe(true);
    expect(isEstadoReserva('PENDIENTE')).toBe(false);
    expect(isEstadoReserva(undefined)).toBe(false);
  });
});

describe('transiciones válidas', () => {
  test('permite CONFIRMADA → EN_CURSO, EN_CURSO → FINALIZADA, CONFIRMADA → CANCELADA y CONFIRMADA → NO_SHOW', () => {
    expect(canTransition(CONFIRMADA, EN_CURSO)).toBe(true);
    expect(canTransition(EN_CURSO, FINALIZADA)).toBe(true);
    expect(canTransition(CONFIRMADA, CANCELADA)).toBe(true);
    expect(canTransition(CONFIRMADA, NO_SHOW)).toBe(true);
  });

  test('rechaza cualquier otra transición', () => {
    expect(canTransition(CONFIRMADA, FINALIZADA)).toBe(false);
    expect(canTransition(CONFIRMADA, CONFIRMADA)).toBe(false);
    expect(canTransition(EN_CURSO, CANCELADA)).toBe(false);
    expect(canTransition(EN_CURSO, NO_SHOW)).toBe(false);
    expect(canTransition(EN_CURSO, EN_CURSO)).toBe(false);
    expect(canTransition(FINALIZADA, EN_CURSO)).toBe(false);
    expect(canTransition(CANCELADA, EN_CURSO)).toBe(false);
    expect(canTransition(NO_SHOW, EN_CURSO)).toBe(false);
  });

  test('los estados terminales no tienen salida', () => {
    for (const estado of ESTADOS_RESERVA) {
      const destinos = ESTADOS_RESERVA.filter((destino) => canTransition(estado, destino));
      if (estado === CONFIRMADA) {
        expect(destinos.sort()).toEqual([CANCELADA, EN_CURSO, NO_SHOW].sort());
      } else if (estado === EN_CURSO) {
        expect(destinos).toEqual([FINALIZADA]);
      } else {
        expect(destinos).toEqual([]);
      }
    }
  });
});

describe('assertTransition', () => {
  test('no lanza para una transición permitida', () => {
    expect(() => assertTransition(CONFIRMADA, EN_CURSO)).not.toThrow();
  });

  test('lanza 409 CONFLICT para una transición no permitida', () => {
    try {
      assertTransition(EN_CURSO, CANCELADA);
      throw new Error('debería haber lanzado');
    } catch (err) {
      expect(err.status).toBe(409);
      expect(err.code).toBe('CONFLICT');
      expect(err.message).toMatch(/EN_CURSO → CANCELADA/);
    }
  });

  test('lanza 409 también ante un estado desconocido', () => {
    expect(() => assertTransition('PENDIENTE', EN_CURSO)).toThrow();
    expect(() => assertTransition(CONFIRMADA, 'PENDIENTE')).toThrow();
  });
});
