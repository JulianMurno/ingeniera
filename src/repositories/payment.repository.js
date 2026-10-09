const prisma = require('../lib/prisma');

function create(data) {
  return prisma.payment.create({ data });
}

function findByReservation(reservationId) {
  return prisma.payment.findMany({
    where: { reservationId },
    orderBy: [{ pagadoEn: 'asc' }, { id: 'asc' }],
  });
}

function sumByReservation(reservationId) {
  return prisma.payment.aggregate({
    where: { reservationId },
    _sum: { monto: true },
    _count: true,
  });
}

module.exports = { create, findByReservation, sumByReservation };
