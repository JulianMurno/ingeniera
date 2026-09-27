const { HttpError } = require('../lib/httpError');

const DEFAULTS = {
  MIN_STAY_NIGHTS: 1,
  MAX_STAY_NIGHTS: 30,
  MIN_ADVANCE_NIGHTS: 0,
  CHECK_IN_HOUR: '15:00',
  CHECK_OUT_HOUR: '11:00',
};

const MINUTES_PER_HOUR = 60;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function readEnv(name) {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? DEFAULTS[name] : raw;
}

function readIntEnv(name) {
  const parsed = Number.parseInt(readEnv(name), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.parseInt(DEFAULTS[name], 10);
}

function readNonNegativeIntEnv(name) {
  const parsed = Number.parseInt(readEnv(name), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.parseInt(DEFAULTS[name], 10);
}

function parseMinutes(value) {
  const match = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(String(value).trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * MINUTES_PER_HOUR + minutes;
}

function readMinutesEnv(name) {
  const parsed = parseMinutes(readEnv(name));
  return parsed === null ? parseMinutes(DEFAULTS[name]) : parsed;
}

function getMinStayNights() {
  return readIntEnv('MIN_STAY_NIGHTS');
}

function getMaxStayNights() {
  return readIntEnv('MAX_STAY_NIGHTS');
}

function getMinAdvanceNights() {
  return readNonNegativeIntEnv('MIN_ADVANCE_NIGHTS');
}

function getCheckInHour() {
  return readMinutesEnv('CHECK_IN_HOUR');
}

function getCheckOutHour() {
  return readMinutesEnv('CHECK_OUT_HOUR');
}

function assertStayWithinLimits(nights) {
  const min = getMinStayNights();
  const max = getMaxStayNights();

  if (nights < min) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      `La estancia mínima es de ${min} noche(s) y el rango solicitado tiene ${nights}`,
    );
  }
  if (nights > max) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      `La estancia máxima es de ${max} noche(s) y el rango solicitado tiene ${nights}`,
    );
  }
  return nights;
}

function startOfDay(date) {
  return new Date(date.getTime());
}

function endOfDay(date) {
  return new Date(date.getTime() + MS_PER_DAY - 1);
}

function atMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

module.exports = {
  DEFAULTS,
  assertStayWithinLimits,
  atMinutes,
  endOfDay,
  getCheckInHour,
  getCheckOutHour,
  getMaxStayNights,
  getMinAdvanceNights,
  getMinStayNights,
  startOfDay,
};
