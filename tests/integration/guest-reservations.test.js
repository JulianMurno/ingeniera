const request = require('supertest');
const { app, prisma, resetDb, tokenFor, registerGuest } = require('../helpers/db');
const { day } = require('../helpers/dates');

async function seedRoom(overrides = {}) {
  return prisma.room.create({
    data: {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
      capacidad: 1,
      ...overrides,
    },
  });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(resetDb);

describe('Reservas del portal de huésped', () => {
  test('crea una reserva propia en estado CONFIRMADA', async () => {
    const room = await seedRoom();
    const { token, guest } = await registerGuest();

    const res = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(token))
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4), adultos: 1 });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('CONFIRMADA');
    expect(res.body.guestId).toBe(guest.id);
    expect(res.body.noches).toBe(2);
    expect(res.body.codigo).toMatch(/^HR-/);
    expect(res.body.total).toBeGreaterThan(0);
  });

  test('rechaza con 403 intentar reservar para otro huésped', async () => {
    const room = await seedRoom();
    const { token } = await registerGuest();
    const other = await registerGuest({ email: 'otro@example.com', dni: '30000002' });

    const res = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(token))
      .send({ guestId: other.guest.id, roomId: room.id, checkIn: day(2), checkOut: day(4) });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(await prisma.reservation.count()).toBe(0);
  });

  test('rechaza con 409 un rango solapado en la misma habitación', async () => {
    const room = await seedRoom();
    const first = await registerGuest();
    const second = await registerGuest({ email: 'otro@example.com', dni: '30000002' });

    await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(first.token))
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4) })
      .expect(201);

    const res = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(second.token))
      .send({ roomId: room.id, checkIn: day(3), checkOut: day(5) });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('rechaza con 422 cuando se supera la capacidad', async () => {
    const room = await seedRoom({ capacidad: 1 });
    const { token } = await registerGuest();

    const res = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(token))
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4), adultos: 2 });

    expect(res.status).toBe(422);
  });

  test('rechaza con 422 un rango inválido o en el pasado', async () => {
    const room = await seedRoom();
    const { token } = await registerGuest();

    const invalid = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(token))
      .send({ roomId: room.id, checkIn: day(4), checkOut: day(2) });
    expect(invalid.status).toBe(422);

    const past = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(token))
      .send({ roomId: room.id, checkIn: day(-2), checkOut: day(1) });
    expect(past.status).toBe(422);
  });

  test('sin token responde 401', async () => {
    const room = await seedRoom();

    const res = await request(app)
      .post('/api/v1/guest/reservations')
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4) });

    expect(res.status).toBe(401);
  });

  test('lista y detalle solo muestran reservas propias', async () => {
    const room = await seedRoom();
    const room2 = await seedRoom({ numero: '102' });
    const first = await registerGuest();
    const second = await registerGuest({ email: 'otro@example.com', dni: '30000002' });

    const own = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(first.token))
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4) })
      .expect(201);

    await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(second.token))
      .send({ roomId: room2.id, checkIn: day(2), checkOut: day(4) })
      .expect(201);

    const list = await request(app)
      .get('/api/v1/guest/reservations')
      .set(authHeader(first.token));

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(own.body.id);

    const detail = await request(app)
      .get(`/api/v1/guest/reservations/${own.body.id}`)
      .set(authHeader(first.token));
    expect(detail.status).toBe(200);

    const foreignDetail = await request(app)
      .get(`/api/v1/guest/reservations/${own.body.id}`)
      .set(authHeader(second.token));
    expect(foreignDetail.status).toBe(404);
  });

  test('cancela una reserva propia y no permite cancelar una ajena', async () => {
    const room = await seedRoom();
    const first = await registerGuest();
    const second = await registerGuest({ email: 'otro@example.com', dni: '30000002' });

    const own = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(first.token))
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4) })
      .expect(201);

    const foreign = await request(app)
      .post(`/api/v1/guest/reservations/${own.body.id}/cancel`)
      .set(authHeader(second.token))
      .send({ motivo: 'intento ajeno' });
    expect(foreign.status).toBe(404);

    const stillConfirmed = await prisma.reservation.findUnique({ where: { id: own.body.id } });
    expect(stillConfirmed.estado).toBe('CONFIRMADA');

    const res = await request(app)
      .post(`/api/v1/guest/reservations/${own.body.id}/cancel`)
      .set(authHeader(first.token))
      .send({ motivo: 'cambio de planes' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('CANCELADA');
    expect(res.body.motivoCancelacion).toBe('cambio de planes');
  });

  test('la reserva del portal aparece de inmediato en el panel de recepción', async () => {
    const room = await seedRoom();
    const { token } = await registerGuest();

    const created = await request(app)
      .post('/api/v1/guest/reservations')
      .set(authHeader(token))
      .send({ roomId: room.id, checkIn: day(2), checkOut: day(4) })
      .expect(201);

    const staffToken = await tokenFor('recepcionista');
    const list = await request(app)
      .get('/api/v1/reservations')
      .set(authHeader(staffToken));

    expect(list.status).toBe(200);
    expect(list.body.data.map((r) => r.id)).toContain(created.body.id);

    const detail = await request(app)
      .get(`/api/v1/reservations/${created.body.id}`)
      .set(authHeader(staffToken));
    expect(detail.status).toBe(200);
    expect(detail.body.codigo).toBe(created.body.codigo);
  });

  test('una reserva creada por el panel aparece en el portal del huésped', async () => {
    const room = await seedRoom();
    const { token, guest } = await registerGuest();
    const staffToken = await tokenFor('recepcionista');

    const created = await request(app)
      .post('/api/v1/reservations')
      .set(authHeader(staffToken))
      .send({ guestId: guest.id, roomId: room.id, checkIn: day(5), checkOut: day(7) })
      .expect(201);

    const list = await request(app)
      .get('/api/v1/guest/reservations')
      .set(authHeader(token));

    expect(list.status).toBe(200);
    expect(list.body.data.map((r) => r.id)).toContain(created.body.id);
  });
});
