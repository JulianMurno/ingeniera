const prisma = require('../lib/prisma');

function client(tx) {
  return tx || prisma;
}

function create(data, tx) {
  return client(tx).maintenanceTicket.create({ data, include: { room: true, reportadoPor: true, asignadoA: true } });
}

function findById(id, tx) {
  return client(tx).maintenanceTicket.findUnique({
    where: { id },
    include: { room: true, reportadoPor: true, asignadoA: true },
  });
}

function findMany({ estado, prioridad, roomId, tipo, page = 1, pageSize = 10 }) {
  const where = { estado, prioridad, roomId, tipo };

  return prisma.$transaction([
    prisma.maintenanceTicket.count({ where }),
    prisma.maintenanceTicket.findMany({
      where,
      include: { room: true, reportadoPor: true, asignadoA: true },
      orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
}

function update(id, data, tx) {
  return client(tx).maintenanceTicket.update({
    where: { id },
    data,
    include: { room: true, reportadoPor: true, asignadoA: true },
  });
}

function findByRoomId(roomId) {
  return prisma.maintenanceTicket.findMany({
    where: { roomId },
    orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
  });
}

function countOpenByRoomId(roomId) {
  return prisma.maintenanceTicket.count({ where: { roomId, estado: { in: ['ABIERTO', 'EN_PROCESO'] } } });
}

module.exports = {
  create,
  findById,
  findMany,
  update,
  findByRoomId,
  countOpenByRoomId,
};
