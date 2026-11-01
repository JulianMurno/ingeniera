jest.mock('../../src/lib/prisma', () => ({ $transaction: jest.fn() }));
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/guest.repository');

const prisma = require('../../src/lib/prisma');
const userRepo = require('../../src/repositories/user.repository');
const guestRepo = require('../../src/repositories/guest.repository');
const authService = require('../../src/services/auth.service');

const guestData = {
  nombre: 'Ana Pérez',
  email: 'Ana.Perez@Example.com',
  dni: '12345678z',
  telefono: '600111222',
  password: 'huesped123',
};

const claimIf = (guest) => {
  guestRepo.findByDni.mockResolvedValue(guest);
  guestRepo.findByEmail.mockResolvedValue(null);
};

describe('registerGuest: reclamo de ficha y creación de cuenta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback({ tx: true }));
    userRepo.findByUsernameWithGuest.mockResolvedValue(null);
    guestRepo.findByDni.mockResolvedValue(null);
    guestRepo.findByEmail.mockResolvedValue(null);
    guestRepo.create.mockResolvedValue({ id: 8 });
    userRepo.createGuestAccount.mockImplementation(async (data) => ({
      id: 20,
      username: data.username,
      rol: data.rol,
      activo: data.activo,
      guestId: data.guestId,
      guest: { nombre: guestData.nombre },
    }));
  });

  test('reclama la ficha existente cuando DNI y email coinciden', async () => {
    claimIf({
      id: 7,
      activo: true,
      email: 'ana.perez@example.com',
      dni: '12345678Z',
      accounts: [],
    });

    const result = await authService.registerGuest(guestData);

    expect(guestRepo.create).not.toHaveBeenCalled();
    expect(userRepo.createGuestAccount).toHaveBeenCalledWith(
      {
        username: 'ana.perez@example.com',
        password: expect.any(String),
        rol: 'HUESPED',
        activo: true,
        guestId: 7,
      },
      { tx: true },
    );
    expect(result.token).toEqual(expect.any(String));
    expect(result.user).toMatchObject({
      id: 20,
      username: 'ana.perez@example.com',
      rol: 'HUESPED',
      guestId: 7,
      nombre: 'Ana Pérez',
    });
  });

  test('crea una ficha nueva cuando no existe coincidencia', async () => {
    const result = await authService.registerGuest(guestData);

    expect(guestRepo.findByEmail).toHaveBeenCalledWith('ana.perez@example.com', { tx: true });
    expect(guestRepo.create).toHaveBeenCalledWith(
      {
        nombre: 'Ana Pérez',
        email: 'ana.perez@example.com',
        dni: '12345678Z',
        telefono: '600111222',
      },
      { tx: true },
    );
    expect(userRepo.createGuestAccount).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: 8, username: 'ana.perez@example.com' }),
      { tx: true },
    );
    expect(result.user.guestId).toBe(8);
  });

  test('rechaza coincidencia parcial de DNI con otro email', async () => {
    claimIf({
      id: 7,
      activo: true,
      email: 'otro@example.com',
      dni: '12345678Z',
      accounts: [],
    });

    await expect(authService.registerGuest(guestData)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    expect(guestRepo.create).not.toHaveBeenCalled();
    expect(userRepo.createGuestAccount).not.toHaveBeenCalled();
  });

  test('rechaza coincidencia parcial de email con otro DNI', async () => {
    guestRepo.findByDni.mockResolvedValue(null);
    guestRepo.findByEmail.mockResolvedValue({
      id: 9,
      activo: true,
      email: 'ana.perez@example.com',
      dni: '99999999A',
      accounts: [],
    });

    await expect(authService.registerGuest(guestData)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    expect(guestRepo.create).not.toHaveBeenCalled();
    expect(userRepo.createGuestAccount).not.toHaveBeenCalled();
  });

  test('rechaza una ficha archivada', async () => {
    claimIf({
      id: 7,
      activo: false,
      email: 'ana.perez@example.com',
      dni: '12345678Z',
      accounts: [],
    });

    await expect(authService.registerGuest(guestData)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    expect(userRepo.createGuestAccount).not.toHaveBeenCalled();
  });

  test('rechaza una ficha que ya tiene cuenta', async () => {
    claimIf({
      id: 7,
      activo: true,
      email: 'ana.perez@example.com',
      dni: '12345678Z',
      accounts: [{ id: 3 }],
    });

    await expect(authService.registerGuest(guestData)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    expect(userRepo.createGuestAccount).not.toHaveBeenCalled();
  });

  test('rechaza un email que ya tiene cuenta', async () => {
    userRepo.findByUsernameWithGuest.mockResolvedValue({ id: 3, rol: 'HUESPED' });

    await expect(authService.registerGuest(guestData)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    expect(guestRepo.findByDni).not.toHaveBeenCalled();
    expect(guestRepo.create).not.toHaveBeenCalled();
  });

  test('traduce una violación de unicidad de Prisma a 409', async () => {
    const uniqueError = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    userRepo.createGuestAccount.mockRejectedValue(uniqueError);

    await expect(authService.registerGuest(guestData)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });
});
