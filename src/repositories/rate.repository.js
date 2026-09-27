const prisma = require('../lib/prisma');
const { toDate } = require('../services/business.service');

function createSeason(data) {
  return prisma.season.create({
    data: {
      roomType: data.roomType,
      fechaInicio: toDate(data.fechaInicio),
      fechaFin: toDate(data.fechaFin),
      tarifa: data.tarifa,
    },
  });
}

function findSeasonById(id) {
  return prisma.season.findUnique({ where: { id } });
}

function findSeasons({ roomType } = {}) {
  return prisma.season.findMany({
    where: { roomType },
    orderBy: [{ roomType: 'asc' }, { fechaInicio: 'asc' }],
  });
}

function findSeasonForDate(roomType, date) {
  return prisma.season.findFirst({
    where: {
      roomType,
      fechaInicio: { lte: date },
      fechaFin: { gt: date },
    },
    orderBy: { fechaInicio: 'desc' },
  });
}

function findOverlappingSeasons({ roomType, fechaInicio, fechaFin, excludeId }) {
  return prisma.season.findMany({
    where: {
      roomType,
      id: excludeId === undefined ? undefined : { not: excludeId },
      fechaInicio: { lt: fechaFin },
      fechaFin: { gt: fechaInicio },
    },
  });
}

function removeSeason(id) {
  return prisma.season.delete({ where: { id } });
}

function createWeekdayRate(data) {
  return prisma.weekdayRate.create({
    data: {
      roomType: data.roomType,
      diaSemana: data.diaSemana,
      tarifa: data.tarifa,
    },
  });
}

function findWeekdayRateById(id) {
  return prisma.weekdayRate.findUnique({ where: { id } });
}

function findWeekdayRate(roomType, diaSemana) {
  return prisma.weekdayRate.findUnique({
    where: { roomType_diaSemana: { roomType, diaSemana } },
  });
}

function findWeekdayRates({ roomType } = {}) {
  return prisma.weekdayRate.findMany({
    where: { roomType },
    orderBy: [{ roomType: 'asc' }, { diaSemana: 'asc' }],
  });
}

function removeWeekdayRate(id) {
  return prisma.weekdayRate.delete({ where: { id } });
}

function findTarifaBase(roomType) {
  return prisma.room.findFirst({
    where: { tipo: roomType },
    orderBy: { tarifa: 'asc' },
    select: { tarifa: true },
  });
}

module.exports = {
  createSeason,
  createWeekdayRate,
  findOverlappingSeasons,
  findSeasonById,
  findSeasonForDate,
  findSeasons,
  findTarifaBase,
  findWeekdayRate,
  findWeekdayRateById,
  findWeekdayRates,
  removeSeason,
  removeWeekdayRate,
};
