const prisma = require('../lib/prisma');

function findReservasEnRango({ checkIn, checkOut, estados }) {
  return prisma.reservation.findMany({
    where: {
      estado: { in: estados },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    select: { id: true, roomId: true, checkIn: true, checkOut: true },
  });
}

function countHabitaciones() {
  return prisma.room.count();
}

function findHabitaciones() {
  return prisma.room.findMany({ select: { id: true, numero: true, tipo: true } });
}

function sumPagosEnRango({ desde, hasta }) {
  return prisma.payment.aggregate({
    where: { pagadoEn: { gte: desde, lt: hasta } },
    _sum: { monto: true },
    _count: true,
  });
}

function groupPagosPorMetodo({ desde, hasta }) {
  return prisma.payment.groupBy({
    by: ['metodo'],
    where: { pagadoEn: { gte: desde, lt: hasta } },
    _sum: { monto: true },
    _count: true,
    orderBy: { metodo: 'asc' },
  });
}

module.exports = {
  countHabitaciones,
  findHabitaciones,
  findReservasEnRango,
  groupPagosPorMetodo,
  sumPagosEnRango,
};
