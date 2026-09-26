const request = require('supertest');
const { app, prisma, resetDb, tokenFor } = require('../helpers/db');

beforeEach(resetDb);

describe('Habitaciones', () => {
  let adminToken;
  let recepcionistaToken;

  beforeEach(async () => {
    adminToken = await tokenFor('admin');
    recepcionistaToken = await tokenFor('recepcionista');
  });

  function createRoom(token, body) {
    return request(app).post('/api/v1/rooms').set('Authorization', `Bearer ${token}`).send(body);
  }

  function listRooms(token, query = {}) {
    return request(app)
      .get('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`)
      .query(query);
  }

  test('alta por administrador responde 201', async () => {
    const res = await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('SINGLE');
  });

  test('número duplicado responde 409', async () => {
    await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    const res = await createRoom(adminToken, { numero: '101', tipo: 'DOBLE', tarifa: 8000 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('acceso denegado a recepcionista (403)', async () => {
    const res = await createRoom(recepcionistaToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('alta con capacidad y datos descriptivos los persiste y los devuelve', async () => {
    const res = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SUITE',
      tarifa: 20000,
      capacidad: 4,
      descripcion: 'Suite matrimonial con vista al mar',
      comodidades: ['Wifi', 'Aire acondicionado', 'Minibar'],
      fotos: ['https://cdn.hotel.test/101-suite.jpg'],
    });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('DISPONIBLE');
    expect(res.body.capacidad).toBe(4);
    expect(res.body.descripcion).toBe('Suite matrimonial con vista al mar');
    expect(res.body.comodidades).toEqual(['Wifi', 'Aire acondicionado', 'Minibar']);
    expect(res.body.fotos).toEqual(['https://cdn.hotel.test/101-suite.jpg']);
  });

  test('alta sin datos descriptivos usa los valores por defecto', async () => {
    const res = await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('DISPONIBLE');
    expect(res.body.capacidad).toBe(1);
    expect(res.body.descripcion).toBeNull();
    expect(res.body.comodidades).toBeNull();
    expect(res.body.fotos).toBeNull();
  });

  test.each([0, -3])('capacidad %i inválida responde 422', async (capacidad) => {
    const res = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
      capacidad,
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await prisma.room.count()).toBe(0);
  });

  test('estado inválido responde 422', async () => {
    const res = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
      estado: 'FUERA_DE_SERVICIO',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('listado responde 200 con las habitaciones paginadas', async () => {
    await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    const res = await listRooms(adminToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].numero).toBe('101');
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 10, total: 1 });
  });

  test('listado filtra por tipo', async () => {
    await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });
    await createRoom(adminToken, { numero: '102', tipo: 'DOBLE', tarifa: 8000 });
    await createRoom(adminToken, { numero: '103', tipo: 'DOBLE', tarifa: 9000 });

    const res = await listRooms(adminToken, { tipo: 'DOBLE' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((r) => r.numero)).toEqual(['102', '103']);
    expect(res.body.pagination.total).toBe(2);
  });

  test('listado filtra por rango de tarifa', async () => {
    await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });
    await createRoom(adminToken, { numero: '102', tipo: 'DOBLE', tarifa: 8000 });
    await createRoom(adminToken, { numero: '103', tipo: 'SUITE', tarifa: 20000 });

    const res = await listRooms(adminToken, { tarifaMin: 6000, tarifaMax: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].numero).toBe('102');
  });

  test('listado filtra por estado', async () => {
    const disponible = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });
    await createRoom(adminToken, { numero: '102', tipo: 'DOBLE', tarifa: 8000 });
    await request(app)
      .patch(`/api/v1/rooms/${disponible.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'MANTENIMIENTO' });

    const mantenimiento = await listRooms(adminToken, { estado: 'MANTENIMIENTO' });
    expect(mantenimiento.status).toBe(200);
    expect(mantenimiento.body.data).toHaveLength(1);
    expect(mantenimiento.body.data[0].numero).toBe('101');

    const operativas = await listRooms(adminToken, { estado: 'DISPONIBLE' });
    expect(operativas.body.data).toHaveLength(1);
    expect(operativas.body.data[0].numero).toBe('102');
  });

  test('listado filtra por disponibilidad en un rango excluyendo reservas y mantenimiento', async () => {
    const libre = await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });
    const ocupada = await createRoom(adminToken, { numero: '102', tipo: 'DOBLE', tarifa: 8000 });
    const enMantenimiento = await createRoom(adminToken, {
      numero: '103',
      tipo: 'SUITE',
      tarifa: 20000,
    });
    const guest = await prisma.guest.create({
      data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
    });
    await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: ocupada.body.id,
        checkIn: new Date(Date.UTC(2026, 8, 10)),
        checkOut: new Date(Date.UTC(2026, 8, 15)),
        noches: 5,
        total: 40000,
        estado: 'CONFIRMADA',
      },
    });
    await request(app)
      .patch(`/api/v1/rooms/${enMantenimiento.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'MANTENIMIENTO' });

    const res = await listRooms(adminToken, { checkIn: '2026-09-11', checkOut: '2026-09-12' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(libre.body.id);
  });

  test('listado con rango y estado MANTENIMIENTO devuelve vacío', async () => {
    const created = await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });
    await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'MANTENIMIENTO' });

    const res = await listRooms(adminToken, {
      estado: 'MANTENIMIENTO',
      checkIn: '2026-09-10',
      checkOut: '2026-09-12',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  test('rango de fechas incompleto responde 422', async () => {
    const res = await listRooms(adminToken, { checkIn: '2026-09-10' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rango de fechas invertido responde 422', async () => {
    const res = await listRooms(adminToken, { checkIn: '2026-09-12', checkOut: '2026-09-10' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('listado pagina los resultados', async () => {
    for (const numero of ['101', '102', '103']) {
      await createRoom(adminToken, { numero, tipo: 'SINGLE', tarifa: 5000 });
    }

    const first = await listRooms(adminToken, { page: 1, pageSize: 2 });
    const second = await listRooms(adminToken, { page: 2, pageSize: 2 });

    expect(first.status).toBe(200);
    expect(first.body.data.map((r) => r.numero)).toEqual(['101', '102']);
    expect(first.body.pagination).toEqual({ page: 1, pageSize: 2, total: 3 });
    expect(second.body.data.map((r) => r.numero)).toEqual(['103']);
    expect(second.body.pagination).toEqual({ page: 2, pageSize: 2, total: 3 });
  });

  test('página fuera de rango devuelve lista vacía', async () => {
    await createRoom(adminToken, { numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    const res = await listRooms(adminToken, { page: 5, pageSize: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(1);
  });

  test('edición por administrador responde 200', async () => {
    const created = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    const res = await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tarifa: 6500 });

    expect(res.status).toBe(200);
    expect(res.body.tarifa).toBe(6500);
  });

  test('puesta en mantenimiento y regreso a disponible', async () => {
    const created = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    const mantenimiento = await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'MANTENIMIENTO' });

    expect(mantenimiento.status).toBe(200);
    expect(mantenimiento.body.estado).toBe('MANTENIMIENTO');

    const disponible = await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'DISPONIBLE' });

    expect(disponible.status).toBe(200);
    expect(disponible.body.estado).toBe('DISPONIBLE');
  });

  test('edición de capacidad y datos descriptivos responde 200', async () => {
    const created = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    const res = await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        capacidad: 3,
        descripcion: 'Habitación recién renovada',
        comodidades: ['Wifi'],
        fotos: ['https://cdn.hotel.test/101.jpg'],
      });

    expect(res.status).toBe(200);
    expect(res.body.capacidad).toBe(3);
    expect(res.body.descripcion).toBe('Habitación recién renovada');
    expect(res.body.comodidades).toEqual(['Wifi']);
    expect(res.body.fotos).toEqual(['https://cdn.hotel.test/101.jpg']);
  });

  test('edición con capacidad inválida responde 422 y no aplica el cambio', async () => {
    const created = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    const res = await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacidad: 0, tarifa: 9999 });

    expect(res.status).toBe(422);
    const persisted = await prisma.room.findUnique({ where: { id: created.body.id } });
    expect(persisted.tarifa).toBe(5000);
  });

  test('edición de estado por recepcionista responde 403', async () => {
    const created = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    const res = await request(app)
      .patch(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${recepcionistaToken}`)
      .send({ estado: 'MANTENIMIENTO' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('edición de habitación inexistente responde 404', async () => {
    const res = await request(app)
      .patch('/api/v1/rooms/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tarifa: 6500 });

    expect(res.status).toBe(404);
  });

  test('borrado por administrador responde 200', async () => {
    const created = await createRoom(adminToken, {
      numero: '101',
      tipo: 'SINGLE',
      tarifa: 5000,
    });

    const res = await request(app)
      .delete(`/api/v1/rooms/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('borrado de habitación inexistente responde 404', async () => {
    const res = await request(app)
      .delete('/api/v1/rooms/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
