const prisma = require('../lib/prisma');

const chargeInclude = {
  extra: true,
  registradoPor: { select: { id: true, username: true, rol: true } },
  anuladoPor: { select: { id: true, username: true, rol: true } },
};

function findByCodigo(codigo) {
  return prisma.hotelExtra.findUnique({ where: { codigo } });
}

function findById(id) {
  return prisma.hotelExtra.findUnique({ where: { id } });
}

function findMany({ categoria, activo, page = 1, pageSize = 10 } = {}, { soloActivos = false } = {}) {
  const where = {
    categoria: categoria || undefined,
    activo: soloActivos ? true : activo,
  };

  return prisma
    .$transaction([
      prisma.hotelExtra.count({ where }),
      prisma.hotelExtra.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    .then(([total, items]) => [total, items]);
}

function create(data) {
  return prisma.hotelExtra.create({ data });
}

function update(id, data) {
  return prisma.hotelExtra.update({ where: { id }, data });
}

function deactivate(id) {
  return prisma.hotelExtra.update({ where: { id }, data: { activo: false } });
}

function findManyByIds(ids) {
  return prisma.hotelExtra.findMany({ where: { id: { in: ids } } });
}

function createCharge(data) {
  return prisma.extraCharge.create({ data, include: chargeInclude });
}

function findChargeById(id) {
  return prisma.extraCharge.findUnique({ where: { id }, include: chargeInclude });
}

function findChargesByReservation(reservationId) {
  return prisma.extraCharge.findMany({
    where: { reservationId },
    include: chargeInclude,
    orderBy: { id: 'asc' },
  });
}

function cancelCharge(id, { anuladoPorId, anuladoEn }) {
  return prisma.extraCharge.update({
    where: { id },
    data: { estado: 'CANCELADO', anuladoPorId, anuladoEn },
    include: chargeInclude,
  });
}

function sumCharges(reservationId) {
  return prisma.extraCharge.aggregate({
    where: { reservationId, estado: { not: 'CANCELADO' } },
    _sum: { importe: true },
    _count: { _all: true },
  });
}

function consumoAgrupado(desde, hasta) {
  return prisma.extraCharge.groupBy({
    by: ['extraId'],
    where: {
      estado: { not: 'CANCELADO' },
      creadoEn: { gte: desde, lt: hasta },
    },
    _sum: { importe: true, cantidad: true },
  });
}

module.exports = {
  findByCodigo,
  findById,
  findMany,
  create,
  update,
  deactivate,
  findManyByIds,
  createCharge,
  findChargeById,
  findChargesByReservation,
  cancelCharge,
  sumCharges,
  consumoAgrupado,
};
