const prisma = require('../lib/prisma');

function client(tx) {
  return tx || prisma;
}

function create(data, tx) {
  return client(tx).housekeepingTask.create({ data });
}

function findById(id, tx) {
  return client(tx).housekeepingTask.findUnique({ where: { id } });
}

function findMany({ estado, tipo, roomId, asignadoAId, fecha, page = 1, pageSize = 10 }) {
  const where = {
    estado,
    tipo,
    roomId,
    asignadoAId,
    fechaProgramada: fecha
      ? {
          gte: new Date(fecha + 'T00:00:00.000Z'),
          lt: new Date(fecha + 'T23:59:59.999Z'),
        }
      : undefined,
  };

  return prisma.$transaction([
      prisma.housekeepingTask.count({ where }),
      prisma.housekeepingTask.findMany({
        where,
        include: { asignadoA: true, room: true },
        orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
}

function update(id, data, tx) {
  return client(tx).housekeepingTask.update({ where: { id }, data });
}

function findLatestNonCanceled(roomId, tx) {
  return client(tx).housekeepingTask.findFirst({
    where: { roomId, estado: { not: 'CANCELADA' } },
    orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
  });
}

function findPendingOrInProgressInspection(roomId, tx) {
  return client(tx).housekeepingTask.findFirst({
    where: { roomId, tipo: 'INSPECCION', estado: { in: ['PENDIENTE', 'EN_INSPECCION'] } },
    orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
  });
}

function countByEstado({ fecha } = {}) {
  const where = {
    fechaProgramada: fecha
      ? {
          gte: new Date(fecha + 'T00:00:00.000Z'),
          lt: new Date(fecha + 'T23:59:59.999Z'),
        }
      : undefined,
  };
  return prisma.housekeepingTask.groupBy({ by: ['estado'], _count: true, where });
}

function countByAsignado({ fecha } = {}) {
  const where = {
    fechaProgramada: fecha
      ? {
          gte: new Date(fecha + 'T00:00:00.000Z'),
          lt: new Date(fecha + 'T23:59:59.999Z'),
        }
      : undefined,
  };
  return prisma.housekeepingTask.groupBy({
    by: ['asignadoAId'],
    _count: true,
    where: { ...where, asignadoAId: { not: null } },
  });
}

function findByRoomId(roomId) {
  return prisma.housekeepingTask.findMany({
    where: { roomId },
    orderBy: [{ actualizadoEn: 'desc' }, { id: 'desc' }],
  });
}

module.exports = {
  create,
  findById,
  findMany,
  update,
  findLatestNonCanceled,
  findPendingOrInProgressInspection,
  countByEstado,
  countByAsignado,
  findByRoomId,
};
