const request = require('supertest');
const { app, prisma, resetDb, tokenFor, authHeader } = require('../helpers/db');

beforeEach(resetDb);

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
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('CONFIRMADA');
    expect(res.body.noches).toBe(3);
    expect(res.body.total).toBe(30000);
  });

  test('rango de fechas inválido responde 422', async () => {
    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-13', checkOut: '2026-09-10' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('solapamiento rechazado con 409', async () => {
    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-12', checkOut: '2026-09-15' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('recambio el mismo día permitido', async () => {
    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-13', checkOut: '2026-09-15' });

    expect(res.status).toBe(201);
  });

  test('listado con filtros y paginación', async () => {
    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

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
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

    const res = await request(app)
      .patch(`/api/v1/reservations/${created.body.id}`)
      .set('Authorization', await auth())
      .send({ checkOut: '2026-09-15' });

    expect(res.status).toBe(200);
    expect(res.body.noches).toBe(5);
    expect(res.body.total).toBe(50000);
  });

  test('modificación con conflicto responde 409', async () => {
    const created = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-15', checkOut: '2026-09-18' });

    const res = await request(app)
      .patch(`/api/v1/reservations/${created.body.id}`)
      .set('Authorization', await auth())
      .send({ checkOut: '2026-09-16' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('creación sobre habitación en mantenimiento rechazada con 409', async () => {
    await prisma.room.update({ where: { id: roomId }, data: { estado: 'MANTENIMIENTO' } });

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', await auth())
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

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
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

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
      .send({ guestId, roomId, checkIn: '2026-09-10', checkOut: '2026-09-13' });

    const cancel = await request(app)
      .post(`/api/v1/reservations/${created.body.id}/cancel`)
      .set('Authorization', await auth());

    expect(cancel.status).toBe(200);
    expect(cancel.body.estado).toBe('CANCELADA');

    const availability = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', await auth())
      .query({ checkIn: '2026-09-11', checkOut: '2026-09-12' });

    expect(availability.body.map((r) => r.id)).toContain(roomId);
  });

  test('cancelación de reserva inexistente responde 404', async () => {
    const res = await request(app)
      .post('/api/v1/reservations/999999/cancel')
      .set('Authorization', await auth());

    expect(res.status).toBe(404);
  });
});
