const request = require('supertest');
const { app, prisma, resetDb, tokenFor } = require('../helpers/db');

beforeEach(resetDb);

describe('Mantenimiento', () => {
  let adminToken;
  let recepcionistaToken;
  let adminId;
  let room;
  let room2;

  beforeEach(async () => {
    adminToken = await tokenFor('admin');
    recepcionistaToken = await tokenFor('recepcionista');
    adminId = (await prisma.user.findUnique({ where: { username: 'admin' } })).id;
    room = await prisma.room.create({ data: { numero: '301', tipo: 'DOBLE', tarifa: 12000 } });
    room2 = await prisma.room.create({ data: { numero: '302', tipo: 'SINGLE', tarifa: 8000 } });
  });

  function auth(token) {
    return `Bearer ${token}`;
  }

  function createTicket(token, body) {
    return request(app)
      .post('/api/v1/maintenance/tickets')
      .set('Authorization', auth(token))
      .send(body);
  }

  function updateTicket(token, id, body) {
    return request(app)
      .patch(`/api/v1/maintenance/tickets/${id}`)
      .set('Authorization', auth(token))
      .send(body);
  }

  function validTicket(overrides = {}) {
    return { roomId: room.id, tipo: 'AVERIA', prioridad: 'MEDIA', descripcion: 'Aire acondicionado', ...overrides };
  }

  describe('POST /maintenance/tickets', () => {
    test('cualquier rol autenticado reporta un ticket en ABIERTO (201)', async () => {
      const res = await createTicket(recepcionistaToken, validTicket());

      expect(res.status).toBe(201);
      expect(res.body.estado).toBe('ABIERTO');
      expect(res.body.roomId).toBe(room.id);
      expect(res.body.reportadoPorId).toBeDefined();
    });

    test('una habitación inexistente responde 404', async () => {
      const res = await createTicket(adminToken, validTicket({ roomId: 999999 }));

      expect(res.status).toBe(404);
    });

    test('un tipo o prioridad inválidos responden 422', async () => {
      const resTipo = await createTicket(adminToken, validTicket({ tipo: 'NO_VALIDO' }));
      const resPrioridad = await createTicket(adminToken, validTicket({ prioridad: 'URGENTISIMA' }));

      expect(resTipo.status).toBe(422);
      expect(resPrioridad.status).toBe(422);
    });

    test('faltar la descripción responde 422', async () => {
      const res = await createTicket(adminToken, validTicket({ descripcion: undefined }));

      expect(res.status).toBe(422);
    });
  });

  describe('GET /maintenance/tickets', () => {
    beforeEach(async () => {
      await prisma.maintenanceTicket.createMany({
        data: [
          { roomId: room.id, tipo: 'AVERIA', prioridad: 'ALTA', descripcion: 'A', estado: 'ABIERTO', reportadoPorId: adminId },
          { roomId: room.id, tipo: 'FUGA', prioridad: 'URGENTE', descripcion: 'B', estado: 'ABIERTO', reportadoPorId: adminId },
          { roomId: room2.id, tipo: 'ELECTRICA', prioridad: 'BAJA', descripcion: 'C', estado: 'EN_PROCESO', reportadoPorId: adminId },
        ],
      });
    });

    function listTickets(query = {}) {
      return request(app)
        .get('/api/v1/maintenance/tickets')
        .set('Authorization', auth(adminToken))
        .query(query);
    }

    test('lista tickets con filtros y paginación', async () => {
      const res = await listTickets({ estado: 'ABIERTO', roomId: room.id, page: 1, pageSize: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.data[0].room).toBeDefined();
    });

    test('sin filtros devuelve todos los tickets', async () => {
      const res = await listTickets();

      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(3);
    });
  });

  describe('GET /maintenance/tickets/{id}', () => {
    test('devuelve el ticket por id', async () => {
      const created = await createTicket(adminToken, validTicket());
      const res = await request(app)
        .get(`/api/v1/maintenance/tickets/${created.body.id}`)
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    test('un ticket inexistente responde 404', async () => {
      const res = await request(app)
        .get('/api/v1/maintenance/tickets/999999')
        .set('Authorization', auth(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /maintenance/tickets/{id}', () => {
    async function seedTicket(estado = 'ABIERTO') {
      return prisma.maintenanceTicket.create({
        data: {
          roomId: room.id,
          tipo: 'AVERIA',
          prioridad: 'MEDIA',
          descripcion: 'Ruido en cañerías',
          estado,
          reportadoPorId: adminId,
        },
      });
    }

    test('ABIERTO → EN_PROCESO → RESUELTO con resolución (200)', async () => {
      const ticket = await seedTicket();

      const enProceso = await updateTicket(adminToken, ticket.id, { estado: 'EN_PROCESO' });
      expect(enProceso.status).toBe(200);
      expect(enProceso.body.estado).toBe('EN_PROCESO');

      const resuelto = await updateTicket(adminToken, ticket.id, {
        estado: 'RESUELTO',
        resolucion: 'Se reemplazó el sifón',
      });
      expect(resuelto.status).toBe(200);
      expect(resuelto.body.estado).toBe('RESUELTO');
      expect(resuelto.body.resolucion).toBe('Se reemplazó el sifón');
      expect(resuelto.body.resueltoEn).toBeDefined();
    });

    test('resolver sin resolución responde 422', async () => {
      const ticket = await seedTicket();

      const res = await updateTicket(adminToken, ticket.id, { estado: 'RESUELTO', resolucion: '   ' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('cancelar como recepcionista responde 403', async () => {
      const ticket = await seedTicket();

      const res = await updateTicket(recepcionistaToken, ticket.id, { estado: 'CANCELADO' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('cancelar como administrador responde 200', async () => {
      const ticket = await seedTicket('EN_PROCESO');

      const res = await updateTicket(adminToken, ticket.id, { estado: 'CANCELADO' });

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('CANCELADO');
    });

    test('una transición inválida responde 409', async () => {
      const ticket = await seedTicket('RESUELTO');

      const res = await updateTicket(adminToken, ticket.id, { estado: 'EN_PROCESO' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('creación de tarea de inspección al resolver', () => {
    function countInspecciones(roomId) {
      return prisma.housekeepingTask.count({
        where: { roomId, tipo: 'INSPECCION' },
      });
    }

    test('resolver un ticket crea una inspección PENDIENTE', async () => {
      const created = await createTicket(recepcionistaToken, validTicket());
      const res = await updateTicket(recepcionistaToken, created.body.id, {
        estado: 'RESUELTO',
        resolucion: 'Arreglado',
      });

      expect(res.status).toBe(200);
      const inspeccion = await prisma.housekeepingTask.findFirst({
        where: { roomId: room.id, tipo: 'INSPECCION' },
      });
      expect(inspeccion).toBeDefined();
      expect(inspeccion.estado).toBe('PENDIENTE');
    });

    test('resolver más de un ticket no duplica la inspección pendiente', async () => {
      const t1 = await createTicket(recepcionistaToken, validTicket());
      const t2 = await createTicket(recepcionistaToken, validTicket({ descripcion: 'Otro problema' }));

      await updateTicket(recepcionistaToken, t1.body.id, { estado: 'RESUELTO', resolucion: 'Uno' });
      await updateTicket(recepcionistaToken, t2.body.id, { estado: 'RESUELTO', resolucion: 'Dos' });

      expect(await countInspecciones(room.id)).toBe(1);
    });

    test('cancelar un ticket no genera tarea de inspección', async () => {
      const created = await createTicket(recepcionistaToken, validTicket());
      await updateTicket(adminToken, created.body.id, { estado: 'CANCELADO' });

      expect(await countInspecciones(room.id)).toBe(0);
      const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: created.body.id } });
      expect(ticket.estado).toBe('CANCELADO');
    });
  });
});