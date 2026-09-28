const request = require('supertest');
const { app, prisma, resetDb, tokenFor } = require('../helpers/db');
const { day } = require('../helpers/dates');

beforeEach(resetDb);

let token;

beforeEach(async () => {
  token = await tokenFor('admin');
});

async function crearGuest(overrides = {}) {
  const res = await request(app)
    .post('/api/v1/guests')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456', ...overrides });

  expect(res.status).toBe(201);
  return res.body;
}

describe('Huéspedes', () => {
  test('alta exitosa responde 201', async () => {
    const res = await request(app)
      .post('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.dni).toBe('30123456');
    expect(res.body.activo).toBe(true);
  });

  test('DNI duplicado responde 409', async () => {
    await request(app)
      .post('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' });

    const res = await request(app)
      .post('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Otro Juan', email: 'otro@example.com', dni: '30123456' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('datos inválidos responden 422', async () => {
    const res = await request(app)
      .post('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: '', email: 'no-es-un-email', dni: '' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('DNI con formato inválido responde 422', async () => {
    const res = await request(app)
      .post('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Juan Pérez', email: 'juan@example.com', dni: '12345' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.path === 'dni')).toBe(true);
  });

  test('teléfono con longitud o formato inválido responde 422', async () => {
    const res = await request(app)
      .post('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        dni: '30123456',
        telefono: '+1 555 0100',
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.path === 'telefono')).toBe(true);
  });

  test('teléfono válido con prefijo + se acepta', async () => {
    const guest = await crearGuest({ telefono: '+5491122334455' });

    expect(guest.telefono).toBe('+5491122334455');
  });

  test('listado con filtro por nombre', async () => {
    await crearGuest({ nombre: 'Ana García', email: 'ana@example.com', dni: '30111111' });
    await crearGuest({ nombre: 'Luis López', email: 'luis@example.com', dni: '30222222' });

    const res = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ nombre: 'Ana' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nombre).toBe('Ana García');
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 10, total: 1 });
  });

  test('listado con filtro por DNI', async () => {
    await crearGuest({ nombre: 'Ana García', email: 'ana@example.com', dni: '30111111' });
    await crearGuest({ nombre: 'Luis López', email: 'luis@example.com', dni: '30222222' });

    const res = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ dni: '30222' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].dni).toBe('30222222');
  });

  test('listado pagina y respeta page y pageSize', async () => {
    for (let i = 1; i <= 5; i += 1) {
      await crearGuest({ nombre: `Huésped ${i}`, email: `h${i}@example.com`, dni: `3011110${i}` });
    }

    const first = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, pageSize: 2 });

    expect(first.status).toBe(200);
    expect(first.body.data).toHaveLength(2);
    expect(first.body.pagination).toEqual({ page: 1, pageSize: 2, total: 5 });

    const second = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 2, pageSize: 2 });

    expect(second.body.data).toHaveLength(2);
    expect(second.body.pagination).toEqual({ page: 2, pageSize: 2, total: 5 });

    const third = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 3, pageSize: 2 });

    expect(third.body.data).toHaveLength(1);
    expect(third.body.pagination).toEqual({ page: 3, pageSize: 2, total: 5 });

    const ids = [...first.body.data, ...second.body.data, ...third.body.data].map((g) => g.id);
    expect(new Set(ids).size).toBe(5);
  });

  test('pageSize inválido responde 422', async () => {
    const res = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ pageSize: 0 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('detalle de huésped existente responde 200', async () => {
    const created = await crearGuest();

    const res = await request(app)
      .get(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.dni).toBe('30123456');
  });

  test('detalle de huésped inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/v1/guests/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('edición exitosa responde 200 con los datos actualizados', async () => {
    const created = await crearGuest();

    const res = await request(app)
      .patch(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Juan Pérez Soto', email: 'juan.soto@example.com', telefono: '1122334455' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Juan Pérez Soto');
    expect(res.body.email).toBe('juan.soto@example.com');
    expect(res.body.telefono).toBe('1122334455');
    expect(res.body.dni).toBe('30123456');
  });

  test('edición conserva los campos no enviados', async () => {
    const created = await crearGuest({ telefono: '1122334455' });

    const res = await request(app)
      .patch(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Nombre Nuevo' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('juan@example.com');
    expect(res.body.telefono).toBe('1122334455');
  });

  test('edición con el mismo DNI no responde 409', async () => {
    const created = await crearGuest();

    const res = await request(app)
      .patch(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dni: '30123456' });

    expect(res.status).toBe(200);
    expect(res.body.dni).toBe('30123456');
  });

  test('edición cambia el DNI a uno libre', async () => {
    const created = await crearGuest();

    const res = await request(app)
      .patch(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dni: '30999999' });

    expect(res.status).toBe(200);
    expect(res.body.dni).toBe('30999999');
  });

  test('edición con DNI duplicado responde 409 y no aplica el cambio', async () => {
    await crearGuest({ nombre: 'Ana García', email: 'ana@example.com', dni: '30111111' });
    const target = await crearGuest();

    const res = await request(app)
      .patch(`/api/v1/guests/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Juan Cambiado', dni: '30111111' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');

    const current = await request(app)
      .get(`/api/v1/guests/${target.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(current.body.nombre).toBe('Juan Pérez');
    expect(current.body.dni).toBe('30123456');
  });

  test('edición con datos inválidos responde 422', async () => {
    const created = await crearGuest();

    const res = await request(app)
      .patch(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'no-es-un-email', dni: '123', telefono: 'abc' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('edición de huésped inexistente responde 404', async () => {
    const res = await request(app)
      .patch('/api/v1/guests/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Nadie' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('borrado de huésped responde 200 y lo archiva', async () => {
    const created = await crearGuest();

    const res = await request(app)
      .delete(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Huésped eliminado');

    const detail = await request(app)
      .get(`/api/v1/guests/${created.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detail.status).toBe(404);
  });

  test('borrado de huésped inexistente responde 404', async () => {
    const res = await request(app)
      .delete('/api/v1/guests/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('el listado excluye a los huéspedes archivados', async () => {
    const visible = await crearGuest({ nombre: 'Ana García', dni: '30111111' });
    const removed = await crearGuest({ nombre: 'Luis López', email: 'luis@example.com', dni: '30222222' });

    await request(app)
      .delete(`/api/v1/guests/${removed.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((g) => g.id)).toEqual([visible.id]);
    expect(res.body.pagination.total).toBe(1);
  });

  test('el listado con filtros excluye a los huéspedes archivados', async () => {
    await crearGuest({ nombre: 'Ana García', email: 'ana@example.com', dni: '30111111' });
    const removed = await crearGuest({ nombre: 'Anaarchived', email: 'ana2@example.com', dni: '30333333' });

    await request(app)
      .delete(`/api/v1/guests/${removed.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/guests')
      .set('Authorization', `Bearer ${token}`)
      .query({ nombre: 'Ana' });

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nombre).toBe('Ana García');
  });
});

describe('Huéspedes archivados y reservas', () => {
  let roomId;

  beforeEach(async () => {
    const room = await prisma.room.create({
      data: { numero: '101', tipo: 'SINGLE', tarifa: 10000 },
    });
    roomId = room.id;
  });

  async function crearReserva(guestId) {
    return prisma.reservation.create({
      data: {
        guestId,
        roomId,
        checkIn: new Date(`${day(10)}T00:00:00.000Z`),
        checkOut: new Date(`${day(13)}T00:00:00.000Z`),
        noches: 3,
        total: 30000,
        estado: 'CONFIRMADA',
      },
    });
  }

  test('el borrado lógico conserva las reservas asociadas', async () => {
    const guest = await crearGuest();
    const reserva = await crearReserva(guest.id);

    const res = await request(app)
      .delete(`/api/v1/guests/${guest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const enBase = await prisma.reservation.findUnique({ where: { id: reserva.id } });
    expect(enBase).not.toBeNull();
    expect(enBase.guestId).toBe(guest.id);
    expect(enBase.estado).toBe('CONFIRMADA');

    const archivado = await prisma.guest.findUnique({ where: { id: guest.id } });
    expect(archivado.activo).toBe(false);

    const detalle = await request(app)
      .get(`/api/v1/reservations/${reserva.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detalle.status).toBe(200);
    expect(detalle.body.guestId).toBe(guest.id);
  });

  test('no se puede crear una reserva para un huésped archivado', async () => {
    const guest = await crearGuest();

    await request(app)
      .delete(`/api/v1/guests/${guest.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: guest.id, roomId, checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/archivado/);
    expect(await prisma.reservation.count()).toBe(0);
  });

  test('no se puede asignar un huésped archivado al modificar una reserva', async () => {
    const active = await crearGuest();
    const removed = await crearGuest({ email: 'ana@example.com', dni: '30111111' });
    const reserva = await crearReserva(active.id);

    await request(app)
      .delete(`/api/v1/guests/${removed.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/v1/reservations/${reserva.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId: removed.id });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    const enBase = await prisma.reservation.findUnique({ where: { id: reserva.id } });
    expect(enBase.guestId).toBe(active.id);
  });

  test('una reserva existente se puede modificar tras archivar a su huésped', async () => {
    const guest = await crearGuest();
    const reserva = await crearReserva(guest.id);

    await request(app)
      .delete(`/api/v1/guests/${guest.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/v1/reservations/${reserva.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notas: 'El huésped avisó que llega tarde' });

    expect(res.status).toBe(200);
    expect(res.body.notas).toBe('El huésped avisó que llega tarde');
  });

  test('un huésped archivado no se puede editar ni volver a borrar', async () => {
    const guest = await crearGuest();

    await request(app)
      .delete(`/api/v1/guests/${guest.id}`)
      .set('Authorization', `Bearer ${token}`);

    const patch = await request(app)
      .patch(`/api/v1/guests/${guest.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Reactivado' });

    expect(patch.status).toBe(404);

    const del = await request(app)
      .delete(`/api/v1/guests/${guest.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(404);
  });
});
