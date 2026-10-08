const prisma = require('./prisma');

const ACCIONES = {
  CREAR: 'CREAR',
  MODIFICAR: 'MODIFICAR',
  CANCELAR: 'CANCELAR',
  ELIMINAR: 'ELIMINAR',
};

const RECURSOS = {
  RESERVA: 'RESERVA',
  HABITACION: 'HABITACION',
  USUARIO: 'USUARIO',
};

const ACCIONES_AUDITORIA = Object.values(ACCIONES);
const RECURSOS_AUDITORIA = Object.values(RECURSOS);

function serializeDetalle(detalle) {
  if (detalle === undefined || detalle === null) return null;
  if (typeof detalle === 'string') return detalle;
  return JSON.stringify(detalle);
}

async function audit({ actor, accion, recurso, recursoId, detalle } = {}) {
  if (!actor || actor.id === undefined || actor.id === null) return null;

  try {
    return await prisma.auditLog.create({
      data: {
        userId: Number(actor.id),
        accion,
        recurso,
        recursoId: recursoId === undefined || recursoId === null ? null : String(recursoId),
        detalle: serializeDetalle(detalle),
      },
    });
  } catch (err) {
    console.error('No se pudo registrar el evento de auditoría:', err.message);
    return null;
  }
}

module.exports = {
  ACCIONES,
  ACCIONES_AUDITORIA,
  RECURSOS,
  RECURSOS_AUDITORIA,
  audit,
};
