const request = require('supertest');
const { app, prisma, resetDb, authHeader, withEnv } = require('../helpers/db');
const { toDate } = require('../../src/services/business.service');

beforeEach(resetDb);

describe('Disponibilidad', () => {
  async function seedRooms() {
    const rooms = await prisma.room.createManyAndReturn({
      data: [
        { numero: '101', tipo: 'SINGLE', tarifa: 5000, capacidad: 1 },
        { numero: '102', tipo: 'DOBLE', tarifa: 8000, capacidad: 3 },
      ],
    });
    return rooms;
  }

  async function seedReservation(guest, room, checkIn, checkOut) {
    await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        checkIn: toDate(checkIn),
        checkOut: toDate(checkOut),
        noches: 5,
        total: 25000,
        estado: 'CONFIRMADA',
      },
    });
  }

  test('con disponibilidad devuelve las habitaciones libres', async () => {
    await seedRooms();
    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('filtra por tipo', async () => {
    await seedRooms();
    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', type: 'DOBLE' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('DOBLE');
  });

  test('sin disponibilidad devuelve lista vacía cuando el rango está cubierto', async () => {
    const rooms = await seedRooms();
    const guest = await prisma.guest.create({
      data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
    });
    await seedReservation(guest, rooms[0], '2026-09-10', '2026-09-15');
    await seedReservation(guest, rooms[1], '2026-09-12', '2026-09-18');

    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-11', checkOut: '2026-09-13' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('excluye habitaciones en mantenimiento aunque no tengan reservas', async () => {
    const rooms = await seedRooms();
    await prisma.room.update({ where: { id: rooms[0].id }, data: { estado: 'MANTENIMIENTO' } });

    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].numero).toBe('102');
  });

  test('vuelve a listar la habitación al volver a DISPONIBLE', async () => {
    const rooms = await seedRooms();
    await prisma.room.update({ where: { id: rooms[0].id }, data: { estado: 'MANTENIMIENTO' } });
    await prisma.room.update({ where: { id: rooms[0].id }, data: { estado: 'DISPONIBLE' } });

    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('rango inválido responde 422', async () => {
    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-12', checkOut: '2026-09-10' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('solicitud sin autenticación responde 401', async () => {
    const res = await request(app)
      .get('/api/v1/availability')
      .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

    expect(res.status).toBe(401);
  });

  test('recambio el mismo día sigue disponible', async () => {
    const rooms = await seedRooms();
    const guest = await prisma.guest.create({
      data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
    });
    await seedReservation(guest, rooms[0], '2026-09-10', '2026-09-12');

    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await authHeader('admin'))
      .query({ checkIn: '2026-09-12', checkOut: '2026-09-15' });

    expect(res.status).toBe(200);
    expect(res.body.map((room) => room.id)).toContain(rooms[0].id);
  });

  describe('Filtro por ocupantes', () => {
    test('devuelve solo habitaciones con capacidad suficiente', async () => {
      const rooms = await seedRooms();

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', ocupantes: 2 });

      expect(res.status).toBe(200);
      expect(res.body.map((room) => room.numero)).toEqual([rooms[1].numero]);
    });

    test('sin ocupantes devuelve todas las habitaciones operativas', async () => {
      await seedRooms();

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

      expect(res.body).toHaveLength(2);
    });

    test('ninguna habitación alcanza la capacidad solicitada', async () => {
      await seedRooms();

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', ocupantes: 6 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    test('capacidad inválida responde 422', async () => {
      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', ocupantes: 0 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Estancia mínima y máxima', () => {
    test('una estancia por debajo del mínimo responde 422', async () => {
      await seedRooms();
      const header = await authHeader('admin');

      const res = await withEnv({ MIN_STAY_NIGHTS: '3' }, () =>
        request(app)
          .get('/api/v1/availability')
          .set('Authorization', header)
          .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/estancia mínima/i);
    });

    test('una estancia por encima del máximo responde 422', async () => {
      await seedRooms();
      const header = await authHeader('admin');

      const res = await withEnv({ MAX_STAY_NIGHTS: '2' }, () =>
        request(app)
          .get('/api/v1/availability')
          .set('Authorization', header)
          .query({ checkIn: '2026-09-10', checkOut: '2026-09-15' }),
      );

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/estancia máxima/i);
    });

    test('una estancia dentro de los límites se consulta con normalidad', async () => {
      await seedRooms();
      const header = await authHeader('admin');

      const res = await withEnv({ MIN_STAY_NIGHTS: '2', MAX_STAY_NIGHTS: '5' }, () =>
        request(app)
          .get('/api/v1/availability')
          .set('Authorization', header)
          .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' }),
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('Horarios de check-in y check-out', () => {
    test('un late check-out bloquea el check-in del mismo día', async () => {
      const rooms = await seedRooms();
      const guest = await prisma.guest.create({
        data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
      });
      await prisma.reservation.create({
        data: {
          guestId: guest.id,
          roomId: rooms[0].id,
          checkIn: toDate('2026-09-08'),
          checkOut: toDate('2026-09-10'),
          noches: 2,
          total: 10000,
          estado: 'CONFIRMADA',
          lateCheckOut: true,
        },
      });

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

      expect(res.status).toBe(200);
      expect(res.body.map((room) => room.id)).not.toContain(rooms[0].id);
    });

    test('sin late check-out el recambio del mismo día se mantiene', async () => {
      const rooms = await seedRooms();
      const guest = await prisma.guest.create({
        data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
      });
      await prisma.reservation.create({
        data: {
          guestId: guest.id,
          roomId: rooms[0].id,
          checkIn: toDate('2026-09-08'),
          checkOut: toDate('2026-09-10'),
          noches: 2,
          total: 10000,
          estado: 'CONFIRMADA',
        },
      });

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12' });

      expect(res.status).toBe(200);
      expect(res.body.map((room) => room.id)).toContain(rooms[0].id);
    });

    test('un early check-in bloquea el check-out de la noche anterior', async () => {
      const rooms = await seedRooms();
      const guest = await prisma.guest.create({
        data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
      });
      await prisma.reservation.create({
        data: {
          guestId: guest.id,
          roomId: rooms[0].id,
          checkIn: toDate('2026-09-08'),
          checkOut: toDate('2026-09-10'),
          noches: 2,
          total: 10000,
          estado: 'CONFIRMADA',
        },
      });

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', earlyCheckIn: 'true' });

      expect(res.status).toBe(200);
      expect(res.body.map((room) => room.id)).not.toContain(rooms[0].id);
    });

    test('el early check-in no bloquea una habitación libre', async () => {
      await seedRooms();

      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', earlyCheckIn: 'true' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('un valor booleano inválido responde 422', async () => {
      const res = await request(app)
        .get('/api/v1/availability')
        .set('Authorization', await authHeader('admin'))
        .query({ checkIn: '2026-09-10', checkOut: '2026-09-12', lateCheckOut: 'quiza' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
