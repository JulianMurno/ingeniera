jest.mock('../../src/lib/prisma', () => ({
  $transaction: jest.fn(),
  reservation: { findUnique: jest.fn() },
}));
jest.mock('../../src/repositories/room.repository');
jest.mock('../../src/repositories/guest.repository');
jest.mock('../../src/repositories/reservation.repository');
jest.mock('../../src/services/rate.service');
jest.mock('../../src/services/notifications.service');
jest.mock('../../src/services/payment.service');
jest.mock('../../src/lib/audit', () => ({
  audit: jest.fn(),
  ACCIONES: { CREAR: 'CREAR', MODIFICAR: 'MODIFICAR', CANCELAR: 'CANCELAR' },
  RECURSOS: { RESERVA: 'RESERVA' },
}));

const prisma = require('../../src/lib/prisma');
const roomRepo = require('../../src/repositories/room.repository');
const guestRepo = require('../../src/repositories/guest.repository');
const resRepo = require('../../src/repositories/reservation.repository');
const rateService = require('../../src/services/rate.service');
const notifications = require('../../src/services/notifications.service');
const paymentService = require('../../src/services/payment.service');
const reservationService = require('../../src/services/reservation.service');

const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const reservationData = () => ({
  roomId: 1,
  checkIn: futureDate(10),
  checkOut: futureDate(12),
  adultos: 1,
  menores: 0,
});

const reservationRecord = (overrides = {}) => ({
  id: 50,
  codigo: 'ABC123',
  estado: 'CONFIRMADA',
  total: 200,
  checkIn: new Date(`${reservationData().checkIn}T00:00:00.000Z`),
  checkOut: new Date(`${reservationData().checkOut}T00:00:00.000Z`),
  roomId: 1,
  guestId: 7,
  room: { numero: '101' },
  guest: { email: 'ana@example.com', nombre: 'Ana' },
  ...overrides,
});

describe('derivación de guestId en reservas de huésped', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback({ tx: true }));
    prisma.reservation.findUnique.mockResolvedValue(null);
    roomRepo.findById.mockResolvedValue({
      id: 1,
      numero: '101',
      tipo: 'DOBLE',
      capacidad: 2,
      tarifa: 100,
      estado: 'DISPONIBLE',
    });
    guestRepo.findActiveById.mockResolvedValue({ id: 7 });
    resRepo.findCandidatesInWindow.mockResolvedValue([]);
    resRepo.create.mockResolvedValue(reservationRecord());
    rateService.getDetalleTarifas.mockResolvedValue({ total: 200 });
    notifications.sendEmail.mockResolvedValue(undefined);
    paymentService.loadPaymentState.mockImplementation(async (reservation) => reservation);
  });

  test.each([
    ['sin rol de huésped', { rol: 'RECEPCIONISTA' }],
    ['huésped sin guestId', { rol: 'HUESPED' }],
    ['huésped con guestId nulo', { rol: 'HUESPED', guestId: null }],
  ])('rechaza %s con 403', async (_label, actor) => {
    await expect(
      reservationService.createGuestReservation(reservationData(), actor),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(resRepo.create).not.toHaveBeenCalled();
  });

  test('rechaza reservar para otro huésped con 403', async () => {
    await expect(
      reservationService.createGuestReservation(
        { ...reservationData(), guestId: 9 },
        { rol: 'HUESPED', guestId: 7 },
      ),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(roomRepo.findById).not.toHaveBeenCalled();
    expect(resRepo.create).not.toHaveBeenCalled();
  });

  test('inyecta el guestId del token aunque el cuerpo no lo envíe', async () => {
    await reservationService.createGuestReservation(reservationData(), {
      rol: 'HUESPED',
      guestId: 7,
    });

    expect(resRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: 7 }),
      { tx: true },
    );
  });

  test('acepta el guestId propio enviado en el cuerpo', async () => {
    await reservationService.createGuestReservation(
      { ...reservationData(), guestId: 7 },
      { rol: 'HUESPED', guestId: 7 },
    );

    expect(resRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: 7 }),
      { tx: true },
    );
  });

  test('lista solo las reservas del huésped autenticado', async () => {
    resRepo.findMany.mockResolvedValue([reservationRecord()]);

    await reservationService.listGuestReservations(7, { page: 2 });

    expect(resRepo.findMany).toHaveBeenCalledWith({ page: 2, guestId: 7 });
  });

  test('devuelve la reserva propia del huésped', async () => {
    resRepo.findById.mockResolvedValue(reservationRecord());

    await expect(reservationService.getGuestReservation(7, 50)).resolves.toMatchObject({
      id: 50,
      guestId: 7,
    });
  });

  test('oculta con 404 la reserva de otro huésped', async () => {
    resRepo.findById.mockResolvedValue(reservationRecord({ guestId: 9 }));

    await expect(reservationService.getGuestReservation(7, 50)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  test('no cancela la reserva de otro huésped', async () => {
    resRepo.findById.mockResolvedValue(reservationRecord({ guestId: 9 }));

    await expect(
      reservationService.cancelGuestReservation(7, 50, { motivo: 'x' }, {
        rol: 'HUESPED',
        guestId: 7,
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(resRepo.update).not.toHaveBeenCalled();
  });
});
