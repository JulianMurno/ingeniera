const request = require('supertest');
const { app, prisma, resetDb, authHeader } = require('../helpers/db');
const { day } = require('../helpers/dates');
const { toDate } = require('../../src/services/business.service');

beforeEach(resetDb);

describe('Calendario de reservas', () => {
  let rooms;
  let guest;

  beforeEach(async () => {
    await authHeader('admin');

    rooms = await prisma.room.createManyAndReturn({
      data: [
        { numero: '101', tipo: 'SINGLE', tarifa: 10000 },
        { numero: '102', tipo: 'DOBLE', tarifa: 12000, estado: 'MANTENIMIENTO' },
      ],
    });

    guest = await prisma.guest.create({
      data: { nombre: 'Juan Pérez', email: 'juan@example.com', dni: '30123456' },
    });
  });

  function crearReserva({ roomId = rooms[0].id, checkIn, checkOut, estado = 'CONFIRMADA' }) {
    return prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId,
        checkIn: toDate(checkIn),
        checkOut: toDate(checkOut),
        noches: 1,
        total: 10000,
        estado,
      },
    });
  }

  async function consultarAutenticado(desde, hasta) {
    return request(app)
      .get('/api/v1/reservations/calendar')
      .set('Authorization', await authHeader('admin'))
      .query(desde === undefined ? {} : { desde, hasta });
  }

  test('devuelve todas las habitaciones ordenadas y las reservas vigentes del rango', async () => {
    const reserva = await crearReserva({ checkIn: day(10), checkOut: day(13) });

    const res = await consultarAutenticado(day(1), day(31));

    expect(res.status).toBe(200);
    expect(res.body.rooms).toHaveLength(2);
    expect(res.body.rooms.map((r) => r.numero)).toEqual(['101', '102']);
    expect(res.body.rooms[0]).toMatchObject({
      id: rooms[0].id,
      numero: '101',
      tipo: 'SINGLE',
      estado: 'DISPONIBLE',
    });
    expect(res.body.rooms[1].estado).toBe('MANTENIMIENTO');

    expect(res.body.reservations).toHaveLength(1);
    const [item] = res.body.reservations;
    expect(item.id).toBe(reserva.id);
    expect(item.roomId).toBe(rooms[0].id);
    expect(item.estado).toBe('CONFIRMADA');
    expect(item.checkIn.slice(0, 10)).toBe(day(10));
    expect(item.checkOut.slice(0, 10)).toBe(day(13));
    expect(item.guest.nombre).toBe('Juan Pérez');
  });

  test('excluye las reservas CANCELADA y NO_SHOW y conserva la CONFIRMADA', async () => {
    const vigente = await crearReserva({ checkIn: day(10), checkOut: day(13) });
    await crearReserva({ checkIn: day(10), checkOut: day(13), estado: 'CANCELADA' });
    await crearReserva({ checkIn: day(11), checkOut: day(12), estado: 'NO_SHOW' });

    const res = await consultarAutenticado(day(1), day(31));

    expect(res.status).toBe(200);
    expect(res.body.reservations.map((r) => r.id)).toEqual([vigente.id]);
  });

  test('incluye las reservas FINALIZADA que se solapan con el rango', async () => {
    const finalizada = await crearReserva({
      checkIn: day(-5),
      checkOut: day(-2),
      estado: 'FINALIZADA',
    });

    const res = await consultarAutenticado(day(-10), day(10));

    expect(res.status).toBe(200);
    expect(res.body.reservations.map((r) => r.id)).toContain(finalizada.id);
  });

  test('aplica los límites checkIn < hasta y checkOut > desde', async () => {
    const enRango = await crearReserva({ checkIn: day(10), checkOut: day(13) });
    await crearReserva({ checkIn: day(5), checkOut: day(10) });
    const recambio = await crearReserva({ checkIn: day(13), checkOut: day(15) });
    await crearReserva({ checkIn: day(1), checkOut: day(2) });

    const res = await consultarAutenticado(day(10), day(14));

    expect(res.status).toBe(200);
    expect(res.body.reservations.map((r) => r.id).sort()).toEqual([enRango.id, recambio.id].sort());
  });

  test('una reserva que termina en desde no se incluye', async () => {
    await crearReserva({ checkIn: day(5), checkOut: day(10) });

    const res = await consultarAutenticado(day(10), day(20));

    expect(res.status).toBe(200);
    expect(res.body.reservations).toEqual([]);
  });

  test('una reserva que comienza en hasta no se incluye', async () => {
    await crearReserva({ checkIn: day(20), checkOut: day(22) });

    const res = await consultarAutenticado(day(10), day(20));

    expect(res.status).toBe(200);
    expect(res.body.reservations).toEqual([]);
  });

  test.each([
    ['sin desde', undefined, day(20)],
    ['sin hasta', day(10), undefined],
    ['con formato inválido', '2026-9-1', day(20)],
    ['con desde igual a hasta', day(10), day(10)],
    ['con desde posterior a hasta', day(20), day(10)],
  ])('un rango inválido %s responde 422', async (_label, desde, hasta) => {
    const res = await consultarAutenticado(desde, hasta);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('sin token responde 401', async () => {
    const res = await request(app)
      .get('/api/v1/reservations/calendar')
      .query({ desde: day(10), hasta: day(20) });

    expect(res.status).toBe(401);
  });
});
