const prisma = require('../lib/prisma');
const roomRepo = require('../repositories/room.repository');
const guestRepo = require('../repositories/guest.repository');
const resRepo = require('../repositories/reservation.repository');
const { calculateNights, calculateTotal, toDate } = require('./business.service');
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
  const checkIn = toDate(data.checkIn);
  const checkOut = toDate(data.checkOut);
  const room = await ensureResourceExists(data.guestId, data.roomId);
  const nights = calculateNights(checkIn, checkOut);

  return prisma.$transaction(async (tx) => {
    const overlapping = await resRepo.findOverlapping({
      roomId: room.id,
      checkIn,
      checkOut,
      tx,
    });
    if (overlapping.length > 0) {
      throw new HttpError(
        409,
        'CONFLICT',
        'La habitación no está disponible para el rango solicitado',
      );
    }
    const total = calculateTotal(nights, room.tarifa);
    return resRepo.create(
      {
        guestId: data.guestId,
        roomId: room.id,
        checkIn,
        checkOut,
        noches: nights,
        total,
        estado: 'CONFIRMADA',
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
  const checkIn = data.checkIn ? toDate(data.checkIn) : existing.checkIn;
  const checkOut = data.checkOut ? toDate(data.checkOut) : existing.checkOut;
  const room = await ensureResourceExists(guestId, roomId);
  const nights = calculateNights(checkIn, checkOut);

  return prisma.$transaction(async (tx) => {
    const overlapping = await resRepo.findOverlapping({
      roomId,
      checkIn,
      checkOut,
      excludeId: id,
      tx,
    });
    if (overlapping.length > 0) {
      throw new HttpError(409, 'CONFLICT', 'La habitación no está disponible para el nuevo rango');
    }
    const total = calculateTotal(nights, room.tarifa);
    return resRepo.update(id, { guestId, roomId, checkIn, checkOut, noches: nights, total }, tx);
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
