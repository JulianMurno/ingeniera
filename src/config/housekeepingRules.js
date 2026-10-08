const DEFAULTS = {
  HOUSEKEEPING_BLOCK_CHECKIN: false,
};

function readEnv(name) {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? DEFAULTS[name] : raw;
}

function getHousekeepingBlockCheckIn() {
  const raw = readEnv('HOUSEKEEPING_BLOCK_CHECKIN');
  if (raw === true || raw === 'true' || raw === 'TRUE' || raw === '1' || raw === 1) {
    return true;
  }
  return false;
}

module.exports = {
  getHousekeepingBlockCheckIn,
  HOUSEKEEPING_BLOCK_CHECKIN_DEFAULT: DEFAULTS.HOUSEKEEPING_BLOCK_CHECKIN,
};
