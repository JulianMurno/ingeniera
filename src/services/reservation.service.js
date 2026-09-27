const prisma = require('../lib/prisma');
const roomRepo = require('../repositories/room.repository');
const guestRepo = require('../repositories/guest.repository');
const resRepo = require('../repositories/reservation.repository');
const rateService = require('./rate.service');
const { buildStay, calculateNights, stayOverlaps, toDate } = require('./business.service');
const { estadoMantenimiento } = require('../schemas/room.schema');
const { HttpError } = require('../lib/httpError');

async function ensureResourceExists(guestId, roomId) {
  const room = await roomRepo.findById(roomId);
  if (!room) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'La habitación no existe');
  }
  if (room.estado === estadoMantenimiento) {
    throw new HttpError(
      409,
      'CONFLICT',
      'La habitación está en mantenimiento y no admite reservas',
    );
  }
  if (guestId) {
    const guest = await guestRepo.findById(guestId);
    if (!guest) {
      throw new HttpError(422, 'VALIDATION_ERROR', 'El huésped no existe');
    }
  }
  return room;
}

async function createReservation(data) {
  const room = await ensureResourceExists(data.guestId, data.roomId);
  const stay = buildStay(data);
  const nights = calculateNights(stay.checkIn, stay.checkOut);

  return prisma.$transaction(async (tx) => {
    const candidates = await resRepo.findCandidatesInWindow({ ...stay, roomId: room.id, tx });
    if (candidates.some((row) => stayOverlaps(stay, row))) {
      throw new HttpError(
        409,
        'CONFLICT',
        'La habitación no está disponible para el rango solicitado',
      );
    }
    const { total } = await rateService.getDetalleTarifas({
      roomType: room.tipo,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      tarifaBase: room.tarifa,
    });
    return resRepo.create(
      {
        guestId: data.guestId,
        roomId: room.id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        noches: nights,
        total,
        estado: 'CONFIRMADA',
        earlyCheckIn: stay.earlyCheckIn,
        lateCheckOut: stay.lateCheckOut,
      },
      tx,
    );
  });
}

async function listReservations(params) {
  return resRepo.findMany(params);
}

async function getReservation(id) {
  const reservation = await resRepo.findById(id);
  if (!reservation) {
    throw new HttpError(404, 'NOT_FOUND', 'Reserva no encontrada');
  }
  return reservation;
}

async function updateReservation(id, data) {
  const existing = await getReservation(id);

  const roomId = data.roomId ?? existing.roomId;
  const guestId = data.guestId ?? existing.guestId;
  const room = await ensureResourceExists(guestId, roomId);
  const stay = buildStay({
    checkIn: data.checkIn ? toDate(data.checkIn) : existing.checkIn,
    checkOut: data.checkOut ? toDate(data.checkOut) : existing.checkOut,
    earlyCheckIn: data.earlyCheckIn ?? existing.earlyCheckIn,
    lateCheckOut: data.lateCheckOut ?? existing.lateCheckOut,
  });
  const nights = calculateNights(stay.checkIn, stay.checkOut);

  return prisma.$transaction(async (tx) => {
    const candidates = await resRepo.findCandidatesInWindow({
      ...stay,
      roomId,
      excludeId: id,
      tx,
    });
    if (candidates.some((row) => stayOverlaps(stay, row))) {
      throw new HttpError(409, 'CONFLICT', 'La habitación no está disponible para el nuevo rango');
    }
    const { total } = await rateService.getDetalleTarifas({
      roomType: room.tipo,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      tarifaBase: room.tarifa,
    });
    return resRepo.update(
      id,
      {
        guestId,
        roomId,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        noches: nights,
        total,
        earlyCheckIn: stay.earlyCheckIn,
        lateCheckOut: stay.lateCheckOut,
      },
      tx,
    );
  });
}

async function cancelReservation(id) {
  await getReservation(id);
  return resRepo.setEstado(id, 'CANCELADA');
}

module.exports = {
  createReservation,
  listReservations,
  getReservation,
  updateReservation,
  cancelReservation,
};
