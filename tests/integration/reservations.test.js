const request = require('supertest');
const { app, prisma, resetDb, tokenFor, authHeader, withEnv } = require('../helpers/db');
const { day, diaSemana, offsetToWeekday } = require('../helpers/dates');
const { toDate } = require('../../src/services/business.service');
const notifications = require('../../src/services/notifications.service');

beforeEach(resetDb);

// El transporte por defecto de las notificaciones escribe en la consola; acá solo
// importa que el email se envíe, y eso se verifica con un spy sobre sendEmail.
let consoleSpy;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
  jest.restoreAllMocks();
});

describe('Reservas', () => {
  let roomId;
  let guestId;

  beforeEach(async () => {
    await tokenFor('admin');

    const room = await prisma.room.create({
      data: { numero: '101', tipo: 'SINGLE', tarifa: 10000 },
    });
    const guest = await prisma.guest.create({
      data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
    });
    roomId = room.id;
    guestId = guest.id;
  });

  function auth() {
    return authHeader('admin');
  }

  test('reserva exitosa: 201, CONFIRMADA, noches y total calculados', async () => {
    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('CONFIRMADA');
    expect(res.body.noches).toBe(3);
    expect(res.body.total).toBe(30000);
  });

  test('rango de fechas inválido responde 422', async () => {
    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(13), checkOut: day(10) });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('solapamiento rechazado con 409', async () => {
    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(12), checkOut: day(15) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('recambio el mismo día permitido', async () => {
    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(13), checkOut: day(15) });

    expect(res.status).toBe(201);
  });

  test('listado con filtros y paginación', async () => {
    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    const res = await request(app)
      .get('/api/v1/reservations')
      .set('Authorization', await auth())
      .query({ guestId, page: 1, pageSize: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].guest.dni).toBe('30123456');
  });

  test('detalle de reserva inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/v1/reservations/999999')
      .set('Authorization', await auth());

    expect(res.status).toBe(404);
  });

  test('modificación válida recalcula noches y total', async () => {
    const created = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    const res = await request(app)
      .patch(`/api/v1/reservations/${created.body.id}`)
      .set('Authorization', await auth())
      .send({ checkOut: day(15) });

    expect(res.status).toBe(200);
    expect(res.body.noches).toBe(5);
    expect(res.body.total).toBe(50000);
  });

  test('modificación con conflicto responde 409', async () => {
    const created = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(15), checkOut: day(18) });

    const res = await request(app)
      .patch(`/api/v1/reservations/${created.body.id}`)
      .set('Authorization', await auth())
      .send({ checkOut: day(16) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('creación sobre habitación en mantenimiento rechazada con 409', async () => {
    await prisma.room.update({ where: { id: roomId }, data: { estado: 'MANTENIMIENTO' } });

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(await prisma.reservation.count()).toBe(0);
  });

  test('modificación hacia habitación en mantenimiento rechazada con 409', async () => {
    const otra = await prisma.room.create({
      data: { numero: '102', tipo: 'DOBLE', tarifa: 12000, estado: 'MANTENIMIENTO' },
    });
    const created = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    const res = await request(app)
      .patch(`/api/v1/reservations/${created.body.id}`)
      .set('Authorization', await auth())
      .send({ roomId: otra.id });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('cancelación pasa la reserva a CANCELADA y libera disponibilidad', async () => {
    const created = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

    const cancel = await request(app)
      .post(`/api/v1/reservations/${created.body.id}/cancel`)
      .set('Authorization', await auth());

    expect(cancel.status).toBe(200);
    expect(cancel.body.estado).toBe('CANCELADA');

    const availability = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await auth())
      .query({ checkIn: day(11), checkOut: day(12) });

    expect(availability.body.map((r) => r.id)).toContain(roomId);
  });

  test('cancelación de reserva inexistente responde 404', async () => {
    const res = await request(app)
      .post('/api/v1/reservations/999999/cancel')
      .set('Authorization', await auth());

    expect(res.status).toBe(404);
  });

  describe('Total con la tarifa vigente por noche', () => {
    test('el total usa la tarifa de temporada vigente', async () => {
      await prisma.season.create({
        data: {
          roomType: 'SINGLE',
          fechaInicio: toDate(day(1)),
          fechaFin: toDate(day(20)),
          tarifa: 15000,
        },
      });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      expect(res.status).toBe(201);
      expect(res.body.noches).toBe(3);
      expect(res.body.total).toBe(45000);
    });

    test('el total usa la tarifa de fin de semana y la base el resto de las noches', async () => {
      // Check-in en jueves: la segunda noche cae en viernes y la tercera en sábado.
      const inicio = offsetToWeekday(4);
      const checkIn = day(inicio);
      const checkOut = day(inicio + 3);

      expect([diaSemana(checkIn), diaSemana(day(inicio + 1)), diaSemana(day(inicio + 2))]).toEqual([
        4, 5, 6,
      ]);

      await prisma.weekdayRate.createMany({
        data: [
          { roomType: 'SINGLE', diaSemana: 5, tarifa: 20000 },
          { roomType: 'SINGLE', diaSemana: 6, tarifa: 22000 },
        ],
      });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn, checkOut });

      expect(res.status).toBe(201);
      expect(res.body.noches).toBe(3);
      expect(res.body.total).toBe(10000 + 20000 + 22000);
    });

    test('la modificación recalcula el total con la tarifa vigente al momento', async () => {
      const created = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      expect(created.body.total).toBe(30000);

      await prisma.season.create({
        data: {
          roomType: 'SINGLE',
          fechaInicio: toDate(day(1)),
          fechaFin: toDate(day(20)),
          tarifa: 15000,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/reservations/${created.body.id}`)
        .set('Authorization', await auth())
        .send({ checkOut: day(15) });

      expect(res.status).toBe(200);
      expect(res.body.noches).toBe(5);
      expect(res.body.total).toBe(75000);
    });
  });

  describe('Estancia mínima y máxima', () => {
    test('crear con estancia por debajo del mínimo responde 422', async () => {
      const header = await auth();
      const res = await withEnv({ MIN_STAY_NIGHTS: '3' }, () =>
        request(app)
          .post('/api/v1/reservations')
          .set('Authorization', header)
          .send({ guestId, roomId, checkIn: day(10), checkOut: day(12) }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await prisma.reservation.count()).toBe(0);
    });

    test('crear con estancia por encima del máximo responde 422', async () => {
      const header = await auth();
      const res = await withEnv({ MAX_STAY_NIGHTS: '3' }, () =>
        request(app)
          .post('/api/v1/reservations')
          .set('Authorization', header)
          .send({ guestId, roomId, checkIn: day(10), checkOut: day(20) }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await prisma.reservation.count()).toBe(0);
    });

    test('modificar a una estancia fuera de los límites responde 422', async () => {
      const created = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      const header = await auth();
      const res = await withEnv({ MAX_STAY_NIGHTS: '4' }, () =>
        request(app)
          .patch(`/api/v1/reservations/${created.body.id}`)
          .set('Authorization', header)
          .send({ checkOut: day(20) }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Horarios de check-in y check-out', () => {
    test('el late check-out de una reserva bloquea el check-in del mismo día con 409', async () => {
      await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId,
          checkIn: day(10),
          checkOut: day(13),
          lateCheckOut: true,
        });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(13), checkOut: day(15) });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    test('el early check-in bloquea el check-out de la noche anterior con 409', async () => {
      await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId,
          checkIn: day(13),
          checkOut: day(15),
          earlyCheckIn: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    test('el late check-out no impide reservar un día posterior', async () => {
      await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId,
          checkIn: day(10),
          checkOut: day(13),
          lateCheckOut: true,
        });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(14), checkOut: day(16) });

      expect(res.status).toBe(201);
    });

    test('la reserva guarda las banderas de early check-in y late check-out', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId,
          checkIn: day(10),
          checkOut: day(13),
          earlyCheckIn: true,
          lateCheckOut: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.earlyCheckIn).toBe(true);
      expect(res.body.lateCheckOut).toBe(true);
    });
  });

  describe('Ocupantes', () => {
    test('una reserva dentro de la capacidad registra adultos y menores', async () => {
      const doble = await prisma.room.create({
        data: { numero: '201', tipo: 'DOBLE', tarifa: 10000, capacidad: 3 },
      });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId: doble.id,
          checkIn: day(10),
          checkOut: day(13),
          adultos: 2,
          menores: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.adultos).toBe(2);
      expect(res.body.menores).toBe(1);
    });

    test('una reserva que supera la capacidad de la habitación responde 422', async () => {
      const doble = await prisma.room.create({
        data: { numero: '201', tipo: 'DOBLE', tarifa: 10000, capacidad: 2 },
      });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId: doble.id,
          checkIn: day(10),
          checkOut: day(13),
          adultos: 2,
          menores: 1,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await prisma.reservation.count()).toBe(0);
    });

    test('modificar los ocupantes por encima de la capacidad responde 422', async () => {
      const created = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      const res = await request(app)
        .patch(`/api/v1/reservations/${created.body.id}`)
        .set('Authorization', await auth())
        .send({ adultos: 2, menores: 1 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('una reserva sin adultos responde 422', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13), adultos: 0 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Validación temporal', () => {
    test('crear una reserva con check-in en el pasado responde 422', async () => {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(-3), checkOut: day(-1) });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await prisma.reservation.count()).toBe(0);
    });

    test('crear con menos antelación que la mínima responde 422', async () => {
      const header = await auth();
      const res = await withEnv({ MIN_ADVANCE_NIGHTS: '7' }, () =>
        request(app)
          .post('/api/v1/reservations')
          .set('Authorization', header)
          .send({ guestId, roomId, checkIn: day(2), checkOut: day(4) }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await prisma.reservation.count()).toBe(0);
    });

    test('crear con la antelación mínima exacta se acepta', async () => {
      const header = await auth();
      const res = await withEnv({ MIN_ADVANCE_NIGHTS: '7' }, () =>
        request(app)
          .post('/api/v1/reservations')
          .set('Authorization', header)
          .send({ guestId, roomId, checkIn: day(7), checkOut: day(9) }),
      );

      expect(res.status).toBe(201);
    });

    test('modificar el check-in al pasado responde 422', async () => {
      const created = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      const res = await request(app)
        .patch(`/api/v1/reservations/${created.body.id}`)
        .set('Authorization', await auth())
        .send({ checkIn: day(-1), checkOut: day(12) });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('modificar a una duración por encima del máximo responde 422', async () => {
      const created = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      const header = await auth();
      const res = await withEnv({ MAX_STAY_NIGHTS: '4' }, () =>
        request(app)
          .patch(`/api/v1/reservations/${created.body.id}`)
          .set('Authorization', header)
          .send({ checkOut: day(20) }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Código de confirmación y notas', () => {
    test('la reserva creada trae un código único y las notas', async () => {
      const primera = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13), notas: 'Cama doble' });
      const segunda = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(14), checkOut: day(16) });

      expect(primera.status).toBe(201);
      expect(primera.body.codigo).toMatch(/^HR-[A-Z0-9]{6}$/);
      expect(segunda.body.codigo).toMatch(/^HR-[A-Z0-9]{6}$/);
      expect(segunda.body.codigo).not.toBe(primera.body.codigo);
      expect(primera.body.notas).toBe('Cama doble');
    });

    test('el detalle devuelve el código, las notas y el motivo de cancelación', async () => {
      const created = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13), notas: 'Cama doble' });

      const detalle = await request(app)
        .get(`/api/v1/reservations/${created.body.id}`)
        .set('Authorization', await auth());

      expect(detalle.body.codigo).toBe(created.body.codigo);
      expect(detalle.body.notas).toBe('Cama doble');
      expect(detalle.body.motivoCancelacion).toBeNull();

      await request(app)
        .post(`/api/v1/reservations/${created.body.id}/cancel`)
        .set('Authorization', await auth())
        .send({ motivo: 'El huésped no puede viajar' });

      const cancelada = await request(app)
        .get(`/api/v1/reservations/${created.body.id}`)
        .set('Authorization', await auth());

      expect(cancelada.body.motivoCancelacion).toBe('El huésped no puede viajar');
    });

    test('reintenta la asignación del código si el generado ya existe', async () => {
      await prisma.reservation.create({
        data: {
          guestId,
          roomId,
          checkIn: toDate(day(40)),
          checkOut: toDate(day(42)),
          noches: 2,
          total: 20000,
          earlyCheckIn: false,
          lateCheckOut: false,
          codigo: 'HR-AAAAAA',
        },
      });

      // El primer intento genera HR-AAAAAA (ya usado); el siguiente ya es libre.
      const original = Math.random;
      let calls = 0;
      jest.spyOn(Math, 'random').mockImplementation(() => (calls++ < 6 ? 0 : original()));

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      expect(res.status).toBe(201);
      expect(res.body.codigo).toMatch(/^HR-[A-Z0-9]{6}$/);
      expect(res.body.codigo).not.toBe('HR-AAAAAA');
    });
  });

  describe('Política antioverbooking', () => {
    async function crearDoble(capacidad) {
      return prisma.room.create({
        data: { numero: '300', tipo: 'DOBLE', tarifa: 10000, capacidad },
      });
    }

    test('acepta reservas solapadas mientras la ocupación no supere la capacidad', async () => {
      const habitacion = await crearDoble(3);

      const primera = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId: habitacion.id, checkIn: day(10), checkOut: day(13) });

      const segunda = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId: habitacion.id, checkIn: day(11), checkOut: day(12) });

      expect(primera.status).toBe(201);
      expect(segunda.status).toBe(201);
    });

    test('rechaza con 409 cuando la ocupación de las reservas solapadas excede la capacidad', async () => {
      const habitacion = await crearDoble(2);

      await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId: habitacion.id,
          checkIn: day(10),
          checkOut: day(13),
          adultos: 2,
        });

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId: habitacion.id,
          checkIn: day(11),
          checkOut: day(12),
          adultos: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(await prisma.reservation.count()).toBe(1);
    });

    test('modificar hacia un rango ya sobreocupado responde 409', async () => {
      const habitacion = await crearDoble(2);

      const primera = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId: habitacion.id, checkIn: day(14), checkOut: day(16) });

      await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({
          guestId,
          roomId: habitacion.id,
          checkIn: day(10),
          checkOut: day(13),
          adultos: 2,
        });

      const res = await request(app)
        .patch(`/api/v1/reservations/${primera.body.id}`)
        .set('Authorization', await auth())
        .send({ checkIn: day(11), checkOut: day(12) });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('Ciclo de vida de la reserva', () => {
    async function crearReserva(extra = {}) {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13), ...extra });
      expect(res.status).toBe(201);
      return res.body;
    }

    test('el check-in pasa la reserva a EN_CURSO', async () => {
      const reserva = await crearReserva();

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkin`)
        .set('Authorization', await auth());

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('EN_CURSO');
    });

    test('el check-in de una reserva no confirmada responde 409', async () => {
      const reserva = await crearReserva();
      await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkin`)
        .set('Authorization', await auth());

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkin`)
        .set('Authorization', await auth());

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect((await prisma.reservation.findUnique({ where: { id: reserva.id } })).estado).toBe(
        'EN_CURSO',
      );
    });

    test('el check-in de una reserva inexistente responde 404', async () => {
      const res = await request(app)
        .post('/api/v1/reservations/999999/checkin')
        .set('Authorization', await auth());

      expect(res.status).toBe(404);
    });

    test('el check-out pasa la reserva EN_CURSO a FINALIZADA', async () => {
      const reserva = await crearReserva();
      await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkin`)
        .set('Authorization', await auth());

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkout`)
        .set('Authorization', await auth());

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('FINALIZADA');
    });

    test('el check-out de una reserva no en curso responde 409', async () => {
      const reserva = await crearReserva();

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkout`)
        .set('Authorization', await auth());

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect((await prisma.reservation.findUnique({ where: { id: reserva.id } })).estado).toBe(
        'CONFIRMADA',
      );
    });

    test('el no-show marca NO_SHOW y deja el rango disponible', async () => {
      const reserva = await crearReserva();

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/no-show`)
        .set('Authorization', await auth());

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('NO_SHOW');

      const disponibilidad = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await auth())
        .query({ checkIn: day(11), checkOut: day(12) });
      expect(disponibilidad.body.map((r) => r.id)).toContain(roomId);

      const nueva = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(11), checkOut: day(12) });
      expect(nueva.status).toBe(201);
    });

    test('el no-show de una reserva no confirmada responde 409', async () => {
      const reserva = await crearReserva();
      await request(app)
        .post(`/api/v1/reservations/${reserva.id}/no-show`)
        .set('Authorization', await auth());

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/no-show`)
        .set('Authorization', await auth());

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    test('la cancelación registra el motivo y la multa configurada', async () => {
      const reserva = await crearReserva();
      const header = await auth();

      const res = await withEnv({ CANCELLATION_FEE_PERCENT: '20' }, () =>
        request(app)
          .post(`/api/v1/reservations/${reserva.id}/cancel`)
          .set('Authorization', header)
          .send({ motivo: 'Cambio de planes' }),
      );

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('CANCELADA');
      expect(res.body.motivoCancelacion).toBe('Cambio de planes');
      expect(res.body.multaCancelacion).toBe(6000);
    });

    test('sin porcentaje de multa configurado la multa es 0', async () => {
      const reserva = await crearReserva();

      const res = await request(app)
        .post(`/api/v1/reservations/${reserva.id}/cancel`)
        .set('Authorization', await auth())
        .send({ motivo: 'Cambio de planes' });

      expect(res.status).toBe(200);
      expect(res.body.multaCancelacion).toBe(0);
    });

    test.each([
      ['check-in', 'EN_CURSO'],
      ['check-out', 'FINALIZADA'],
    ])(
      'no se puede cancelar una reserva ya con %s registrado con 409',
      async (transicion, estadoEsperado) => {
        const reserva = await crearReserva();
        const header = await auth();

        if (estadoEsperado === 'EN_CURSO') {
          await request(app)
            .post(`/api/v1/reservations/${reserva.id}/checkin`)
            .set('Authorization', header);
        } else {
          await request(app)
            .post(`/api/v1/reservations/${reserva.id}/checkin`)
            .set('Authorization', header);
          await request(app)
            .post(`/api/v1/reservations/${reserva.id}/checkout`)
            .set('Authorization', header);
        }

        const res = await request(app)
          .post(`/api/v1/reservations/${reserva.id}/cancel`)
          .set('Authorization', header)
          .send({ motivo: 'Intento fallido' });

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONFLICT');
        expect((await prisma.reservation.findUnique({ where: { id: reserva.id } })).estado).toBe(
          estadoEsperado,
        );
      },
    );

    test('el listado filtra por los estados del ciclo de vida', async () => {
      const reserva = await crearReserva();
      await request(app)
        .post(`/api/v1/reservations/${reserva.id}/checkin`)
        .set('Authorization', await auth());

      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', await auth())
        .query({ estado: 'EN_CURSO' });

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].estado).toBe('EN_CURSO');
    });
  });

  describe('Notificaciones por email', () => {
    test('crear una reserva envía el email de confirmación al huésped', async () => {
      const sendEmail = jest.spyOn(notifications, 'sendEmail').mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });

      expect(res.status).toBe(201);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, body] = sendEmail.mock.calls[0];
      expect(to).toBe('juan@example.com');
      expect(subject).toBe(`Reserva confirmada ${res.body.codigo}`);
      expect(body).toContain('101');
      expect(body).toContain(day(10));
      expect(body).toContain(day(13));
      expect(body).toContain(res.body.codigo);
    });

    test('cancelar una reserva envía el email de cancelación al huésped', async () => {
      const reserva = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', await auth())
        .send({ guestId, roomId, checkIn: day(10), checkOut: day(13) });
      expect(reserva.status).toBe(201);

      const sendEmail = jest.spyOn(notifications, 'sendEmail').mockResolvedValue({});
      const header = await auth();
      const cancel = await withEnv({ CANCELLATION_FEE_PERCENT: '10' }, () =>
        request(app)
          .post(`/api/v1/reservations/${reserva.body.id}/cancel`)
          .set('Authorization', header)
          .send({ motivo: 'Cambio de planes' }),
      );

      expect(cancel.status).toBe(200);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject, body] = sendEmail.mock.calls[0];
      expect(to).toBe('juan@example.com');
      expect(subject).toBe(`Reserva cancelada ${reserva.body.codigo}`);
      expect(body).toContain('Cambio de planes');
      expect(body).toContain('3000');
    });
  });
});
