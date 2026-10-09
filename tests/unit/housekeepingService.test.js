jest.mock('../../src/repositories/housekeeping.repository');
jest.mock('../../src/repositories/room.repository');
jest.mock('../../src/repositories/user.repository');

const housekeepingRepo = require('../../src/repositories/housekeeping.repository');
const { getEstadoLimpieza } = require('../../src/services/housekeeping.service');

describe('estado de limpieza derivado de la última tarea no cancelada', () => {
  beforeEach(() => {
    housekeepingRepo.findLatestNonCanceled.mockReset();
  });

  test('sin tareas informa PENDIENTE', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue(null);
    await expect(getEstadoLimpieza(1)).resolves.toBe('PENDIENTE');
  });

  test('con la última tarea LIMPIA informa LIMPIA', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue({ estado: 'LIMPIA' });
    await expect(getEstadoLimpieza(1)).resolves.toBe('LIMPIA');
  });

  test('con la última tarea INSPECCION_OK informa LIMPIA', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue({ estado: 'INSPECCION_OK' });
    await expect(getEstadoLimpieza(1)).resolves.toBe('LIMPIA');
  });

  test('con la última tarea EN_PROCESO informa EN_PROCESO', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue({ estado: 'EN_PROCESO' });
    await expect(getEstadoLimpieza(1)).resolves.toBe('EN_PROCESO');
  });

  test('con la última tarea EN_INSPECCION informa EN_PROCESO', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue({ estado: 'EN_INSPECCION' });
    await expect(getEstadoLimpieza(1)).resolves.toBe('EN_PROCESO');
  });

  test('con una inspección fallada informa SUCIA', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue({ estado: 'INSPECCION_FALLA' });
    await expect(getEstadoLimpieza(1)).resolves.toBe('SUCIA');
  });

  test('con una tarea pendiente informa PENDIENTE', async () => {
    housekeepingRepo.findLatestNonCanceled.mockResolvedValue({ estado: 'PENDIENTE' });
    await expect(getEstadoLimpieza(1)).resolves.toBe('PENDIENTE');
  });
});