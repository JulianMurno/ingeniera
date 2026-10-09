const extrasRepo = require('../repositories/extras.repository');
const resRepo = require('../repositories/reservation.repository');
const { HttpError } = require('../lib/httpError');
const { CONFIRMADA, EN_CURSO } = require('../lib/reservationState');

const ESTADOS_CON_CARGOS = [CONFIRMADA, EN_CURSO];
const ESTADO_PENDIENTE = 'PENDIENTE';
const ESTADO_CANCELADO = 'CANCELADO';

function toUtcDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function createExtra(data) {
  const existing = await extrasRepo.findByCodigo(data.codigo);
  if (existing) {
    throw new HttpError(409, 'CONFLICT', 'Ya existe un servicio con ese código');
  }
  return extrasRepo.create(data);
}

async function listExtras(params, user) {
  const soloActivos = !user || user.rol !== 'ADMINISTRADOR';
  return extrasRepo.findMany(params, { soloActivos });
}

async function updateExtra(id, data) {
  const existing = await extrasRepo.findById(id);
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Servicio no encontrado');
  }
  if (data.codigo !== undefined) {
    const duplicate = await extrasRepo.findByCodigo(data.codigo);
    if (duplicate && duplicate.id !== id) {
      throw new HttpError(409, 'CONFLICT', 'Ya existe un servicio con ese código');
    }
  }
  return extrasRepo.update(id, data);
}

async function deleteExtra(id) {
  const existing = await extrasRepo.findById(id);
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Servicio no encontrado');
  }
  return extrasRepo.deactivate(id);
}

async function getReservationOr404(reservationId) {
  const reservation = await resRepo.findById(reservationId);
  if (!reservation) {
    throw new HttpError(404, 'NOT_FOUND', 'Reserva no encontrada');
  }
  return reservation;
}

async function calcularResumen(reservation) {
  const { _sum, _count } = await extrasRepo.sumCharges(reservation.id);
  const totalServicios = _sum.importe || 0;
  return {
    totalEstadia: reservation.total,
    totalServicios,
    totalGeneral: reservation.total + totalServicios,
    cantidadCargos: _count._all,
  };
}

async function registrarCargo(reservationId, data, userId) {
  const reservation = await getReservationOr404(reservationId);

  if (!ESTADOS_CON_CARGOS.includes(reservation.estado)) {
    throw new HttpError(
      409,
      'CONFLICT',
      `No se pueden registrar cargos a una reserva en estado ${reservation.estado}`,
    );
  }

  const extra = await extrasRepo.findById(data.extraId);
  if (!extra || !extra.activo) {
    throw new HttpError(409, 'CONFLICT', 'El servicio no existe o está inactivo');
  }

  const precioUnitario = extra.precio;
  return extrasRepo.createCharge({
    reservationId: reservation.id,
    extraId: extra.id,
    cantidad: data.cantidad,
    precioUnitario,
    importe: precioUnitario * data.cantidad,
    estado: ESTADO_PENDIENTE,
    nota: data.nota ?? null,
    registradoPorId: userId,
  });
}

async function listarCargos(reservationId) {
  const reservation = await getReservationOr404(reservationId);
  const data = await extrasRepo.findChargesByReservation(reservation.id);
  const resumen = await calcularResumen(reservation);
  return { data, resumen };
}

async function anularCargo(reservationId, chargeId, userId) {
  await getReservationOr404(reservationId);
  const charge = await extrasRepo.findChargeById(chargeId);
  if (!charge || charge.reservationId !== Number(reservationId)) {
    throw new HttpError(404, 'NOT_FOUND', 'Cargo no encontrado');
  }
  if (charge.estado === ESTADO_CANCELADO) {
    return charge;
  }
  return extrasRepo.cancelCharge(charge.id, {
    anuladoPorId: userId,
    anuladoEn: new Date(),
  });
}

async function resumenCargos(reservationId) {
  const reservation = await getReservationOr404(reservationId);
  return calcularResumen(reservation);
}

async function consumo(desde, hasta) {
  const start = toUtcDate(desde);
  if (start.getTime() >= toUtcDate(hasta).getTime()) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'La fecha inicial debe ser anterior a la final');
  }
  const end = new Date(toUtcDate(hasta).getTime());
  end.setUTCDate(end.getUTCDate() + 1);

  const agrupado = await extrasRepo.consumoAgrupado(start, end);
  const extras = await extrasRepo.findManyByIds(agrupado.map((row) => row.extraId));
  const porId = new Map(extras.map((extra) => [extra.id, extra]));

  const data = agrupado.map((row) => {
    const extra = porId.get(row.extraId);
    return {
      extraId: row.extraId,
      codigo: extra ? extra.codigo : null,
      nombre: extra ? extra.nombre : null,
      categoria: extra ? extra.categoria : null,
      cantidad: row._sum.cantidad || 0,
      importe: row._sum.importe || 0,
    };
  });

  const totalPeriodo = data.reduce((acc, item) => acc + item.importe, 0);
  return { data, desde, hasta, totalPeriodo };
}

module.exports = {
  createExtra,
  listExtras,
  updateExtra,
  deleteExtra,
  registrarCargo,
  listarCargos,
  anularCargo,
  resumenCargos,
  consumo,
};
