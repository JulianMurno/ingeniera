const { HttpError } = require('../lib/httpError');
const {
  assertStayWithinLimits,
  atMinutes,
  endOfDay,
  getCheckInHour,
  getCheckOutHour,
  startOfDay,
} = require('../config/availabilityRules');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDate(value) {
  if (value instanceof Date) return value;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Fecha inválida');
  }
  return date;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function calculateNights(checkIn, checkOut) {
  const start = toDate(checkIn);
  const end = toDate(checkOut);
  const nights = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (!Number.isInteger(nights) || nights < 1) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      'El rango de fechas es inválido (checkIn debe ser anterior a checkOut)',
    );
  }
  return assertStayWithinLimits(nights);
}

function listNights(checkIn, checkOut) {
  const start = toDate(checkIn);
  const end = toDate(checkOut);
  const nights = [];
  for (let cursor = start; cursor.getTime() < end.getTime(); cursor = addDays(cursor, 1)) {
    nights.push(new Date(cursor.getTime()));
  }
  return nights;
}

function calculateTotal(nights, nightlyRate) {
  return nights * nightlyRate;
}

function calculateTotalFromNights(nights) {
  return nights.reduce((acc, night) => acc + night.tarifa, 0);
}

function arrivalMoment(checkIn, { earlyCheckIn = false } = {}) {
  const start = toDate(checkIn);
  return earlyCheckIn ? startOfDay(start) : atMinutes(start, getCheckInHour());
}

function departureMoment(checkOut, { lateCheckOut = false } = {}) {
  const end = toDate(checkOut);
  return lateCheckOut ? endOfDay(end) : atMinutes(end, getCheckOutHour());
}

function overlaps(aCheckIn, aCheckOut, bCheckIn, bCheckOut, options = {}) {
  const aStart = arrivalMoment(aCheckIn, options.a).getTime();
  const aEnd = departureMoment(aCheckOut, options.a).getTime();
  const bStart = arrivalMoment(bCheckIn, options.b).getTime();
  const bEnd = departureMoment(bCheckOut, options.b).getTime();
  return aStart < bEnd && bStart < aEnd;
}

function buildStay({ checkIn, checkOut, earlyCheckIn, lateCheckOut }) {
  return {
    checkIn: toDate(checkIn),
    checkOut: toDate(checkOut),
    earlyCheckIn: earlyCheckIn === true,
    lateCheckOut: lateCheckOut === true,
  };
}

function stayOverlaps(stay, other) {
  return overlaps(stay.checkIn, stay.checkOut, other.checkIn, other.checkOut, {
    a: { earlyCheckIn: stay.earlyCheckIn, lateCheckOut: stay.lateCheckOut },
    b: { earlyCheckIn: other.earlyCheckIn, lateCheckOut: other.lateCheckOut },
  });
}

function searchWindow({ checkIn, checkOut }) {
  const start = toDate(checkIn);
  const end = toDate(checkOut);
  return {
    desde: startOfDay(start),
    hasta: addDays(end, 1),
  };
}

module.exports = {
  addDays,
  arrivalMoment,
  buildStay,
  calculateNights,
  calculateTotal,
  calculateTotalFromNights,
  departureMoment,
  listNights,
  overlaps,
  searchWindow,
  stayOverlaps,
  toDate,
};
