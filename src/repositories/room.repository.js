const prisma = require('../lib/prisma');
const { toPersistence, fromPersistence } = require('../lib/roomMapper');
const { estadoMantenimiento } = require('../schemas/room.schema');
const resRepo = require('./reservation.repository');

function create(data) {
  return prisma.room.create({ data: toPersistence(data) }).then((room) => fromPersistence(room));
}

function findById(id) {
  return prisma.room.findUnique({ where: { id } }).then((room) => fromPersistence(room));
}

function findByNumero(numero) {
  return prisma.room.findUnique({ where: { numero } }).then((room) => fromPersistence(room));
}

function findOperative({ tipo, capacidadMin } = {}) {
  return prisma.room
    .findMany({
      where: {
        tipo,
        capacidad: capacidadMin === undefined ? undefined : { gte: capacidadMin },
        estado: { not: estadoMantenimiento },
      },
      orderBy: { numero: 'asc' },
    })
    .then((rooms) => rooms.map(fromPersistence));
}

function buildWhere({ tipo, estado, tarifaMin, tarifaMax, notMantenimiento, excludeRoomIds }) {
  const where = {
    tipo,
    tarifa:
      tarifaMin === undefined && tarifaMax === undefined
        ? undefined
        : { gte: tarifaMin, lte: tarifaMax },
    id: excludeRoomIds === undefined ? undefined : { notIn: excludeRoomIds },
  };

  if (notMantenimiento && estado) {
    where.AND = [{ estado: { not: estadoMantenimiento } }, { estado }];
  } else {
    where.estado = notMantenimiento ? { not: estadoMantenimiento } : estado;
  }

  return where;
}

function findMany(params = {}) {
  const { page = 1, pageSize = 10 } = params;
  const where = buildWhere(params);

  return prisma
    .$transaction([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        orderBy: { numero: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    .then(([total, rooms]) => [total, rooms.map(fromPersistence)]);
}

function findAvailableByRange({ checkIn, checkOut, ...params }) {
  return resRepo
    .findBookedRoomIds({ checkIn, checkOut })
    .then((excludeRoomIds) => findMany({ ...params, notMantenimiento: true, excludeRoomIds }));
}

function update(id, data) {
  return prisma.room
    .update({ where: { id }, data: toPersistence(data) })
    .then((room) => fromPersistence(room));
}

function remove(id) {
  return prisma.room.delete({ where: { id } });
}

module.exports = {
  create,
  findById,
  findByNumero,
  findOperative,
  findMany,
  findAvailableByRange,
  update,
  remove,
};
