const roomRepo = require('../repositories/room.repository');
const resRepo = require('../repositories/reservation.repository');
const { buildStay, calculateNights, stayOverlaps } = require('../services/business.service');

async function getAvailableRooms(params) {
  const stay = buildStay(params);
  calculateNights(stay.checkIn, stay.checkOut);

  const candidates = await resRepo.findCandidatesInWindow(stay);
  const busyRoomIds = new Set(
    candidates.filter((row) => stayOverlaps(stay, row)).map((row) => row.roomId),
  );

  const rooms = await roomRepo.findOperative({
    tipo: params.type,
    capacidadMin: params.ocupantes,
  });

  return rooms.filter((room) => !busyRoomIds.has(room.id));
}

module.exports = { getAvailableRooms };
