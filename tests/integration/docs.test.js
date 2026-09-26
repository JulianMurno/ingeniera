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
    expect(spec.components.schemas.EstadoHabitacion.enum).toEqual([
      'DISPONIBLE',
      'MANTENIMIENTO',
    ]);
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
});
