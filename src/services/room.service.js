const roomRepo = require('../repositories/room.repository');
const housekeepingRepo = require('../repositories/housekeeping.repository');
const maintenanceRepo = require('../repositories/maintenance.repository');
const { toDate } = require('./business.service');
const { HttpError } = require('../lib/httpError');
const housekeepingService = require('./housekeeping.service');
const { audit, ACCIONES, RECURSOS } = require('../lib/audit');

async function createRoom(data, actor = null) {
  const existing = await roomRepo.findByNumero(data.numero);
  if (existing) {
    throw new HttpError(409, 'CONFLICT', 'Ya existe una habitación con ese número');
  }
  const room = await roomRepo.create(data);

  await audit({
    actor,
    accion: ACCIONES.CREAR,
    recurso: RECURSOS.HABITACION,
    recursoId: room.id,
    detalle: {
      numero: room.numero,
      tipo: room.tipo,
      tarifa: room.tarifa,
      capacidad: room.capacidad,
      estado: room.estado,
    },
  });

  return room;
}

async function listRooms(params = {}) {
  const { checkIn, checkOut } = params;
  if (checkIn && checkOut) {
    return roomRepo.findAvailableByRange({
      ...params,
      checkIn: toDate(checkIn),
      checkOut: toDate(checkOut),
    });
  }
  return roomRepo.findMany(params);
}

async function getRoom(id) {
  const room = await roomRepo.findById(id);
  if (!room) {
    throw new HttpError(404, 'NOT_FOUND', 'Habitación no encontrada');
  }
  const limpieza = await housekeepingService.getEstadoLimpieza(id);
  const incidenciasAbiertas = await maintenanceRepo.countOpenByRoomId(id);
  return { ...room, limpieza, incidenciasAbiertas };
}

async function updateRoom(id, data, actor = null) {
  if (!(await roomRepo.findById(id))) {
    throw new HttpError(404, 'NOT_FOUND', 'Habitación no encontrada');
  }
  if (data.numero) {
    const existing = await roomRepo.findByNumero(data.numero);
    if (existing && existing.id !== id) {
      throw new HttpError(409, 'CONFLICT', 'Ya existe una habitación con ese número');
    }
  }
  const room = await roomRepo.update(id, data);

  await audit({
    actor,
    accion: ACCIONES.MODIFICAR,
    recurso: RECURSOS.HABITACION,
    recursoId: id,
    detalle: { campos: Object.keys(data), numero: room.numero, estado: room.estado },
  });

  return room;
}

async function deleteRoom(id, actor = null) {
  const existing = await roomRepo.findById(id);
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Habitación no encontrada');
  }
  try {
    await roomRepo.remove(id);
  } catch (err) {
    if (err.code === 'P2003') {
      throw new HttpError(
        409,
        'CONFLICT',
        'La habitación tiene reservas asociadas y no puede eliminarse',
      );
    }
    throw err;
  }

  await audit({
    actor,
    accion: ACCIONES.ELIMINAR,
    recurso: RECURSOS.HABITACION,
    recursoId: id,
    detalle: { numero: existing.numero, tipo: existing.tipo },
  });
}

async function getRoomHousekeeping(id) {
  const room = await roomRepo.findById(id);
  if (!room) {
    throw new HttpError(404, 'NOT_FOUND', 'Habitación no encontrada');
  }
  const [tasks, tickets] = await Promise.all([
    housekeepingRepo.findByRoomId(id),
    maintenanceRepo.findByRoomId(id),
  ]);
  const history = [
    ...tasks.map((t) => ({ origen: 'tarea', ...t })),
    ...tickets.map((t) => ({ origen: 'ticket', ...t })),
  ];
  history.sort((a, b) => {
    const da = new Date(a.actualizadoEn || a.creadoEn || 0).getTime();
    const db = new Date(b.actualizadoEn || b.creadoEn || 0).getTime();
    return db - da;
  });
  return { room, history };
}

module.exports = { createRoom, listRooms, getRoom, updateRoom, deleteRoom, getRoomHousekeeping };
