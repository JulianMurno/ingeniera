const DEFAULTS = {
  CANCELLATION_FEE_PERCENT: 0,
  NOTIFICATIONS_FROM: 'reservas@hotel.local',
};

function readEnv(name) {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? DEFAULTS[name] : raw;
}

function getCancellationFeePercent() {
  const parsed = Number.parseInt(readEnv('CANCELLATION_FEE_PERCENT'), 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return Number.parseInt(DEFAULTS.CANCELLATION_FEE_PERCENT, 10);
  }
  return parsed;
}

function calculateCancellationFee(total) {
  const percent = getCancellationFeePercent();
  if (percent === 0) return 0;
  return Math.round((total * percent) / 100);
}

function getNotificationsFrom() {
  return readEnv('NOTIFICATIONS_FROM');
}

module.exports = {
  DEFAULTS,
  calculateCancellationFee,
  getCancellationFeePercent,
  getNotificationsFrom,
};
