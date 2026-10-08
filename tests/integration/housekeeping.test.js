const request = require('supertest');
const { app, prisma, resetDb, tokenFor, withEnv } = require('../helpers/db');
const { day } = require('../helpers/dates');

beforeEach(resetDb);

let consoleSpy;

beforeEach(() => {
  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
  jest.restoreAllMocks();
});

describe('Housekeeping', () => {
  let adminToken;
  let recepcionistaToken;
  let adminId;
  let room;
  let room2;

  beforeEach(async () => {
    adminToken = await tokenFor('admin');
    recepcionistaToken = await tokenFor('recepcionista');
    adminId = (await prisma.user.findUnique({ where: { username: 'admin' } })).id;
    room = await prisma.room.create({ data: { numero: '201', tipo: 'DOBLE', tarifa: 12000 } });
    room2 = await prisma.room.create({ data: { numero: '202', tipo: 'SINGLE', tarifa: 8000 } });
  });

  function auth(token) {
    return `Bearer ${token}`;
  }

  function createTask(token, body) {
    return request(app)
      .post('/api/v1/housekeeping/tasks')
      .set('Authorization', auth(token))
      .send(body);
  }

  describe('POST /housekeeping/tasks', () => {
    test('un administrador programa una tarea y nace en PENDIENTE (201)', async () => {
      const res = await createTask(adminToken, {
        roomId: room.id,
        tipo: 'LIMPIEZA',
        fechaProgramada: new Date().toISOString(),
        observaciones: 'Limpieza diaria',
      });

      expect(res.status).toBe(201);
      expect(res.body.estado).toBe('PENDIENTE');
      expect(res.body.roomId).toBe(room.id);
      expect(res.body.tipo).toBe('LIMPIEZA');
    });

    test('una habitación inexistente responde 404 y no crea la tarea', async () => {
      const res = await createTask(adminToken, {
        roomId: 999999,
        tipo: 'LIMPIEZA',
        fechaProgramada: new Date().toISOString(),
      });

      expect(res.status).toBe(404);
      expect(await prisma.housekeepingTask.count()).toBe(0);
    });

    test('un recepcionista no puede programar (403)', async () => {
      const res = await createTask(recepcionistaToken, {
        roomId: room.id,
        tipo: 'LIMPIEZA',
        fechaProgramada: new Date().toISOString(),
      });

      expect(res.status).toBe(403);
    });

    test('faltar un campo requerido responde 422', async () => {
      const res = await createTask(adminToken, { roomId: room.id });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /housekeeping/tasks/{id}', () => {
    function seedTask({ estado = 'PENDIENTE', asignadoAId = null, roomId = room.id, tipo = 'LIMPIEZA' } = {}) {
      return prisma.housekeepingTask.create({
        data: { roomId, tipo, estado, asignadoAId, fechaProgramada: new Date() },
      });
    }

    function updateTask(token, id, body) {
      return request(app)
        .patch(`/api/v1/housekeeping/tasks/${id}`)
        .set('Authorization', auth(token))
        .send(body);
    }

    test('cualquier usuario reclama una tarea PENDIENTE y la deja EN_PROCESO', async () => {
      const task = await seedTask();
      const recepcionista = await prisma.user.findUniqueOrThrow({
        where: { username: 'recepcionista' },
      });

      const res = await updateTask(recepcionistaToken, task.id, {
        estado: 'EN_PROCESO',
        asignadoAId: recepcionista.id,
      });

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('EN_PROCESO');
      expect(res.body.asignadoAId).toBe(recepcionista.id);
    });

    test('avanzar la cadena hasta INSPECCION_OK responde 200', async () => {
      const task = await seedTask();
      for (const estado of ['EN_PROCESO', 'LIMPIA', 'EN_INSPECCION', 'INSPECCION_OK']) {
        const res = await updateTask(adminToken, task.id, { estado });
        expect(res.status).toBe(200);
        expect(res.body.estado).toBe(estado);
      }
    });

    test('una transición inválida responde 409 y conserva el estado', async () => {
      const task = await seedTask();

      const res = await updateTask(adminToken, task.id, { estado: 'LIMPIA' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect((await prisma.housekeepingTask.findUnique({ where: { id: task.id } })).estado).toBe(
        'PENDIENTE',
      );
    });

    test('un estado terminal no se mueve (409)', async () => {
      const task = await seedTask({ estado: 'INSPECCION_OK' });

      const res = await updateTask(adminToken, task.id, { estado: 'EN_PROCESO' });

      expect(res.status).toBe(409);
    });

    test('un recepcionista no puede cancelar (403)', async () => {
      const task = await seedTask();

      const res = await updateTask(recepcionistaToken, task.id, { estado: 'CANCELADA' });

      expect(res.status).toBe(403);
    });

    test('un administrador sí puede cancelar (200)', async () => {
      const task = await seedTask();

      const res = await updateTask(adminToken, task.id, { estado: 'CANCELADA' });

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('CANCELADA');
    });

    test('una tarea inexistente responde 404', async () => {
      const res = await updateTask(adminToken, 999999, { estado: 'EN_PROCESO' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /housekeeping/tasks', () => {
    beforeEach(async () => {
      await prisma.housekeepingTask.createMany({
        data: [
          { roomId: room.id, tipo: 'LIMPIEZA', estado: 'PENDIENTE', fechaProgramada: new Date() },
          { roomId: room.id, tipo: 'LIMPIEZA', estado: 'PENDIENTE', fechaProgramada: new Date() },
          { roomId: room.id, tipo: 'INSPECCION', estado: 'PENDIENTE', fechaProgramada: new Date() },
          { roomId: room2.id, tipo: 'LIMPIEZA', estado: 'EN_PROCESO', fechaProgramada: new Date() },
        ],
      });
    });

    function listTasks(query = {}) {
      return request(app)
        .get('/api/v1/housekeeping/tasks')
        .set('Authorization', auth(adminToken))
        .query(query);
    }

    test('lista tareas con filtros por estado, tipo y habitación y paginación', async () => {
      const res = await listTasks({ estado: 'PENDIENTE', roomId: room.id, page: 1, pageSize: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.data[0].tipo).toBeDefined();
      expect(res.body.data[0].room).toBeDefined();
    });

    test('sin filtros devuelve todas las tareas', async () => {
      const res = await listTasks();

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(4);
    });

    test('un parámetro inválido responde 422', async () => {
      const res = await listTasks({ estado: 'NO_EXISTE' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /housekeeping/resumen', () => {
    beforeEach(async () => {
      await prisma.housekeepingTask.createMany({
        data: [
          { roomId: room.id, tipo: 'LIMPIEZA', estado: 'PENDIENTE', fechaProgramada: new Date() },
          { roomId: room.id, tipo: 'LIMPIEZA', estado: 'EN_PROCESO', fechaProgramada: new Date() },
          { roomId: room2.id, tipo: 'LIMPIEZA', estado: 'EN_PROCESO', fechaProgramada: new Date() },
        ],
      });
    });

    test('devuelve el conteo por estado y por responsable', async () => {
      const res = await request(app)
        .get('/api/v1/housekeeping/resumen')
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.porEstado)).toBe(true);
      expect(Array.isArray(res.body.porAsignado)).toBe(true);
      const total = res.body.porEstado.reduce((sum, item) => sum + item._count, 0);
      expect(total).toBe(3);
    });

    test('una fecha inválida responde 422', async () => {
      const res = await request(app)
        .get('/api/v1/housekeeping/resumen')
        .query({ fecha: 'esto-no-es-fecha' })
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(422);
    });
  });

  describe('habitaciones: limpieza, incidencias e historial', () => {
    test('GET /rooms/{id} incluye limpieza e incidenciasAbiertas', async () => {
      await prisma.housekeepingTask.create({
        data: { roomId: room.id, tipo: 'LIMPIEZA', estado: 'LIMPIA', fechaProgramada: new Date() },
      });
      await prisma.maintenanceTicket.create({
        data: {
          roomId: room.id,
          tipo: 'AVERIA',
          prioridad: 'ALTA',
          descripcion: 'Aire no enfria',
          estado: 'ABIERTO',
          reportadoPorId: adminId,
        },
      });

      const res = await request(app)
        .get(`/api/v1/rooms/${room.id}`)
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.limpieza).toBe('LIMPIA');
      expect(res.body.incidenciasAbiertas).toBe(1);
    });

    test('GET /rooms/{id}/housekeeping devuelve el historial combinado', async () => {
      await prisma.housekeepingTask.create({
        data: { roomId: room.id, tipo: 'LIMPIEZA', estado: 'LIMPIA', fechaProgramada: new Date() },
      });
      await prisma.maintenanceTicket.create({
        data: {
          roomId: room.id,
          tipo: 'FUGA',
          prioridad: 'URGENTE',
          descripcion: 'Fuga bajo el lavatorio',
          estado: 'EN_PROCESO',
          reportadoPorId: adminId,
        },
      });

      const res = await request(app)
        .get(`/api/v1/rooms/${room.id}/housekeeping`)
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.history).toHaveLength(2);
      expect(res.body.history.map((h) => h.origen).sort()).toEqual(['tarea', 'ticket']);
      expect(res.body.history.map((h) => h.tipo).sort()).toEqual(['FUGA', 'LIMPIEZA']);
    });

    test('GET /rooms/{id} y su historial responden 404 para una habitación inexistente', async () => {
      const res = await request(app)
        .get('/api/v1/rooms/999999/housekeeping')
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('bloqueo de check-in por estado de limpieza', () => {
    let guest;

    beforeEach(async () => {
      guest = await prisma.guest.create({
        data: { nombre: 'Ana López', email: 'ana@example.com', dni: '40123456' },
      });
    });

    async function crearReserva() {
      const res = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', auth(adminToken))
        .send({ guestId: guest.id, roomId: room.id, checkIn: day(10), checkOut: day(13) });
      expect(res.status).toBe(201);
      return res.body;
    }

    function checkIn(id) {
      return request(app)
        .post(`/api/v1/reservations/${id}/checkin`)
        .set('Authorization', auth(adminToken));
    }

    test('regla activa y habitación no limpia: 409 HABITACION_NO_LIMPIA', async () => {
      const reserva = await crearReserva();

      await withEnv({ HOUSEKEEPING_BLOCK_CHECKIN: 'true' }, async () => {
        const res = await checkIn(reserva.id);

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('HABITACION_NO_LIMPIA');
      });

      const persisted = await prisma.reservation.findUnique({ where: { id: reserva.id } });
      expect(persisted.estado).toBe('CONFIRMADA');
    });

    test('regla activa y habitación limpia: check-in autorizado', async () => {
      await prisma.housekeepingTask.create({
        data: { roomId: room.id, tipo: 'LIMPIEZA', estado: 'LIMPIA', fechaProgramada: new Date() },
      });
      const reserva = await crearReserva();

      await withEnv({ HOUSEKEEPING_BLOCK_CHECKIN: 'true' }, async () => {
        const res = await checkIn(reserva.id);

        expect(res.status).toBe(200);
        expect(res.body.estado).toBe('EN_CURSO');
      });
    });

    test('regla desactivada: no evalúa el estado de limpieza', async () => {
      const reserva = await crearReserva();

      await withEnv({ HOUSEKEEPING_BLOCK_CHECKIN: 'false' }, async () => {
        const res = await checkIn(reserva.id);

        expect(res.status).toBe(200);
        expect(res.body.estado).toBe('EN_CURSO');
      });
    });
  });
});