const CODE_PREFIX = 'HR-';
const CODE_LENGTH = 6;
// Sin I, O, 0 ni 1 para que el código se pueda leer en voz alta sin ambigüedad.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReservationCode(random = Math.random) {
  let suffix = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    suffix += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  }
  return `${CODE_PREFIX}${suffix}`;
}

function normalizeCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

module.exports = { CODE_LENGTH, CODE_PREFIX, generateReservationCode, normalizeCode };
