const {
  ORIGEN_BASE,
  ORIGEN_SEMANA,
  ORIGEN_TEMPORADA,
  resolveTarifaNoche,
} = require('../../src/services/rate.service');

const TARIFA_BASE = 10000;
const TARIFA_TEMPORADA = 20000;
const TARIFA_SEMANA = 30000;

describe('resolveTarifaNoche', () => {
  test('sin temporada ni tarifa de día de semana usa la tarifa base', () => {
    expect(
      resolveTarifaNoche({
        tarifaSemana: undefined,
        tarifaTemporada: undefined,
        tarifaBase: TARIFA_BASE,
      }),
    ).toEqual({ tarifa: TARIFA_BASE, origen: ORIGEN_BASE });
  });

  test('con temporada vigente y sin override de día usa la tarifa de temporada', () => {
    expect(
      resolveTarifaNoche({
        tarifaSemana: undefined,
        tarifaTemporada: TARIFA_TEMPORADA,
        tarifaBase: TARIFA_BASE,
      }),
    ).toEqual({ tarifa: TARIFA_TEMPORADA, origen: ORIGEN_TEMPORADA });
  });

  test('la tarifa de día de semana tiene precedencia sobre la temporada', () => {
    expect(
      resolveTarifaNoche({
        tarifaSemana: TARIFA_SEMANA,
        tarifaTemporada: TARIFA_TEMPORADA,
        tarifaBase: TARIFA_BASE,
      }),
    ).toEqual({ tarifa: TARIFA_SEMANA, origen: ORIGEN_SEMANA });
  });

  test('la precedencia se mantiene en cada día de la semana', () => {
    const porDia = [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => {
      const conOverride = resolveTarifaNoche({
        tarifaSemana: diaSemana === 5 || diaSemana === 6 ? TARIFA_SEMANA : undefined,
        tarifaTemporada: TARIFA_TEMPORADA,
        tarifaBase: TARIFA_BASE,
      });
      const sinTemporada = resolveTarifaNoche({
        tarifaSemana: diaSemana === 5 || diaSemana === 6 ? TARIFA_SEMANA : undefined,
        tarifaTemporada: undefined,
        tarifaBase: TARIFA_BASE,
      });
      return { diaSemana, conOverride, sinTemporada };
    });

    for (const { diaSemana, conOverride, sinTemporada } of porDia) {
      const esFinde = diaSemana === 5 || diaSemana === 6;
      expect({ diaSemana, tarifa: conOverride.tarifa, origen: conOverride.origen }).toEqual({
        diaSemana,
        tarifa: esFinde ? TARIFA_SEMANA : TARIFA_TEMPORADA,
        origen: esFinde ? ORIGEN_SEMANA : ORIGEN_TEMPORADA,
      });
      expect({ tarifa: sinTemporada.tarifa, origen: sinTemporada.origen }).toEqual({
        tarifa: esFinde ? TARIFA_SEMANA : TARIFA_BASE,
        origen: esFinde ? ORIGEN_SEMANA : ORIGEN_BASE,
      });
    }
  });
});
