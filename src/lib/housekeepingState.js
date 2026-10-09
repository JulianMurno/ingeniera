const { HttpError } = require('./httpError');

const ESTADOS = [
  "PENDIENTE",
  "EN_PROCESO",
  "LIMPIA",
  "EN_INSPECCION",
  "INSPECCION_OK",
  "INSPECCION_FALLA",
  "CANCELADA",
];

const TRANSITIONS = {
  PENDIENTE: ["EN_PROCESO", "CANCELADA"],
  EN_PROCESO: ["LIMPIA", "CANCELADA"],
  LIMPIA: ["EN_INSPECCION", "CANCELADA"],
  EN_INSPECCION: ["INSPECCION_OK", "INSPECCION_FALLA"],
  INSPECCION_FALLA: ["EN_PROCESO"],
  INSPECCION_OK: [],
  CANCELADA: [],
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
  ESTADOS_HOUSEKEEPING: ESTADOS,
  TRANSITIONS_HOUSEKEEPING: TRANSITIONS,
  canTransition,
  assertTransition,
};
