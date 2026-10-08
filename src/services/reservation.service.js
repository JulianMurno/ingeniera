const prisma = require('../lib/prisma');
const roomRepo = require('../repositories/room.repository');
const guestRepo = require('../repositories/guest.repository');
const resRepo = require('../repositories/reservation.repository');
const rateService = require('./rate.service');
const notifications = require('./notifications.service');
const { buildStay, calculateNights, stayOverlaps, toDate, addDays } = require('./business.service');
const { getMinAdvanceNights } = require('../config/availabilityRules');
const { calculateCancellationFee } = require('../config/reservationRules');
const { generateReservationCode } = require('../lib/reservationCode');
const {
  CANCELADA,
  EN_CURSO,
  FINALIZADA,
  NO_SHOW,
  assertTransition,
} = require('../lib/reservationState');
const { estadoMantenimiento } = require('../schemas/room.schema');
const { HttpError } = require('../lib/httpError');
const { audit, ACCIONES, RECURSOS } = require('../lib/audit');
const paymentService = require('./payment.service');

const CODE_ATTEMPTS = 5;

async function ensureResourceExists(guestId, roomId) {
  const room = await roomRepo.findById(roomId);
  if (!room) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'La habitación no existe');
  }
  if (room.estado === estadoMantenimiento) {
    throw new HttpError(
      409,
      'CONFLICT',
      'La habitación está en mantenimiento y no admite reservas',
    );
  }
  if (guestId) {
    const guest = await guestRepo.findActiveById(guestId);
    if (!guest) {
      throw new HttpError(422, 'VALIDATION_ERROR', 'El huésped no existe o está archivado');
    }
  }
  return room;
}

function totalOcupantes({ adultos, menores }) {
  return (adultos || 0) + (menores || 0);
}

function assertOcupantesValidos({ adultos, menores }) {
  if (!Number.isInteger(adultos) || adultos < 1) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Debe haber al menos un adulto por reserva');
  }
  if (!Number.isInteger(menores) || menores < 0) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'La cantidad de menores no puede ser negativa');
  }
}

function assertOcupantesDentroDeCapacidad(ocupantes, room) {
  if (ocupantes > room.capacidad) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      `La habitación ${room.numero} tiene capacidad para ${room.capacidad} ocupante(s) y la reserva ` +
        `suma ${ocupantes}`,
    );
  }
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function assertRangoTemporalValido(checkIn) {
  const hoy = todayUtc();

  if (checkIn.getTime() < hoy.getTime()) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      'No se pueden crear reservas con check-in en el pasado',
    );
  }

  const minAdvance = getMinAdvanceNights();
  if (minAdvance > 0 && checkIn.getTime() < addDays(hoy, minAdvance).getTime()) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      `La reserva requiere al menos ${minAdvance} noche(s) de antelación`,
    );
  }
}

async function assertSinSobreocupacion({ room, stay, ocupantes, excludeId, tx }) {
  const candidates = await resRepo.findCandidatesInWindow({
    ...stay,
    roomId: room.id,
    excludeId,
    tx,
  });
  const solapadas = candidates.filter((row) => stayOverlaps(stay, row));
  const ocupados = solapadas.reduce((acc, row) => acc + totalOcupantes(row), 0);

  if (ocupados + ocupantes > room.capacidad) {
    throw new HttpError(
      409,
      'CONFLICT',
      'La habitación no está disponible para el rango solicitado: la ocupación superaría su ' +
        `capacidad (${room.capacidad})`,
    );
  }
}

async function generateUniqueCodigo() {
  for (let intento = 0; intento < CODE_ATTEMPTS; intento += 1) {
    const codigo = generateReservationCode();
    const existente = await prisma.reservation.findUnique({
      where: { codigo },
      select: { id: true },
    });
    if (!existente) return codigo;
  }
  throw new HttpError(500, 'INTERNAL_SERVER_ERROR', 'No se pudo generar un código de confirmación');
}

function isoDay(date) {
  return new Date(date.getTime()).toISOString().slice(0, 10);
}

function plural(noches) {
  return noches === 1 ? '1 noche' : `${noches} noches`;
}

async function notificarConfirmacion(reservation) {
  await notifications.sendEmail(
    reservation.guest.email,
    `Reserva confirmada ${reservation.codigo}`,
    `Hola ${reservation.guest.nombre}, tu reserva ${reservation.codigo} está confirmada en la ` +
      `habitación ${reservation.room.numero} del ${isoDay(reservation.checkIn)} al ` +
      `${isoDay(reservation.checkOut)} (${plural(reservation.noches)}). Total: ${reservation.total}.`,
  );
}

async function notificarCancelacion(reservation) {
  const motivo = reservation.motivoCancelacion ? ` Motivo: ${reservation.motivoCancelacion}.` : '';
  const multa =
    reservation.multaCancelacion > 0 ? ` Multa aplicada: ${reservation.multaCancelacion}.` : '';

  await notifications.sendEmail(
    reservation.guest.email,
    `Reserva cancelada ${reservation.codigo}`,
    `Hola ${reservation.guest.nombre}, tu reserva ${reservation.codigo} del ` +
      `${isoDay(reservation.checkIn)} al ${isoDay(reservation.checkOut)} en la habitación ` +
      `${reservation.room.numero} fue cancelada.${motivo}${multa}`,
  );
}

function normalizeOcupantes({ adultos, menores }, existing = {}) {
  return {
    adultos: adultos ?? existing.adultos ?? 1,
    menores: menores ?? existing.menores ?? 0,
  };
}

async function createReservation(data, actor = null) {
  const room = await ensureResourceExists(data.guestId, data.roomId);
  const stay = buildStay(data);
  const nights = calculateNights(stay.checkIn, stay.checkOut);
  const { adultos, menores } = normalizeOcupantes(data);
  const ocupantes = totalOcupantes({ adultos, menores });

  assertOcupantesValidos({ adultos, menores });
  assertOcupantesDentroDeCapacidad(ocupantes, room);
  assertRangoTemporalValido(stay.checkIn);

  const codigo = await generateUniqueCodigo();

  const reservation = await prisma.$transaction(async (tx) => {
    await assertSinSobreocupacion({ room, stay, ocupantes, tx });
    const { total } = await rateService.getDetalleTarifas({
      roomType: room.tipo,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      tarifaBase: room.tarifa,
    });
    return resRepo.create(
      {
        guestId: data.guestId,
        roomId: room.id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        noches: nights,
        total,
        estado: 'CONFIRMADA',
        adultos,
        menores,
        codigo,
        notas: data.notas ?? null,
        earlyCheckIn: stay.earlyCheckIn,
        lateCheckOut: stay.lateCheckOut,
      },
      tx,
    );
  });

  await audit({
    actor,
    accion: ACCIONES.CREAR,
    recurso: RECURSOS.RESERVA,
    recursoId: reservation.id,
    detalle: {
      codigo: reservation.codigo,
      estado: reservation.estado,
      total: reservation.total,
      checkIn: isoDay(reservation.checkIn),
      checkOut: isoDay(reservation.checkOut),
      roomId: reservation.roomId,
      guestId: reservation.guestId,
    },
  });

  await notificarConfirmacion(reservation);
  return reservation;
}

async function listReservations(params) {
  return resRepo.findMany(params);
}

async function getReservation(id) {
  const reservation = await resRepo.findById(id);
  if (!reservation) {
    throw new HttpError(404, 'NOT_FOUND', 'Reserva no encontrada');
  }
  return paymentService.loadPaymentState(reservation);
}

async function updateReservation(id, data, actor = null) {
  const existing = await getReservation(id);

  const roomId = data.roomId ?? existing.roomId;
  const guestId = data.guestId ?? existing.guestId;
  const room = await ensureResourceExists(data.guestId, roomId);
  const stay = buildStay({
    checkIn: data.checkIn ? toDate(data.checkIn) : existing.checkIn,
    checkOut: data.checkOut ? toDate(data.checkOut) : existing.checkOut,
    earlyCheckIn: data.earlyCheckIn ?? existing.earlyCheckIn,
    lateCheckOut: data.lateCheckOut ?? existing.lateCheckOut,
  });
  const nights = calculateNights(stay.checkIn, stay.checkOut);
  const { adultos, menores } = normalizeOcupantes(data, existing);
  const ocupantes = totalOcupantes({ adultos, menores });

  assertOcupantesValidos({ adultos, menores });
  assertOcupantesDentroDeCapacidad(ocupantes, room);
  assertRangoTemporalValido(stay.checkIn);

  const reservation = await prisma.$transaction(async (tx) => {
    await assertSinSobreocupacion({ room, stay, ocupantes, excludeId: id, tx });
    const { total } = await rateService.getDetalleTarifas({
      roomType: room.tipo,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      tarifaBase: room.tarifa,
    });
    return resRepo.update(
      id,
      {
        guestId,
        roomId,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        noches: nights,
        total,
        adultos,
        menores,
        notas: data.notas === undefined ? undefined : data.notas,
        earlyCheckIn: stay.earlyCheckIn,
        lateCheckOut: stay.lateCheckOut,
      },
      tx,
    );
  });

  await audit({
    actor,
    accion: ACCIONES.MODIFICAR,
    recurso: RECURSOS.RESERVA,
    recursoId: id,
    detalle: {
      campos: Object.keys(data),
      total: reservation.total,
      noches: reservation.noches,
      checkIn: isoDay(reservation.checkIn),
      checkOut: isoDay(reservation.checkOut),
    },
  });

  return reservation;
}

async function cambiarEstado(id, estado) {
  const existing = await getReservation(id);
  assertTransition(existing.estado, estado);
  return resRepo.setEstado(id, estado);
}

async function checkInReservation(id) {
  return cambiarEstado(id, EN_CURSO);
}

async function checkOutReservation(id) {
  return cambiarEstado(id, FINALIZADA);
}

async function markNoShow(id) {
  return cambiarEstado(id, NO_SHOW);
}

async function cancelReservation(id, data = {}, actor = null) {
  const existing = await getReservation(id);
  assertTransition(existing.estado, CANCELADA);

  const motivo = data.motivo === undefined ? existing.motivoCancelacion : data.motivo;
  const reservation = await resRepo.update(id, {
    estado: CANCELADA,
    motivoCancelacion: motivo ?? null,
    multaCancelacion: calculateCancellationFee(existing.total),
  });

  await audit({
    actor,
    accion: ACCIONES.CANCELAR,
    recurso: RECURSOS.RESERVA,
    recursoId: id,
    detalle: {
      motivo: motivo ?? null,
      multa: reservation.multaCancelacion,
      total: reservation.total,
      totalPagado: existing.totalPagado,
    },
  });

  await notificarCancelacion(reservation);
  return reservation;
}

module.exports = {
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  createReservation,
  getReservation,
  listReservations,
  markNoShow,
  updateReservation,
};
