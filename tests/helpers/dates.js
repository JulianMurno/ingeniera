const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Las reservas se validan contra "hoy" (no en el pasado + antelación mínima),
// así que los tests aritmetican sobre hoy en vez de fijar fechas que envejecen.
function todayUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function day(offsetDays = 0) {
  return new Date(todayUtc() + offsetDays * MS_PER_DAY).toISOString().slice(0, 10);
}

function diaSemana(fecha) {
  return new Date(`${fecha}T00:00:00.000Z`).getUTCDay();
}

function offsetToWeekday(weekday, minOffset = 1) {
  let offset = Math.max(0, minOffset);
  while (new Date(todayUtc() + offset * MS_PER_DAY).getUTCDay() !== weekday) {
    offset += 1;
  }
  return offset;
}

module.exports = { day, diaSemana, offsetToWeekday };
