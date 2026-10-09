const request = require('supertest');
const { app, prisma, resetDb, tokenFor } = require('../helpers/db');
const { day } = require('../helpers/dates');

beforeEach(resetDb);

describe('Pagos y facturas', () => {
  let token;
  let guestId;
  let reservationId;
  let total;

  beforeEach(async () => {
    token = await tokenFor('admin');

    const room = await prisma.room.create({
      data: { numero: '101', tipo: 'SINGLE', tarifa: 10000 },
    });
    const guest = await prisma.guest.create({
      data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
    });
    guestId = guest.id;

    const created = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId, roomId: room.id, checkIn: day(10), checkOut: day(13) });

    reservationId = created.body.id;
    total = created.body.total;
  });

  function postPayment(body, id = reservationId) {
    return request(app)
      .post(`/api/v1/reservations/${id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  function getDetail(id = reservationId) {
    return request(app).get(`/api/v1/reservations/${id}`).set('Authorization', `Bearer ${token}`);
  }

  test('pago total: 201 y la reserva queda PAGADA', async () => {
    const res = await postPayment({ monto: total, metodo: 'TARJETA', pagadoEn: day(10) });

    expect(res.status).toBe(201);
    expect(res.body.monto).toBe(total);
    expect(res.body.metodo).toBe('TARJETA');
    expect(res.body.estadoPago).toBe('PAGADA');
    expect(res.body.saldoPendiente).toBe(0);

    const detalle = await getDetail();
    expect(detalle.body.estadoPago).toBe('PAGADA');
    expect(detalle.body.totalPagado).toBe(total);
    expect(detalle.body.saldoPendiente).toBe(0);
  });

  test('pago parcial: 201 y deja saldo pendiente', async () => {
    const res = await postPayment({ monto: 10000, metodo: 'EFECTIVO', pagadoEn: day(10) });

    expect(res.status).toBe(201);
    expect(res.body.estadoPago).toBe('PARCIAL');
    expect(res.body.saldoPendiente).toBe(total - 10000);

    const detalle = await getDetail();
    expect(detalle.body.estadoPago).toBe('PARCIAL');
    expect(detalle.body.totalPagado).toBe(10000);
    expect(detalle.body.saldoPendiente).toBe(total - 10000);
    expect(detalle.body.pagos).toHaveLength(1);
  });

  test('sin pagos la reserva está PENDIENTE', async () => {
    const detalle = await getDetail();

    expect(detalle.status).toBe(200);
    expect(detalle.body.estadoPago).toBe('PENDIENTE');
    expect(detalle.body.totalPagado).toBe(0);
    expect(detalle.body.saldoPendiente).toBe(total);
  });

  test('suma de pagos parciales hasta cubrir el total', async () => {
    await postPayment({ monto: 15000, metodo: 'EFECTIVO', pagadoEn: day(10) });
    const segunda = await postPayment({ monto: 15000, metodo: 'TRANSFERENCIA', pagadoEn: day(11) });

    expect(segunda.body.estadoPago).toBe('PAGADA');

    const detalle = await getDetail();
    expect(detalle.body.totalPagado).toBe(30000);
    expect(detalle.body.saldoPendiente).toBe(0);
    expect(detalle.body.pagos).toHaveLength(2);
  });

  test('monto no positivo responde 422', async () => {
    const res = await postPayment({ monto: 0, metodo: 'EFECTIVO' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('método de pago inválido responde 422', async () => {
    const res = await postPayment({ monto: 1000, metodo: 'CHEQUE' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('pago sobre reserva inexistente responde 404', async () => {
    const res = await postPayment({ monto: 1000, metodo: 'EFECTIVO' }, 999999);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('pago sin token responde 401', async () => {
    const res = await request(app)
      .post(`/api/v1/reservations/${reservationId}/payments`)
      .send({ monto: 1000, metodo: 'EFECTIVO' });

    expect(res.status).toBe(401);
  });

  test('fecha de pago por defecto es hoy', async () => {
    const res = await postPayment({ monto: 1000, metodo: 'EFECTIVO' });

    expect(res.status).toBe(201);
    expect(res.body.pagadoEn).toBe(new Date().toISOString().slice(0, 10));
  });

  test('factura: 200 con noches, tarifa, total y pagos', async () => {
    await postPayment({ monto: 10000, metodo: 'EFECTIVO', pagadoEn: day(10) });

    const res = await request(app)
      .get(`/api/v1/reservations/${reservationId}/invoices`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.reservaId).toBe(reservationId);
    expect(res.body.estancia.noches).toBe(3);
    expect(res.body.total).toBe(30000);
    expect(res.body.habitacion.tarifaBase).toBe(10000);
    expect(res.body.cliente.dni).toBe('30123456');
    expect(res.body.pagos).toHaveLength(1);
    expect(res.body.totalPagado).toBe(10000);
    expect(res.body.saldoPendiente).toBe(20000);
    expect(res.body.estadoPago).toBe('PARCIAL');
    expect(res.body.numero).toMatch(/^FAC-/);
  });

  test('factura sin pagos refleja saldo total pendiente', async () => {
    const res = await request(app)
      .get(`/api/v1/reservations/${reservationId}/invoices`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalPagado).toBe(0);
    expect(res.body.saldoPendiente).toBe(total);
    expect(res.body.estadoPago).toBe('PENDIENTE');
  });

  test('factura de reserva inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/v1/reservations/999999/invoices')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
