const maintenanceRepo = require('../repositories/maintenance.repository');
const roomRepo = require('../repositories/room.repository');
const housekeepingRepo = require('../repositories/housekeeping.repository');
const { assertTransition } = require('../lib/maintenanceState');
const { HttpError } = require('../lib/httpError');

const TIPOS_VALIDOS = ['FUGA', 'AVERIA', 'ELECTRICA', 'LIMPIEZA_REACTIVA', 'OTRO'];
const PRIORIDADES_VALIDAS = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

async function ensureRoomExists(roomId) {
  const room = await roomRepo.findById(roomId);
  if (!room) {
    throw new HttpError(404, 'NOT_FOUND', 'Habitación no encontrada');
  }
  return room;
}

async function createTicket(data, reportadoPorId) {
  if (!TIPOS_VALIDOS.includes(data.tipo)) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Tipo inválido');
  }
  if (!PRIORIDADES_VALIDAS.includes(data.prioridad)) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Prioridad inválida');
  }
  await ensureRoomExists(data.roomId);
  const ticket = await maintenanceRepo.create({
    roomId: data.roomId,
    tipo: data.tipo,
    prioridad: data.prioridad,
    estado: 'ABIERTO',
    descripcion: data.descripcion,
    reportadoPorId,
    asignadoAId: data.asignadoAId || null,
  });
  return ticket;
}

async function listTickets(params) {
  return maintenanceRepo.findMany(params);
}

async function getTicket(id) {
  const ticket = await maintenanceRepo.findById(id);
  if (!ticket) {
    throw new HttpError(404, 'NOT_FOUND', 'Ticket no encontrado');
  }
  return ticket;
}

async function updateTicket(id, updates, actor) {
  const ticket = await getTicket(id);
  if (updates.estado) {
    assertTransition(ticket.estado, updates.estado);
    if (updates.estado === 'CANCELADO') {
      if (!actor || actor.rol !== 'ADMINISTRADOR') {
        throw new HttpError(403, 'FORBIDDEN', 'Solo ADMINISTRADOR puede cancelar tickets');
      }
    }
    if (updates.estado === 'RESUELTO') {
      if (!updates.resolucion || String(updates.resolucion).trim() === '') {
        throw new HttpError(422, 'VALIDATION_ERROR', 'Debe indicar la resolución al cerrar el ticket');
      }
      updates.resueltoEn = new Date();
    }
  }
  const updated = await maintenanceRepo.update(id, updates);
  // If resolved, create inspection task if not exists
    if (updates.estado === 'RESUELTO') {
      const existing = await housekeepingRepo.findPendingOrInProgressInspection(ticket.roomId);
      if (!existing) {
        await housekeepingRepo.create({
          roomId: ticket.roomId,
          tipo: 'INSPECCION',
          estado: 'PENDIENTE',
          fechaProgramada: new Date(),
          asignadoAId: null,
          observaciones: `Inspección tras ticket #${ticket.id}`,
        });
      }
    }
  return updated;
}

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
};
