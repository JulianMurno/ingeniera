const prisma = require('../lib/prisma');
const { fromPersistence } = require('../lib/roomMapper');
const { toDate } = require('../services/business.service');

function client(tx) {
  return tx || prisma;
}

function withRoom(record) {
  if (!record) return record;
  return { ...record, room: fromPersistence(record.room) };
}

function create(data, tx) {
  return client(tx)
    .reservation.create({
      data,
      include: { guest: true, room: true },
    })
    .then(withRoom);
}

function findById(id) {
  return prisma.reservation
    .findUnique({
      where: { id },
      include: { guest: true, room: true },
    })
    .then(withRoom);
}

function findOverlapping({ roomId, checkIn, checkOut, excludeId, tx }) {
  return client(tx).reservation.findMany({
    where: {
      roomId,
      estado: 'CONFIRMADA',
      id: excludeId ? { not: excludeId } : undefined,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
}

function findBookedRoomIds({ checkIn, checkOut }) {
  return prisma.reservation
    .findMany({
      where: {
        estado: 'CONFIRMADA',
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { roomId: true },
      distinct: ['roomId'],
    })
    .then((rows) => rows.map((row) => row.roomId));
}

function findMany({ dni, roomId, fecha, estado, guestId, page, pageSize }) {
  const where = {
    roomId,
    estado,
    guestId,
    guest: dni ? { dni: { contains: dni } } : undefined,
    checkIn: fecha ? { lte: toDate(fecha) } : undefined,
    checkOut: fecha ? { gt: toDate(fecha) } : undefined,
  };

  return prisma.$transaction([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: { guest: true, room: true },
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]).then(([total, rows]) => [total, rows.map(withRoom)]);
}

function update(id, data, tx) {
  return client(tx)
    .reservation.update({
      where: { id },
      data,
      include: { guest: true, room: true },
    })
    .then(withRoom);
}

function setEstado(id, estado, tx) {
  return client(tx)
    .reservation.update({
      where: { id },
      data: { estado },
      include: { guest: true, room: true },
    })
    .then(withRoom);
}

module.exports = {
  create,
  findById,
  findOverlapping,
  findBookedRoomIds,
  findMany,
  update,
  setEstado,
};
