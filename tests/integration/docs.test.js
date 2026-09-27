const request = require('supertest');
const { app } = require('../helpers/db');
const { spec } = require('../../src/docs');

function queryParamNames(operation) {
  return (operation.parameters || []).map((p) => p.name);
}

describe('Documentación OpenAPI', () => {
  test('el schema Room documenta estado, capacidad y datos descriptivos', () => {
    const { properties } = spec.components.schemas.Room;

    expect(properties.estado).toBeDefined();
    expect(properties.capacidad.minimum).toBe(1);
    expect(properties.descripcion).toBeDefined();
    expect(properties.comodidades.type).toBe('array');
    expect(properties.fotos.type).toBe('array');
    expect(spec.components.schemas.EstadoHabitacion.enum).toEqual(['DISPONIBLE', 'MANTENIMIENTO']);
  });

  test('el schema RoomUpdate permite cambiar estado y capacidad', () => {
    const { properties } = spec.components.schemas.RoomUpdate;

    expect(properties.estado).toBeDefined();
    expect(properties.capacidad).toBeDefined();
  });

  test('GET /rooms documenta filtros, paginación y el sobre { data, pagination }', () => {
    const params = queryParamNames(spec.paths['/rooms'].get);

    expect(params).toEqual(
      expect.arrayContaining([
        'tipo',
        'estado',
        'tarifaMin',
        'tarifaMax',
        'checkIn',
        'checkOut',
        'page',
        'pageSize',
      ]),
    );
    expect(spec.paths['/rooms'].get.responses[200].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/RoomList',
    });
  });

  test('PATCH /rooms/{id} documenta los nuevos códigos de error', () => {
    const responses = spec.paths['/rooms/{id}'].patch.responses;

    expect(responses[200]).toBeDefined();
    expect(responses[403]).toBeDefined();
    expect(responses[404]).toBeDefined();
    expect(responses[422]).toBeDefined();
  });

  test('/api/docs sirve la interfaz Swagger', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });

  test('GET /availability documenta los parámetros de ocupantes y horarios', () => {
    const params = queryParamNames(spec.paths['/availability'].get);

    expect(params).toEqual(
      expect.arrayContaining([
        'checkIn',
        'checkOut',
        'type',
        'ocupantes',
        'earlyCheckIn',
        'lateCheckOut',
      ]),
    );
  });

  test('el módulo de tarifas está documentado con sus endpoints', () => {
    expect(spec.tags.map((tag) => tag.name)).toContain('Tarifas');
    expect(spec.paths['/rates/seasons'].post).toBeDefined();
    expect(spec.paths['/rates/seasons'].get).toBeDefined();
    expect(spec.paths['/rates/seasons/{id}'].delete).toBeDefined();
    expect(spec.paths['/rates/weekdays'].post).toBeDefined();
    expect(spec.paths['/rates/weekdays'].get).toBeDefined();
    expect(spec.paths['/rates/weekdays/{id}'].delete).toBeDefined();
    expect(spec.paths['/rates/quote'].get).toBeDefined();

    expect(spec.paths['/rates/seasons'].post.responses[403]).toBeDefined();
    expect(spec.paths['/rates/seasons'].post.responses[409]).toBeDefined();
    expect(spec.paths['/rates/weekdays'].post.responses[403]).toBeDefined();
    expect(spec.paths['/rates/weekdays'].post.responses[409]).toBeDefined();
    expect(
      spec.paths['/rates/quote'].get.responses[200].content['application/json'].schema,
    ).toEqual({ $ref: '#/components/schemas/RateQuote' });
  });

  test('los schemas de tarifa documentan temporada, día de semana y desglose', () => {
    const { schemas } = spec.components;

    expect(schemas.SeasonCreate.required).toEqual([
      'roomType',
      'fechaInicio',
      'fechaFin',
      'tarifa',
    ]);
    expect(schemas.WeekdayRateCreate.required).toEqual(['roomType', 'diaSemana', 'tarifa']);
    expect(schemas.DiaSemana.minimum).toBe(0);
    expect(schemas.DiaSemana.maximum).toBe(6);
    expect(schemas.RateNight.properties.origen.enum).toEqual(['WEEKDAY', 'SEASON', 'BASE']);
    expect(schemas.RateQuote.properties.detalle.items).toEqual({
      $ref: '#/components/schemas/RateNight',
    });
  });

  test('las schemas de reserva documentan earlyCheckIn y lateCheckOut', () => {
    const { schemas } = spec.components;

    expect(schemas.ReservationCreate.properties.earlyCheckIn).toBeDefined();
    expect(schemas.ReservationCreate.properties.lateCheckOut).toBeDefined();
    expect(schemas.ReservationUpdate.properties.earlyCheckIn).toBeDefined();
    expect(schemas.ReservationUpdate.properties.lateCheckOut).toBeDefined();
    expect(spec.paths['/reservations/{id}'].patch.responses[422]).toBeDefined();
  });
});
