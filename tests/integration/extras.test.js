const request = require('supertest');
const { app, prisma, resetDb, authHeader } = require('../helpers/db');
const { day } = require('../helpers/dates');
const { spec } = require('../../src/docs');

beforeEach(resetDb);

const reservaBase = {
  checkIn: new Date(`${day(10)}T00:00:00.000Z`),
  checkOut: new Date(`${day(13)}T00:00:00.000Z`),
  noches: 3,
  total: 30000,
};

async function crearExtra(overrides = {}) {
  const res = await request(app)
    .post('/api/v1/extras')
    .set('Authorization', await authHeader('admin'))
    .send({
      codigo: 'ROOM-SERVICE',
      nombre: 'Room service',
      categoria: 'ALIMENTOS',
      precio: 1500,
      unidad: 'POR_UNIDAD',
      ...overrides,
    });

  expect(res.status).toBe(201);
  return res.body;
}

async function seedReserva({ estado = 'CONFIRMADA', total = 30000 } = {}) {
  const room = await prisma.room.create({
    data: { numero: `10${Math.floor(Math.random() * 90) + 10}`, tipo: 'SINGLE', tarifa: 10000 },
  });
  const guest = await prisma.guest.create({
    data: {
      nombre: 'Juan Pérez',
      email: `juan${Date.now()}@example.com`,
      dni: String(30000000 + Math.floor(Math.random() * 9000000)),
    },
  });
  return prisma.reservation.create({
    data: { guestId: guest.id, roomId: room.id, estado, total, ...reservaBase },
  });
}

describe('Catálogo de servicios adicionales', () => {
  test('el administrador da de alta un servicio (201)', async () => {
    const extra = await crearExtra();
    expect(extra.id).toBeDefined();
    expect(extra.activo).toBe(true);
    expect(extra.codigo).toBe('ROOM-SERVICE');
  });

  test('un recepcionista no puede dar de alta (403)', async () => {
    const res = await request(app)
      .post('/api/v1/extras')
      .set('Authorization', await authHeader('recepcionista'))
      .send({
        codigo: 'SPA',
        nombre: 'Spa',
        categoria: 'SERVICIOS',
        precio: 2000,
        unidad: 'POR_UNIDAD',
      });

    expect(res.status).toBe(403);
    expect(await prisma.hotelExtra.count()).toBe(0);
  });

  test('código duplicado responde 409', async () => {
    await crearExtra();
    const res = await request(app)
      .post('/api/v1/extras')
      .set('Authorization', await authHeader('admin'))
      .send({
        codigo: 'ROOM-SERVICE',
        nombre: 'Otro',
        categoria: 'OTROS',
        precio: 100,
        unidad: 'DIA',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('precio no positivo o categoría inválida responden 422', async () => {
    const precio = await request(app)
      .post('/api/v1/extras')
      .set('Authorization', await authHeader('admin'))
      .send({
        codigo: 'X1',
        nombre: 'X',
        categoria: 'ALIMENTOS',
        precio: 0,
        unidad: 'DIA',
      });
    expect(precio.status).toBe(422);

    const categoria = await request(app)
      .post('/api/v1/extras')
      .set('Authorization', await authHeader('admin'))
      .send({
        codigo: 'X2',
        nombre: 'X',
        categoria: 'NO-EXISTE',
        precio: 100,
        unidad: 'DIA',
      });
    expect(categoria.status).toBe(422);
  });

  test('el listado filtra por categoría y activo', async () => {
    await crearExtra({ codigo: 'A1', categoria: 'ALIMENTOS' });
    await crearExtra({ codigo: 'L1', categoria: 'LAVANDERIA' });

    const res = await request(app)
      .get('/api/v1/extras')
      .set('Authorization', await authHeader('admin'))
      .query({ categoria: 'LAVANDERIA' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].codigo).toBe('L1');
  });

  test('el recepcionista solo ve los servicios activos', async () => {
    const activo = await crearExtra({ codigo: 'A1' });
    const inactivo = await crearExtra({ codigo: 'A2' });
    await request(app)
      .delete(`/api/v1/extras/${inactivo.id}`)
      .set('Authorization', await authHeader('admin'));

    const res = await request(app)
      .get('/api/v1/extras')
      .set('Authorization', await authHeader('recepcionista'));

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.id)).toEqual([activo.id]);
  });

  test('edición responde 200 y valida código duplicado', async () => {
    const a = await crearExtra({ codigo: 'A1' });
    await crearExtra({ codigo: 'A2' });

    const ok = await request(app)
      .patch(`/api/v1/extras/${a.id}`)
      .set('Authorization', await authHeader('admin'))
      .send({ precio: 2500 });
    expect(ok.status).toBe(200);
    expect(ok.body.precio).toBe(2500);

    const dup = await request(app)
      .patch(`/api/v1/extras/${a.id}`)
      .set('Authorization', await authHeader('admin'))
      .send({ codigo: 'A2' });
    expect(dup.status).toBe(409);
  });

  test('la baja es lógica: marca activo=false y lo conserva', async () => {
    const extra = await crearExtra();
    const res = await request(app)
      .delete(`/api/v1/extras/${extra.id}`)
      .set('Authorization', await authHeader('admin'));

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(false);

    const enBase = await prisma.hotelExtra.findUnique({ where: { id: extra.id } });
    expect(enBase).not.toBeNull();
    expect(enBase.activo).toBe(false);
  });
});

describe('Cargos a la reserva', () => {
  test('registra un cargo con importe calculado (201, PENDIENTE)', async () => {
    const extra = await crearExtra({ precio: 1500 });
    const reserva = await seedReserva();

    const res = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('recepcionista'))
      .send({ extraId: extra.id, cantidad: 3, nota: 'Minibar' });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('PENDIENTE');
    expect(res.body.precioUnitario).toBe(1500);
    expect(res.body.importe).toBe(4500);
    expect(res.body.cantidad).toBe(3);
  });

  test('un servicio inactivo no puede recibir cargos (409)', async () => {
    const extra = await crearExtra();
    await request(app)
      .delete(`/api/v1/extras/${extra.id}`)
      .set('Authorization', await authHeader('admin'));
    const reserva = await seedReserva();

    const res = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 1 });

    expect(res.status).toBe(409);
    expect(await prisma.extraCharge.count()).toBe(0);
  });

  test('reserva inexistente responde 404', async () => {
    const extra = await crearExtra();
    const res = await request(app)
      .post('/api/v1/reservations/999999/charges')
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 1 });

    expect(res.status).toBe(404);
  });

  test('reserva fuera de vigencia responde 409', async () => {
    const extra = await crearExtra();
    const reserva = await seedReserva({ estado: 'CANCELADA' });

    const res = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 1 });

    expect(res.status).toBe(409);
  });

  test('cantidad menor a 1 responde 422', async () => {
    const extra = await crearExtra();
    const reserva = await seedReserva();

    const res = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 0 });

    expect(res.status).toBe(422);
  });

  test('listado sin cargos: totalServicios 0 y totalGeneral igual al total', async () => {
    const reserva = await seedReserva({ total: 30000 });

    const res = await request(app)
      .get(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('recepcionista'));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.resumen).toEqual({
      totalEstadia: 30000,
      totalServicios: 0,
      totalGeneral: 30000,
      cantidadCargos: 0,
    });
  });

  test('listado con varios cargos suma el resumen', async () => {
    const extraA = await crearExtra({ codigo: 'A1', precio: 1000 });
    const extraB = await crearExtra({ codigo: 'A2', precio: 500 });
    const reserva = await seedReserva({ total: 30000 });

    await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extraA.id, cantidad: 2 });
    await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extraB.id, cantidad: 3 });

    const res = await request(app)
      .get(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'));

    expect(res.body.data).toHaveLength(2);
    expect(res.body.resumen.totalServicios).toBe(3500);
    expect(res.body.resumen.totalGeneral).toBe(33500);
    expect(res.body.resumen.cantidadCargos).toBe(2);
  });

  test('listado de cargos de reserva inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/v1/reservations/999999/charges')
      .set('Authorization', await authHeader('admin'));

    expect(res.status).toBe(404);
  });

  test('el detalle de la reserva incluye el resumen con ?incluirCargos=true', async () => {
    const extra = await crearExtra({ precio: 1000 });
    const reserva = await seedReserva({ total: 30000 });
    await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 2 });

    const res = await request(app)
      .get(`/api/v1/reservations/${reserva.id}`)
      .set('Authorization', await authHeader('admin'))
      .query({ incluirCargos: 'true' });

    expect(res.status).toBe(200);
    expect(res.body.resumenCargos).toEqual({
      totalEstadia: 30000,
      totalServicios: 2000,
      totalGeneral: 32000,
      cantidadCargos: 1,
    });
  });

  test('el detalle de la reserva sin la bandera no incluye el resumen', async () => {
    const reserva = await seedReserva();
    const res = await request(app)
      .get(`/api/v1/reservations/${reserva.id}`)
      .set('Authorization', await authHeader('admin'));

    expect(res.status).toBe(200);
    expect(res.body.resumenCargos).toBeUndefined();
  });

  test('el precio congelado no cambia si se edita el catálogo', async () => {
    const extra = await crearExtra({ precio: 1500 });
    const reserva = await seedReserva();

    const cargo = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 2 });
    expect(cargo.body.importe).toBe(3000);

    await request(app)
      .patch(`/api/v1/extras/${extra.id}`)
      .set('Authorization', await authHeader('admin'))
      .send({ precio: 9999 });

    const res = await request(app)
      .get(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'));

    expect(res.body.data[0].precioUnitario).toBe(1500);
    expect(res.body.data[0].importe).toBe(3000);
  });
});

describe('Anulación de cargos', () => {
  async function cargoDe(reserva, extra) {
    const res = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 1 });
    return res.body;
  }

  test('el administrador anula un cargo (200) y deja autor y fecha', async () => {
    const extra = await crearExtra({ precio: 1000 });
    const reserva = await seedReserva();
    const cargo = await cargoDe(reserva, extra);

    const res = await request(app)
      .patch(`/api/v1/reservations/${reserva.id}/charges/${cargo.id}`)
      .set('Authorization', await authHeader('admin'));

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('CANCELADO');
    expect(res.body.anuladoPorId).toBeDefined();
    expect(res.body.anuladoEn).not.toBeNull();
  });

  test('un recepcionista no puede anular (403)', async () => {
    const extra = await crearExtra({ precio: 1000 });
    const reserva = await seedReserva();
    const cargo = await cargoDe(reserva, extra);

    const res = await request(app)
      .patch(`/api/v1/reservations/${reserva.id}/charges/${cargo.id}`)
      .set('Authorization', await authHeader('recepcionista'));

    expect(res.status).toBe(403);
    const enBase = await prisma.extraCharge.findUnique({ where: { id: cargo.id } });
    expect(enBase.estado).toBe('PENDIENTE');
  });

  test('cargo inexistente responde 404', async () => {
    const reserva = await seedReserva();
    const res = await request(app)
      .patch(`/api/v1/reservations/${reserva.id}/charges/999999`)
      .set('Authorization', await authHeader('admin'));

    expect(res.status).toBe(404);
  });

  test('el resumen excluye los cargos anulados', async () => {
    const extra = await crearExtra({ precio: 1000 });
    const reserva = await seedReserva({ total: 30000 });
    const cargo = await cargoDe(reserva, extra);

    await request(app)
      .patch(`/api/v1/reservations/${reserva.id}/charges/${cargo.id}`)
      .set('Authorization', await authHeader('admin'));

    const res = await request(app)
      .get(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'));

    expect(res.body.resumen.totalServicios).toBe(0);
    expect(res.body.resumen.totalGeneral).toBe(30000);
    expect(res.body.resumen.cantidadCargos).toBe(0);
  });
});

describe('Reporte de consumo', () => {
  test('devuelve importe por servicio y total del período', async () => {
    const extra = await crearExtra({ codigo: 'A1', precio: 1000 });
    const reserva = await seedReserva();
    await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 2 });

    const res = await request(app)
      .get('/api/v1/extras/consumo')
      .set('Authorization', await authHeader('admin'))
      .query({ desde: day(0), hasta: day(1) });

    expect(res.status).toBe(200);
    expect(res.body.totalPeriodo).toBe(2000);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ codigo: 'A1', cantidad: 2, importe: 2000 });
  });

  test('rango inválido responde 422', async () => {
    const res = await request(app)
      .get('/api/v1/extras/consumo')
      .set('Authorization', await authHeader('admin'))
      .query({ desde: day(1), hasta: day(0) });

    expect(res.status).toBe(422);
  });

  test('un cargo anulado no suma al consumo', async () => {
    const extra = await crearExtra({ codigo: 'A1', precio: 1000 });
    const reserva = await seedReserva();
    const cargo = await request(app)
      .post(`/api/v1/reservations/${reserva.id}/charges`)
      .set('Authorization', await authHeader('admin'))
      .send({ extraId: extra.id, cantidad: 2 });

    await request(app)
      .patch(`/api/v1/reservations/${reserva.id}/charges/${cargo.body.id}`)
      .set('Authorization', await authHeader('admin'));

    const res = await request(app)
      .get('/api/v1/extras/consumo')
      .set('Authorization', await authHeader('admin'))
      .query({ desde: day(0), hasta: day(1) });

    expect(res.status).toBe(200);
    expect(res.body.totalPeriodo).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

describe('Documentación de extras', () => {
  test('el spec documenta catálogo, cargos y consumo', () => {
    expect(spec.tags.map((t) => t.name)).toContain('Extras');
    expect(spec.paths['/extras'].get).toBeDefined();
    expect(spec.paths['/extras'].post).toBeDefined();
    expect(spec.paths['/extras/{id}'].patch).toBeDefined();
    expect(spec.paths['/extras/{id}'].delete).toBeDefined();
    expect(spec.paths['/extras/consumo'].get).toBeDefined();
    expect(spec.paths['/reservations/{id}/charges'].get).toBeDefined();
    expect(spec.paths['/reservations/{id}/charges'].post).toBeDefined();
    expect(spec.paths['/reservations/{id}/charges/{chargeId}'].patch).toBeDefined();
    expect(spec.components.schemas.HotelExtra).toBeDefined();
    expect(spec.components.schemas.ConsumoReporte).toBeDefined();
  });
});
