const housekeepingRepo = require('../repositories/housekeeping.repository');
const roomRepo = require('../repositories/room.repository');
const userRepo = require('../repositories/user.repository');
const { assertTransition } = require('../lib/housekeepingState');
const { HttpError } = require('../lib/httpError');

const ESTADOS_SUCIA = new Set(['INSPECCION_FALLA']);
const ESTADOS_LIMPIA = new Set(['LIMPIA', 'INSPECCION_OK']);
const ESTADOS_EN_PROCESO = new Set(['EN_PROCESO', 'EN_INSPECCION']);

async function ensureRoomExists(roomId) {
  const room = await roomRepo.findById(roomId);
  if (!room) {
    throw new HttpError(404, 'NOT_FOUND', 'Habitación no encontrada');
  }
  return room;
}

async function createTask(data) {
  await ensureRoomExists(data.roomId);
  const task = await housekeepingRepo.create({
    roomId: data.roomId,
    tipo: data.tipo,
    estado: 'PENDIENTE',
    asignadoAId: data.asignadoAId || null,
    fechaProgramada: data.fechaProgramada,
    observaciones: data.observaciones || null,
  });
  return task;
}

async function getEstadoLimpieza(roomId) {
  const latest = await housekeepingRepo.findLatestNonCanceled(roomId);
  if (!latest) {
    return 'PENDIENTE';
  }
  if (ESTADOS_LIMPIA.has(latest.estado)) {
    return 'LIMPIA';
  }
  if (ESTADOS_EN_PROCESO.has(latest.estado)) {
    return 'EN_PROCESO';
  }
  if (ESTADOS_SUCIA.has(latest.estado)) {
    return 'SUCIA';
  }
  return 'PENDIENTE';
}

async function listTasks(params) {
  return housekeepingRepo.findMany(params);
}

async function getTask(id) {
  const task = await housekeepingRepo.findById(id);
  if (!task) {
    throw new HttpError(404, 'NOT_FOUND', 'Tarea no encontrada');
  }
  return task;
}

async function updateTask(id, updates, actor) {
  const task = await getTask(id);
  if (updates.estado) {
    // If claiming unassigned task (taking ownership) - state might go to EN_PROCESO from PENDIENTE
    assertTransition(task.estado, updates.estado);
  }
  if (actor && actor.rol !== 'ADMINISTRADOR') {
    if (updates.estado === 'CANCELADA') {
      throw new HttpError(403, 'FORBIDDEN', 'Solo ADMINISTRADOR puede cancelar tareas');
    }
    // Non-admin cannot assign to another different user
    if (updates.asignadoAId !== undefined && updates.asignadoAId !== null && updates.asignadoAId !== actor.id) {
      throw new HttpError(403, 'FORBIDDEN', 'Solo ADMINISTRADOR puede asignar tareas a otro usuario');
    }
    // Also cannot unassign others? Probably not specified
    if (updates.asignadoAId === null && task.asignadoAId && task.asignadoAId !== actor.id && actor.rol !== 'ADMINISTRADOR') {
      // Only admin can reassign generally
      throw new HttpError(403, 'FORBIDDEN', 'Solo ADMINISTRADOR puede reasignar tareas');
    }
  }
  if (updates.asignadoAId !== undefined && updates.asignadoAId !== null) {
    const user = await userRepo.findById(updates.asignadoAId);
    if (!user || !user.activo) {
      throw new HttpError(422, 'VALIDATION_ERROR', 'Usuario asignado no existe o está archivado');
    }
  }
  return housekeepingRepo.update(id, updates);
}

async function getResumen({ fecha }) {
  if (fecha) {
    const parsed = new Date(fecha + 'T00:00:00.000Z');
    if (isNaN(parsed.getTime())) {
      throw new HttpError(422, 'VALIDATION_ERROR', 'Fecha inválida');
    }
  }
  const [porEstado, porAsignado] = await Promise.all([
    housekeepingRepo.countByEstado({ fecha }),
    housekeepingRepo.countByAsignado({ fecha }),
  ]);
  return { porEstado, porAsignado };
}

module.exports = {
  createTask,
  listTasks,
  updateTask,
  getTask,
  getEstadoLimpieza,
  getResumen,
};
