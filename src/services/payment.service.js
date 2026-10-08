const paymentRepo = require('../repositories/payment.repository');
const resRepo = require('../repositories/reservation.repository');
const { toDate } = require('./business.service');
const { HttpError } = require('../lib/httpError');

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dayIso(date) {
  return date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
}

function computeEstadoPago(total, pagado) {
  if (pagado <= 0) return 'PENDIENTE';
  if (pagado >= total) return 'PAGADA';
  return 'PARCIAL';
}

function sumPagos(pagos = []) {
  return pagos.reduce((acc, pago) => acc + pago.monto, 0);
}

function withPaymentState(reservation, pagos = []) {
  const totalPagado = sumPagos(pagos);
  return {
    ...reservation,
    estadoPago: computeEstadoPago(reservation.total, totalPagado),
    totalPagado,
    saldoPendiente: Math.max(reservation.total - totalPagado, 0),
    pagos,
  };
}

async function findReservationOr404(reservationId) {
  const reservation = await resRepo.findById(reservationId);
  if (!reservation) {
    throw new HttpError(404, 'NOT_FOUND', 'Reserva no encontrada');
  }
  return reservation;
}

async function registerPayment(reservationId, data) {
  const reservation = await findReservationOr404(reservationId);

  const payment = await paymentRepo.create({
    reservationId: reservation.id,
    monto: data.monto,
    metodo: data.metodo,
    pagadoEn: toDate(data.pagadoEn || todayIso()),
  });

  const pagos = await paymentRepo.findByReservation(reservation.id);
  const estado = withPaymentState(reservation, pagos);

  return {
    ...payment,
    pagadoEn: dayIso(payment.pagadoEn),
    estadoPago: estado.estadoPago,
    totalPagado: estado.totalPagado,
    saldoPendiente: estado.saldoPendiente,
  };
}

async function loadPaymentState(reservation) {
  const pagos = await paymentRepo.findByReservation(reservation.id);
  return withPaymentState(reservation, pagos);
}

async function buildInvoice(reservationId) {
  const reservation = await findReservationOr404(reservationId);
  const pagos = await paymentRepo.findByReservation(reservation.id);
  const totalPagado = sumPagos(pagos);
  const noches = reservation.noches;

  return {
    numero: `FAC-${reservation.codigo || reservation.id}`,
    reservaId: reservation.id,
    codigo: reservation.codigo,
    emitidaEn: new Date().toISOString(),
    estadoReserva: reservation.estado,
    cliente: {
      id: reservation.guest.id,
      nombre: reservation.guest.nombre,
      dni: reservation.guest.dni,
      email: reservation.guest.email,
    },
    habitacion: {
      id: reservation.room.id,
      numero: reservation.room.numero,
      tipo: reservation.room.tipo,
      tarifaBase: reservation.room.tarifa,
    },
    estancia: {
      checkIn: dayIso(reservation.checkIn),
      checkOut: dayIso(reservation.checkOut),
      noches,
      adultos: reservation.adultos,
      menores: reservation.menores,
    },
    tarifaPromedioPorNoche: noches > 0 ? Math.round(reservation.total / noches) : 0,
    total: reservation.total,
    pagos,
    totalPagado,
    saldoPendiente: Math.max(reservation.total - totalPagado, 0),
    estadoPago: computeEstadoPago(reservation.total, totalPagado),
  };
}

module.exports = {
  buildInvoice,
  computeEstadoPago,
  loadPaymentState,
  registerPayment,
  sumPagos,
  withPaymentState,
};
