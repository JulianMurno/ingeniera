// Lógica pura de la vista calendario de reservas.
// Las fechas se generan y comparan como strings `YYYY-MM-DD` para no mezclar
// zonas horarias: `Date` locales pueden correr un día.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const CALENDAR_DAYS = 30;

const ESTADOS_OCUPADOS = ['CONFIRMADA', 'EN_CURSO', 'FINALIZADA'];

export const ESTADO_CELDA = {
  DISPONIBLE: 'DISPONIBLE',
  RESERVADA: 'RESERVADA',
  MANTENIMIENTO: 'MANTENIMIENTO',
};

function isoDay(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

export function addDaysISO(fecha, dias) {
  const [year, month, day] = String(fecha).slice(0, 10).split('-').map(Number);
  const ms = Date.UTC(year, month - 1, day) + dias * MS_PER_DAY;
  return new Date(ms).toISOString().slice(0, 10);
}

export function buildRange(fechaInicio, dias = CALENDAR_DAYS) {
  return Array.from({ length: dias }, (_, index) => addDaysISO(fechaInicio, index));
}

export function reservationOccupies(reserva, fecha) {
  if (!reserva || !ESTADOS_OCUPADOS.includes(reserva.estado)) return false;

  const checkIn = isoDay(reserva.checkIn);
  const checkOut = isoDay(reserva.checkOut);
  if (!checkIn || !checkOut) return false;

  // Una reserva ocupa [checkIn, checkOut): el día de salida queda libre.
  return checkIn <= fecha && fecha < checkOut;
}

function findReservation(reservations, fecha) {
  return reservations.find((reserva) => reservationOccupies(reserva, fecha)) || null;
}

function cellState(room, reserva) {
  // Precedencia: reservada > mantenimiento > disponible.
  if (reserva) return ESTADO_CELDA.RESERVADA;
  if (room?.estado === 'MANTENIMIENTO') return ESTADO_CELDA.MANTENIMIENTO;
  return ESTADO_CELDA.DISPONIBLE;
}

export function buildCalendarRows(rooms, reservations, fechas) {
  return (rooms || []).map((room) => {
    const deHabitacion = (reservations || []).filter((reserva) => reserva.roomId === room.id);

    const celdas = fechas.map((fecha, index) => {
      const reserva = findReservation(deHabitacion, fecha);
      const anterior = index > 0 ? findReservation(deHabitacion, fechas[index - 1]) : null;

      return {
        fecha,
        estado: cellState(room, reserva),
        reserva,
        // El código se muestra al inicio de cada serie contigua visible.
        mostrarCodigo: Boolean(reserva) && (!anterior || anterior.id !== reserva.id),
      };
    });

    return { room, celdas };
  });
}
