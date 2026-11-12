const prisma = require('../lib/prisma');
const { fromPersistence } = require('../lib/roomMapper');
const { searchWindow, toDate } = require('../services/business.service');
const { CONFIRMADA, EN_CURSO, FINALIZADA } = require('../lib/reservationState');

// Estados que ocupan noches en el calendario: CANCELADA y NO_SHOW liberan el rango.
const ESTADOS_CALENDARIO = [CONFIRMADA, EN_CURSO, FINALIZADA];

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

function findCandidatesInWindow({ checkIn, checkOut, roomId, excludeId, tx }) {
  const { desde, hasta } = searchWindow({ checkIn, checkOut });

  return client(tx).reservation.findMany({
    where: {
      roomId,
      estado: 'CONFIRMADA',
      id: excludeId === undefined ? undefined : { not: excludeId },
      checkIn: { lt: hasta },
      checkOut: { gte: desde },
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

function findCalendarRange({ desde, hasta }) {
  return prisma.reservation.findMany({
    where: {
      estado: { in: ESTADOS_CALENDARIO },
      checkIn: { lt: toDate(hasta) },
      checkOut: { gt: toDate(desde) },
    },
    select: {
      id: true,
      roomId: true,
      codigo: true,
      checkIn: true,
      checkOut: true,
      estado: true,
      guest: { select: { nombre: true } },
    },
    orderBy: [{ roomId: 'asc' }, { checkIn: 'asc' }],
  });
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

  return prisma
    .$transaction([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        include: { guest: true, room: true },
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    .then(([total, rows]) => [total, rows.map(withRoom)]);
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
  findCandidatesInWindow,
  findBookedRoomIds,
  findCalendarRange,
  findMany,
  update,
  setEstado,
};
