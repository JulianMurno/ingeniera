const { HttpError } = require('./httpError');

const CONFIRMADA = 'CONFIRMADA';
const EN_CURSO = 'EN_CURSO';
const FINALIZADA = 'FINALIZADA';
const CANCELADA = 'CANCELADA';
const NO_SHOW = 'NO_SHOW';

const ESTADOS_RESERVA = [CONFIRMADA, EN_CURSO, FINALIZADA, CANCELADA, NO_SHOW];

const TRANSICIONES = {
  [CONFIRMADA]: [EN_CURSO, CANCELADA, NO_SHOW],
  [EN_CURSO]: [FINALIZADA],
  [FINALIZADA]: [],
  [CANCELADA]: [],
  [NO_SHOW]: [],
};

function isEstadoReserva(estado) {
  return ESTADOS_RESERVA.includes(estado);
}

function canTransition(from, to) {
  if (!isEstadoReserva(from) || !isEstadoReserva(to)) return false;
  return TRANSICIONES[from].includes(to);
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new HttpError(409, 'CONFLICT', `Transición de estado no permitida: ${from} → ${to}`);
  }
}

module.exports = {
  CANCELADA,
  CONFIRMADA,
  EN_CURSO,
  ESTADOS_RESERVA,
  FINALIZADA,
  NO_SHOW,
  TRANSICIONES,
  assertTransition,
  canTransition,
  isEstadoReserva,
};
