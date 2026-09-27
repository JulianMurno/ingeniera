const request = require('supertest');
const { app, prisma, resetDb, authHeader, withEnv } = require('../helpers/db');
const { getTarifaNoche } = require('../../src/services/rate.service');

beforeEach(resetDb);

describe('Tarifas', () => {
  beforeEach(async () => {
    await prisma.room.create({ data: { numero: '201', tipo: 'DOBLE', tarifa: 8000 } });
  });

  function admin() {
    return authHeader('admin');
  }

  describe('Temporadas', () => {
    test('alta de temporada por Administrador responde 201', async () => {
      const res = await request(app)
        .post('/api/v1/rates/seasons')
        .set('Authorization', await admin())
        .send({
          roomType: 'DOBLE',
          fechaInicio: '2026-09-01',
          fechaFin: '2026-10-01',
          tarifa: 12000,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ roomType: 'DOBLE', tarifa: 12000 });
      expect(await prisma.season.count()).toBe(1);
    });

    test('temporada superpuesta del mismo tipo responde 409', async () => {
      await prisma.season.create({
        data: {
          roomType: 'DOBLE',
          fechaInicio: new Date('2026-09-10T00:00:00.000Z'),
          fechaFin: new Date('2026-09-20T00:00:00.000Z'),
          tarifa: 12000,
        },
      });

      const res = await request(app)
        .post('/api/v1/rates/seasons')
        .set('Authorization', await admin())
        .send({
          roomType: 'DOBLE',
          fechaInicio: '2026-09-15',
          fechaFin: '2026-09-25',
          tarifa: 15000,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(await prisma.season.count()).toBe(1);
    });

    test('temporadas que solo se tocan en el borde no se consideran superpuestas', async () => {
      const res = await request(app)
        .post('/api/v1/rates/seasons')
        .set('Authorization', await admin())
        .send({
          roomType: 'DOBLE',
          fechaInicio: '2026-09-20',
          fechaFin: '2026-10-01',
          tarifa: 15000,
        });

      expect(res.status).toBe(201);
      expect(await prisma.season.count()).toBe(1);
    });

    test('alta de temporada sin permiso responde 403', async () => {
      const res = await request(app)
        .post('/api/v1/rates/seasons')
        .set('Authorization', await authHeader('recepcionista'))
        .send({
          roomType: 'DOBLE',
          fechaInicio: '2026-09-01',
          fechaFin: '2026-10-01',
          tarifa: 12000,
        });

      expect(res.status).toBe(403);
      expect(await prisma.season.count()).toBe(0);
    });

    test('temporada con fechaFin anterior a fechaInicio responde 422', async () => {
      const res = await request(app)
        .post('/api/v1/rates/seasons')
        .set('Authorization', await admin())
        .send({
          roomType: 'DOBLE',
          fechaInicio: '2026-10-01',
          fechaFin: '2026-09-01',
          tarifa: 12000,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('listado de temporadas filtrable por tipo', async () => {
      await prisma.season.createMany({
        data: [
          {
            roomType: 'DOBLE',
            fechaInicio: new Date('2026-09-01T00:00:00.000Z'),
            fechaFin: new Date('2026-09-15T00:00:00.000Z'),
            tarifa: 12000,
          },
          {
            roomType: 'SUITE',
            fechaInicio: new Date('2026-09-01T00:00:00.000Z'),
            fechaFin: new Date('2026-09-15T00:00:00.000Z'),
            tarifa: 30000,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/rates/seasons')
        .set('Authorization', await admin())
        .query({ roomType: 'DOBLE' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].roomType).toBe('DOBLE');
    });

    test('baja de temporada inexistente responde 404', async () => {
      const res = await request(app)
        .delete('/api/v1/rates/seasons/999999')
        .set('Authorization', await admin());

      expect(res.status).toBe(404);
    });

    test('baja de temporada sin permiso responde 403', async () => {
      const season = await prisma.season.create({
        data: {
          roomType: 'DOBLE',
          fechaInicio: new Date('2026-09-01T00:00:00.000Z'),
          fechaFin: new Date('2026-09-15T00:00:00.000Z'),
          tarifa: 12000,
        },
      });

      const res = await request(app)
        .delete(`/api/v1/rates/seasons/${season.id}`)
        .set('Authorization', await authHeader('recepcionista'));

      expect(res.status).toBe(403);
      expect(await prisma.season.count()).toBe(1);
    });
  });

  describe('Tarifas por día de semana', () => {
    test('alta de tarifa de fin de semana responde 201', async () => {
      const res = await request(app)
        .post('/api/v1/rates/weekdays')
        .set('Authorization', await admin())
        .send({ roomType: 'DOBLE', diaSemana: 5, tarifa: 20000 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ roomType: 'DOBLE', diaSemana: 5, tarifa: 20000 });
    });

    test('alta sin permiso responde 403', async () => {
      const res = await request(app)
        .post('/api/v1/rates/weekdays')
        .set('Authorization', await authHeader('recepcionista'))
        .send({ roomType: 'DOBLE', diaSemana: 5, tarifa: 20000 });

      expect(res.status).toBe(403);
      expect(await prisma.weekdayRate.count()).toBe(0);
    });

    test('diaSemana duplicado para el mismo tipo responde 409', async () => {
      await prisma.weekdayRate.create({ data: { roomType: 'DOBLE', diaSemana: 5, tarifa: 20000 } });

      const res = await request(app)
        .post('/api/v1/rates/weekdays')
        .set('Authorization', await admin())
        .send({ roomType: 'DOBLE', diaSemana: 5, tarifa: 22000 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(await prisma.weekdayRate.count()).toBe(1);
    });

    test('diaSemana fuera de 0-6 responde 422', async () => {
      const res = await request(app)
        .post('/api/v1/rates/weekdays')
        .set('Authorization', await admin())
        .send({ roomType: 'DOBLE', diaSemana: 7, tarifa: 20000 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('baja de tarifa por día de semana responde 200 y 404 si no existe', async () => {
      const rate = await prisma.weekdayRate.create({
        data: { roomType: 'DOBLE', diaSemana: 6, tarifa: 20000 },
      });

      const ok = await request(app)
        .delete(`/api/v1/rates/weekdays/${rate.id}`)
        .set('Authorization', await admin());
      expect(ok.status).toBe(200);
      expect(await prisma.weekdayRate.count()).toBe(0);

      const missing = await request(app)
        .delete('/api/v1/rates/weekdays/999999')
        .set('Authorization', await admin());
      expect(missing.status).toBe(404);
    });
  });

  describe('Consulta de tarifa vigente', () => {
    beforeEach(async () => {
      await prisma.season.create({
        data: {
          roomType: 'DOBLE',
          fechaInicio: new Date('2026-09-01T00:00:00.000Z'),
          fechaFin: new Date('2026-09-20T00:00:00.000Z'),
          tarifa: 12000,
        },
      });
      await prisma.weekdayRate.createMany({
        data: [
          { roomType: 'DOBLE', diaSemana: 5, tarifa: 20000 },
          { roomType: 'DOBLE', diaSemana: 6, tarifa: 20000 },
        ],
      });
    });

    test('responde 200 con el desglose por noche aplicando la precedencia', async () => {
      const res = await request(app)
        .get('/api/v1/rates/quote')
        .set('Authorization', await admin())
        .query({ roomType: 'DOBLE', checkIn: '2026-09-10', checkOut: '2026-09-13' });

      expect(res.status).toBe(200);
      expect(res.body.noches).toBe(3);
      expect(res.body.tarifaBase).toBe(8000);
      expect(res.body.detalle).toEqual([
        { fecha: '2026-09-10', diaSemana: 4, dia: 'jueves', tarifa: 12000, origen: 'SEASON' },
        { fecha: '2026-09-11', diaSemana: 5, dia: 'viernes', tarifa: 20000, origen: 'WEEKDAY' },
        { fecha: '2026-09-12', diaSemana: 6, dia: 'sabado', tarifa: 20000, origen: 'WEEKDAY' },
      ]);
      expect(res.body.total).toBe(52000);
    });

    test('fuera de temporada y sin override usa la tarifa base', async () => {
      const res = await request(app)
        .get('/api/v1/rates/quote')
        .set('Authorization', await admin())
        .query({ roomType: 'DOBLE', checkIn: '2026-10-05', checkOut: '2026-10-08' });

      expect(res.status).toBe(200);
      expect(res.body.detalle.map((night) => night.tarifa)).toEqual([8000, 8000, 8000]);
      expect(res.body.detalle.every((night) => night.origen === 'BASE')).toBe(true);
      expect(res.body.total).toBe(24000);
    });

    test('rango inválido responde 422', async () => {
      const res = await request(app)
        .get('/api/v1/rates/quote')
        .set('Authorization', await admin())
        .query({ roomType: 'DOBLE', checkIn: '2026-09-13', checkOut: '2026-09-10' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('respeta la estancia máxima configurada', async () => {
      const header = await admin();
      const res = await withEnv({ MAX_STAY_NIGHTS: '2' }, () =>
        request(app)
          .get('/api/v1/rates/quote')
          .set('Authorization', header)
          .query({ roomType: 'DOBLE', checkIn: '2026-09-10', checkOut: '2026-09-15' }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('requiere autenticación', async () => {
      const res = await request(app)
        .get('/api/v1/rates/quote')
        .query({ roomType: 'DOBLE', checkIn: '2026-09-10', checkOut: '2026-09-13' });

      expect(res.status).toBe(401);
    });
  });

  describe('getTarifaNoche', () => {
    test('aplica la precedencia noche por noche', async () => {
      await prisma.season.create({
        data: {
          roomType: 'DOBLE',
          fechaInicio: new Date('2026-09-01T00:00:00.000Z'),
          fechaFin: new Date('2026-09-20T00:00:00.000Z'),
          tarifa: 12000,
        },
      });
      await prisma.weekdayRate.createMany({
        data: [
          { roomType: 'DOBLE', diaSemana: 5, tarifa: 20000 },
          { roomType: 'DOBLE', diaSemana: 6, tarifa: 20000 },
        ],
      });

      const porNoche = {};
      for (const fecha of ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-20']) {
        porNoche[fecha] = await getTarifaNoche('DOBLE', fecha);
      }

      expect(porNoche).toEqual({
        '2026-09-10': 12000,
        '2026-09-11': 20000,
        '2026-09-12': 20000,
        '2026-09-20': 8000,
      });
    });

    test('la tarifa base explícita gana cuando no hay temporada ni día de semana', async () => {
      expect(await getTarifaNoche('DOBLE', '2026-09-10', 5555)).toBe(5555);
    });

    test('un tipo sin habitaciones y sin tarifa base responde 422', async () => {
      await expect(getTarifaNoche('SUITE', '2026-09-10')).rejects.toMatchObject({
        status: 422,
        code: 'VALIDATION_ERROR',
      });
    });
  });
});
