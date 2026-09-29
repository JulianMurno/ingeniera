const DEFAULTS = {
  JWT_EXPIRES_IN: '8h',
};

const PATTERN = /^(\d+(?:\.\d+)?)\s*(s|m|h|d|w|y)?$/i;

function readEnv(name) {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? DEFAULTS[name] : raw;
}

function isValidDuration(value) {
  const match = PATTERN.exec(String(value).trim());
  if (!match) return false;
  const amount = Number.parseFloat(match[1]);
  return Number.isFinite(amount) && amount > 0;
}

function getJwtExpiresIn() {
  const raw = readEnv('JWT_EXPIRES_IN');
  return isValidDuration(raw) ? String(raw).trim() : DEFAULTS.JWT_EXPIRES_IN;
}

module.exports = { DEFAULTS, getJwtExpiresIn };
