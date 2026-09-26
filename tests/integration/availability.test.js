const request = require('supertest');
const { app, prisma, resetDb, authHeader } = require('../helpers/db');
const { toDate } = require('../../src/services/business.service');

beforeEach(resetDb);

describe('Disponibilidad', () => {
  async function seedRooms() {
    const rooms = await prisma.room.createManyAndReturn({
      data: [
        { numero: '101', tipo: 'SINGLE', tarifa: 5000 },
        { numero: '102', tipo: 'DOBLE', tarifa: 8000 },
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
});
