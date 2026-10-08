const request = require('supertest');
const { app, prisma, resetDb, tokenFor } = require('../helpers/db');
const { day } = require('../helpers/dates');

beforeEach(resetDb);

describe('Reportes', () => {
  let token;

  beforeEach(async () => {
    token = await tokenFor('admin');
  });

  function getReport(pathname, query) {
    return request(app)
      .get(`/api/v1/reports/${pathname}`)
      .set('Authorization', `Bearer ${token}`)
      .query(query);
  }

  async function createRoom(numero, tipo, tarifa = 10000) {
    return prisma.room.create({ data: { numero, tipo, tarifa } });
  }

  async function createGuest(dni) {
    return prisma.guest.create({
      data: { nombre: `Huésped ${dni}`, email: `guest${dni}@example.com`, dni },
    });
  }

  async function createReservation(roomId, guestId, checkIn, checkOut) {
    return request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestId, roomId, checkIn, checkOut });
  }

  test('ocupación: 200 con noches ocupadas y porcentaje', async () => {
    const roomA = await createRoom('101', 'SINGLE');
    const roomB = await createRoom('102', 'DOBLE');
    const guest = await createGuest('30111222');

    await createReservation(roomA.id, guest.id, day(10), day(13));

    const res = await getReport('ocupacion', { checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(200);
    expect(res.body.habitaciones).toBe(2);
    expect(res.body.noches).toBe(3);
    expect(res.body.nochesOcupadas).toBe(3);
    expect(res.body.nochesDisponibles).toBe(3);
    expect(res.body.porcentajeOcupacion).toBe(50);
    expect(roomB.id).toBeTruthy();
  });

  test('ocupación con rango sin reservas da 0 %', async () => {
    await createRoom('101', 'SINGLE');

    const res = await getReport('ocupacion', { checkIn: day(30), checkOut: day(33) });

    expect(res.status).toBe(200);
    expect(res.body.nochesOcupadas).toBe(0);
    expect(res.body.porcentajeOcupacion).toBe(0);
  });

  test('rango inválido responde 422', async () => {
    const res = await getReport('ocupacion', { checkIn: day(13), checkOut: day(13) });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rango invertido responde 422', async () => {
    const res = await getReport('ingresos', { checkIn: day(20), checkOut: day(10) });

    expect(res.status).toBe(422);
  });

  test('sin parámetros de rango responde 422', async () => {
    const res = await getReport('ocupacion', {});

    expect(res.status).toBe(422);
  });

  test('ingresos: 200 con la suma de pagos del rango', async () => {
    const room = await createRoom('101', 'SINGLE');
    const guest = await createGuest('30111222');
    const reserva = await createReservation(room.id, guest.id, day(10), day(13));

    await request(app)
      .post(`/api/v1/reservations/${reserva.body.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ monto: 10000, metodo: 'EFECTIVO', pagadoEn: day(11) });
    await request(app)
      .post(`/api/v1/reservations/${reserva.body.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ monto: 5000, metodo: 'TARJETA', pagadoEn: day(12) });
    // Fuera del rango consultado: no se cuenta.
    await request(app)
      .post(`/api/v1/reservations/${reserva.body.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ monto: 7000, metodo: 'EFECTIVO', pagadoEn: day(40) });

    const res = await getReport('ingresos', { checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(15000);
    expect(res.body.cantidadPagos).toBe(2);
    expect(res.body.porMetodo).toEqual(
      expect.arrayContaining([
        { metodo: 'EFECTIVO', cantidad: 1, total: 10000 },
        { metodo: 'TARJETA', cantidad: 1, total: 5000 },
      ]),
    );
  });

  test('ingresos sin pagos responde total 0', async () => {
    const res = await getReport('ingresos', { checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.cantidadPagos).toBe(0);
    expect(res.body.porMetodo).toEqual([]);
  });

  test('reservas por tipo: 200 con desglose por tipo de habitación', async () => {
    const single = await createRoom('101', 'SINGLE');
    const doble = await createRoom('102', 'DOBLE');
    const doble2 = await createRoom('103', 'DOBLE');
    const guestA = await createGuest('30111222');
    const guestB = await createGuest('30111333');

    await createReservation(single.id, guestA.id, day(10), day(13));
    await createReservation(doble.id, guestA.id, day(20), day(22));
    await createReservation(doble2.id, guestB.id, day(40), day(42));

    const res = await getReport('reservas-por-tipo', { checkIn: day(10), checkOut: day(45) });

    expect(res.status).toBe(200);
    expect(res.body.totalReservas).toBe(3);
    expect(res.body.porTipo).toEqual(
      expect.arrayContaining([
        { tipo: 'SINGLE', cantidad: 1, habitaciones: 1 },
        { tipo: 'DOBLE', cantidad: 2, habitaciones: 2 },
      ]),
    );
  });

  test('solo cuentan estados vigentes: canceladas y NO_SHOW quedan fuera', async () => {
    const roomA = await createRoom('101', 'SINGLE');
    const roomB = await createRoom('102', 'SINGLE');
    const roomC = await createRoom('103', 'SINGLE');
    const guest = await createGuest('30111222');

    const activa = await createReservation(roomA.id, guest.id, day(10), day(13));
    const cancelada = await createReservation(roomB.id, guest.id, day(10), day(13));
    const noShow = await createReservation(roomC.id, guest.id, day(10), day(13));

    await request(app)
      .post(`/api/v1/reservations/${cancelada.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ motivo: 'El huésped se arrepintió' });
    await request(app)
      .post(`/api/v1/reservations/${noShow.body.id}/no-show`)
      .set('Authorization', `Bearer ${token}`);

    const ocupacion = await getReport('ocupacion', { checkIn: day(10), checkOut: day(13) });
    expect(ocupacion.status).toBe(200);
    expect(ocupacion.body.nochesOcupadas).toBe(3);

    const porTipo = await getReport('reservas-por-tipo', {
      checkIn: day(10),
      checkOut: day(13),
    });
    expect(porTipo.status).toBe(200);
    expect(porTipo.body.totalReservas).toBe(1);

    expect(activa.body.estado).toBe('CONFIRMADA');
  });

  test('sin token responde 401', async () => {
    const res = await request(app)
      .get('/api/v1/reports/ocupacion')
      .query({ checkIn: day(10), checkOut: day(13) });

    expect(res.status).toBe(401);
  });
});
