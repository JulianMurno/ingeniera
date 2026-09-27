const rateRepo = require('../repositories/rate.repository');
const { HttpError } = require('../lib/httpError');
const { calculateNights, listNights, toDate } = require('./business.service');

const ORIGEN_SEMANA = 'WEEKDAY';
const ORIGEN_TEMPORADA = 'SEASON';
const ORIGEN_BASE = 'BASE';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function resolveTarifaNoche({ tarifaSemana, tarifaTemporada, tarifaBase }) {
  if (tarifaSemana !== undefined && tarifaSemana !== null) {
    return { tarifa: tarifaSemana, origen: ORIGEN_SEMANA };
  }
  if (tarifaTemporada !== undefined && tarifaTemporada !== null) {
    return { tarifa: tarifaTemporada, origen: ORIGEN_TEMPORADA };
  }
  return { tarifa: tarifaBase, origen: ORIGEN_BASE };
}

async function getTarifaBase(roomType) {
  const room = await rateRepo.findTarifaBase(roomType);
  if (!room) {
    throw new HttpError(422, 'VALIDATION_ERROR', `No hay habitaciones del tipo ${roomType}`);
  }
  return room.tarifa;
}

async function getTarifaNoche(roomType, fecha, tarifaBase) {
  const date = toDate(fecha);
  const [weekday, season] = await Promise.all([
    rateRepo.findWeekdayRate(roomType, date.getUTCDay()),
    rateRepo.findSeasonForDate(roomType, date),
  ]);

  return resolveTarifaNoche({
    tarifaSemana: weekday?.tarifa,
    tarifaTemporada: season?.tarifa,
    tarifaBase: tarifaBase === undefined ? await getTarifaBase(roomType) : tarifaBase,
  }).tarifa;
}

async function getDetalleTarifas({ roomType, checkIn, checkOut, tarifaBase }) {
  const noches = calculateNights(checkIn, checkOut);
  const fechas = listNights(checkIn, checkOut);
  const [weekdays, seasons] = await Promise.all([
    rateRepo.findWeekdayRates({ roomType }),
    rateRepo.findSeasons({ roomType }),
  ]);
  const base = tarifaBase === undefined ? await getTarifaBase(roomType) : tarifaBase;

  const detalle = fechas.map((fecha) => {
    const diaSemana = fecha.getUTCDay();
    const weekday = weekdays.find((row) => row.diaSemana === diaSemana);
    const season = seasons.find((row) => row.fechaInicio <= fecha && row.fechaFin > fecha);
    const { tarifa, origen } = resolveTarifaNoche({
      tarifaSemana: weekday?.tarifa,
      tarifaTemporada: season?.tarifa,
      tarifaBase: base,
    });

    return {
      fecha: fecha.toISOString().slice(0, 10),
      diaSemana,
      dia: DIAS_SEMANA[diaSemana],
      tarifa,
      origen,
    };
  });

  return {
    roomType,
    checkIn: toDate(checkIn).toISOString().slice(0, 10),
    checkOut: toDate(checkOut).toISOString().slice(0, 10),
    noches,
    tarifaBase: base,
    total: detalle.reduce((acc, night) => acc + night.tarifa, 0),
    detalle,
  };
}

async function createSeason(data) {
  const fechaInicio = toDate(data.fechaInicio);
  const fechaFin = toDate(data.fechaFin);
  if (fechaInicio >= fechaFin) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      'La temporada es inválida (fechaInicio debe ser anterior a fechaFin)',
    );
  }

  const overlapping = await rateRepo.findOverlappingSeasons({
    roomType: data.roomType,
    fechaInicio,
    fechaFin,
  });
  if (overlapping.length > 0) {
    throw new HttpError(
      409,
      'CONFLICT',
      `La temporada se superpone con otra del tipo ${data.roomType}`,
    );
  }

  return rateRepo.createSeason({ ...data, fechaInicio, fechaFin });
}

async function listSeasons(filters) {
  return rateRepo.findSeasons(filters);
}

async function deleteSeason(id) {
  if (!(await rateRepo.findSeasonById(id))) {
    throw new HttpError(404, 'NOT_FOUND', 'Temporada no encontrada');
  }
  return rateRepo.removeSeason(id);
}

async function createWeekdayRate(data) {
  const existing = await rateRepo.findWeekdayRate(data.roomType, data.diaSemana);
  if (existing) {
    throw new HttpError(
      409,
      'CONFLICT',
      `Ya existe una tarifa para el día ${data.diaSemana} del tipo ${data.roomType}`,
    );
  }
  return rateRepo.createWeekdayRate(data);
}

async function listWeekdayRates(filters) {
  return rateRepo.findWeekdayRates(filters);
}

async function deleteWeekdayRate(id) {
  if (!(await rateRepo.findWeekdayRateById(id))) {
    throw new HttpError(404, 'NOT_FOUND', 'Tarifa por día de semana no encontrada');
  }
  return rateRepo.removeWeekdayRate(id);
}

module.exports = {
  ORIGEN_BASE,
  ORIGEN_SEMANA,
  ORIGEN_TEMPORADA,
  createSeason,
  createWeekdayRate,
  deleteSeason,
  deleteWeekdayRate,
  getDetalleTarifas,
  getTarifaBase,
  getTarifaNoche,
  listSeasons,
  listWeekdayRates,
  resolveTarifaNoche,
};
