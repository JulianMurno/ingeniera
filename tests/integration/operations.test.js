const request = require('supertest');
const { app, prisma, resetDb, tokenFor } = require('../helpers/db');
const { day } = require('../helpers/dates');

beforeEach(resetDb);

describe('Health check', () => {
  test('GET /health es público y responde 200 con el estado de la base', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('ok');
    expect(res.body.api).toBe('ok');
  });

  test('GET /api/v1/health responde 200', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.db).toBe('ok');
  });

  test('base de datos caída responde 503 con el componente afectado', async () => {
    const spy = jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db).toBe('down');

    spy.mockRestore();
  });
});

describe('Auditoría', () => {
  let adminToken;
  let recepcionistaToken;
  let roomId;
  let guestId;

  beforeEach(async () => {
    adminToken = await tokenFor('admin');
    recepcionistaToken = await tokenFor('recepcionista');

    const room = await prisma.room.create({
      data: { numero: '101', tipo: 'SINGLE', tarifa: 10000 },
    });
    const guest = await prisma.guest.create({
      data: { nombre: 'Ana García', email: 'ana@example.com', dni: '27999888' },
    });
    roomId = room.id;
    guestId = guest.id;
  });

  function listAudit(query = {}, token = adminToken) {
    return request(app).get('/api/v1/audit').set('Authorization', `Bearer ${token}`).query(query);
  }

  async function createReservation({ from = 10, to = 13 } = {}) {
    return request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ guestId, roomId, checkIn: day(from), checkOut: day(to) });
  }

  test('crear una reserva registra autor, acción, recurso y fecha', async () => {
    const creada = await createReservation();
    expect(creada.status).toBe(201);

    const res = await listAudit();

    expect(res.status).toBe(200);
    const entrada = res.body.data.find(
      (row) => row.recurso === 'RESERVA' && row.accion === 'CREAR',
    );
    expect(entrada).toBeDefined();
    expect(entrada.user.username).toBe('admin');
    expect(entrada.user.rol).toBe('ADMINISTRADOR');
    expect(entrada.recursoId).toBe(String(creada.body.id));
    expect(entrada.createdAt).toBeTruthy();
  });

  test('cancelar una reserva queda registrado con la acción CANCELAR', async () => {
    const creada = await createReservation();
    await request(app)
      .post(`/api/v1/reservations/${creada.body.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ motivo: 'Cambio de planes' });

    const res = await listAudit({ accion: 'CANCELAR', recurso: 'RESERVA' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].user.username).toBe('admin');
    expect(res.body.data[0].detalle).toContain('Cambio de planes');
  });

  test('gestión de habitaciones y usuarios también se audita', async () => {
    const room = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ numero: '202', tipo: 'DOBLE', tarifa: 20000 });
    await request(app)
      .patch(`/api/v1/rooms/${room.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tarifa: 25000 });
    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'sofia', password: '123456', rol: 'RECEPCIONISTA' });

    const habitaciones = await listAudit({ recurso: 'HABITACION' });
    expect(habitaciones.body.data.map((row) => row.accion).sort()).toEqual(['CREAR', 'MODIFICAR']);

    const usuarios = await listAudit({ recurso: 'USUARIO' });
    expect(usuarios.body.data.map((row) => row.accion)).toContain('CREAR');
    expect(usuarios.body.data[0].user.username).toBe('admin');
  });

  test('consulta autorizada del administrador responde 200', async () => {
    await createReservation();

    const res = await listAudit();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  test('acceso denegado a recepcionista responde 403', async () => {
    const res = await listAudit({}, recepcionistaToken);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('sin token responde 401', async () => {
    const res = await request(app).get('/api/v1/audit');

    expect(res.status).toBe(401);
  });

  test('filtros por usuario, acción, recurso y rango de fechas', async () => {
    await createReservation();
    const admin = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .then((res) => res.body.data.find((user) => user.username === 'admin'));

    const porUsuario = await listAudit({ userId: admin.id, accion: 'CREAR', recurso: 'RESERVA' });
    expect(porUsuario.status).toBe(200);
    expect(porUsuario.body.data).toHaveLength(1);

    const hoy = day(0);
    const porRango = await listAudit({ desde: hoy, hasta: hoy });
    expect(porRango.status).toBe(200);
    expect(porRango.body.data.length).toBeGreaterThan(0);

    const rangoInvertido = await listAudit({ desde: day(10), hasta: day(1) });
    expect(rangoInvertido.status).toBe(422);
  });

  test('paginación de la auditoría', async () => {
    await createReservation({ from: 10, to: 13 });
    await createReservation({ from: 13, to: 15 });
    await createReservation({ from: 15, to: 17 });

    const res = await listAudit({ page: 1, pageSize: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 1, pageSize: 2, total: 3 });
  });

  test('acción inválida en el filtro responde 422', async () => {
    const res = await listAudit({ accion: 'BORRAR' });

    expect(res.status).toBe(422);
  });
});
