const { HttpError } = require('./httpError');

const ESTADOS = ["ABIERTO", "EN_PROCESO", "RESUELTO", "CANCELADO"];

const TRANSITIONS = {
  ABIERTO: ["EN_PROCESO", "RESUELTO", "CANCELADO"],
  EN_PROCESO: ["RESUELTO", "CANCELADO"],
  RESUELTO: [],
  CANCELADO: [],
};

function canTransition(from, to) {
  if (!ESTADOS.includes(from) || !ESTADOS.includes(to)) {
    return false;
  }
  const allowed = TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new HttpError(409, 'CONFLICT', `Transición de estado no permitida: ${from} → ${to}`);
  }
}

module.exports = {
  ESTADOS_MAINTENANCE: ESTADOS,
  TRANSITIONS_MAINTENANCE: TRANSITIONS,
  canTransition,
  assertTransition,
};
