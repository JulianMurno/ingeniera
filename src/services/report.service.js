const reportRepo = require('../repositories/report.repository');
const { CONFIRMADA, EN_CURSO, FINALIZADA } = require('../lib/reservationState');
const { HttpError } = require('../lib/httpError');
const { addDays, toDate } = require('./business.service');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Los reportes cuentan reservas vigentes: las canceladas y los NO_SHOW no
// ocupan ni generan reservas por tipo (tolerancia al ciclo de vida).
const ESTADOS_VIGENTES = [CONFIRMADA, EN_CURSO, FINALIZADA];

function nightsInRange(desde, hasta) {
  const noches = (hasta.getTime() - desde.getTime()) / MS_PER_DAY;
  if (!Number.isInteger(noches) || noches < 1) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      'El rango de fechas es inválido (checkIn debe ser anterior a checkOut)',
    );
  }
  return noches;
}

function overlapNights(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  return end > start ? (end - start) / MS_PER_DAY : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

async function ocupacion({ checkIn, checkOut }) {
  const desde = toDate(checkIn);
  const hasta = toDate(checkOut);
  const noches = nightsInRange(desde, hasta);

  const [reservas, habitaciones] = await Promise.all([
    reportRepo.findReservasEnRango({ checkIn: desde, checkOut: hasta, estados: ESTADOS_VIGENTES }),
    reportRepo.countHabitaciones(),
  ]);

  const nochesOcupadas = reservas.reduce(
    (acc, reserva) => acc + overlapNights(reserva.checkIn, reserva.checkOut, desde, hasta),
    0,
  );
  const nochesTotales = habitaciones * noches;

  return {
    checkIn,
    checkOut,
    habitaciones,
    noches,
    nochesOcupadas,
    nochesDisponibles: Math.max(nochesTotales - nochesOcupadas, 0),
    porcentajeOcupacion: nochesTotales > 0 ? round2((nochesOcupadas / nochesTotales) * 100) : 0,
  };
}

async function ingresos({ checkIn, checkOut }) {
  const desde = toDate(checkIn);
  const hasta = addDays(toDate(checkOut), 1);
  nightsInRange(desde, hasta);

  const [total, porMetodo] = await Promise.all([
    reportRepo.sumPagosEnRango({ desde, hasta }),
    reportRepo.groupPagosPorMetodo({ desde, hasta }),
  ]);

  return {
    checkIn,
    checkOut,
    total: total._sum.monto ?? 0,
    cantidadPagos: total._count,
    porMetodo: porMetodo.map((grupo) => ({
      metodo: grupo.metodo,
      cantidad: grupo._count,
      total: grupo._sum.monto ?? 0,
    })),
  };
}

async function reservasPorTipo({ checkIn, checkOut }) {
  const desde = toDate(checkIn);
  const hasta = toDate(checkOut);
  const noches = nightsInRange(desde, hasta);

  const [reservas, habitaciones] = await Promise.all([
    reportRepo.findReservasEnRango({ checkIn: desde, checkOut: hasta, estados: ESTADOS_VIGENTES }),
    reportRepo.findHabitaciones(),
  ]);

  const tipoPorRoom = new Map(habitaciones.map((habitacion) => [habitacion.id, habitacion.tipo]));
  const conteo = new Map();
  const totalPorTipo = new Map();

  for (const habitacion of habitaciones) {
    const tipo = habitacion.tipo;
    conteo.set(tipo, conteo.get(tipo) || 0);
    totalPorTipo.set(tipo, (totalPorTipo.get(tipo) || 0) + 1);
  }

  for (const reserva of reservas) {
    const tipo = tipoPorRoom.get(reserva.roomId) || 'DESCONOCIDO';
    conteo.set(tipo, (conteo.get(tipo) || 0) + 1);
  }

  const porTipo = [...conteo.entries()]
    .map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      habitaciones: totalPorTipo.get(tipo) || 0,
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.tipo.localeCompare(b.tipo));

  return {
    checkIn,
    checkOut,
    noches,
    totalReservas: reservas.length,
    porTipo,
  };
}

module.exports = { ESTADOS_VIGENTES, ingresos, ocupacion, reservasPorTipo };
