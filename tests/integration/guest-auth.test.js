const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  app,
  prisma,
  resetDb,
  tokenFor,
  registerGuest,
  TEST_PASSWORD,
  GUEST_PASSWORD,
} = require('../helpers/db');
const { day } = require('../helpers/dates');

function decode(token) {
  return jwt.decode(token);
}

async function seedGuest(overrides = {}) {
  return prisma.guest.create({
    data: {
      nombre: 'María López',
      email: 'maria@example.com',
      dni: '20000001',
      telefono: '+5491123456789',
      ...overrides,
    },
  });
}

beforeEach(resetDb);

describe('Registro de huésped', () => {
  test('registro exitoso crea ficha, cuenta HUESPED y emite token', async () => {
    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'Juan Pérez',
      email: '  Juan@Example.com ',
      dni: '12345678',
      telefono: '+5491123456789',
      password: 'clave-segura',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe('HUESPED');
    expect(res.body.user.username).toBe('juan@example.com');

    const guest = await prisma.guest.findUnique({ where: { dni: '12345678' } });
    expect(guest.email).toBe('juan@example.com');
    expect(guest.nombre).toBe('Juan Pérez');

    const user = await prisma.user.findUnique({ where: { username: 'juan@example.com' } });
    expect(user.rol).toBe('HUESPED');
    expect(user.guestId).toBe(guest.id);
    expect(bcrypt.compareSync('clave-segura', user.password)).toBe(true);

    const payload = decode(res.body.token);
    expect(payload.rol).toBe('HUESPED');
    expect(payload.guestId).toBe(guest.id);
  });

  test('reclama una ficha existente cuando DNI y email coinciden', async () => {
    const guest = await seedGuest({ email: 'Maria@Example.com' });

    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'María López',
      email: 'maria@example.com',
      dni: guest.dni,
      password: 'clave-segura',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.guestId).toBe(guest.id);

    const guests = await prisma.guest.findMany();
    expect(guests).toHaveLength(1);
  });

  test('email ya registrado responde 409', async () => {
    await registerGuest({ email: 'repetido@example.com', dni: '30000001' });

    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'Otro Huésped',
      email: 'repetido@example.com',
      dni: '30000002',
      password: 'clave-segura',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.token).toBeUndefined();
  });

  test('DNI ya registrado responde 409', async () => {
    await registerGuest({ email: 'uno@example.com', dni: '30000003' });

    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'Otro Huésped',
      email: 'dos@example.com',
      dni: '30000003',
      password: 'clave-segura',
    });

    expect(res.status).toBe(409);
  });

  test('coincidencia parcial de DNI con otro email responde 409', async () => {
    await seedGuest({ dni: '40000001', email: 'titular@example.com' });

    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'Impostor',
      email: 'otro@example.com',
      dni: '40000001',
      password: 'clave-segura',
    });

    expect(res.status).toBe(409);
    const guests = await prisma.guest.findMany({ where: { dni: '40000001' } });
    expect(guests).toHaveLength(1);
    expect(await prisma.user.findUnique({ where: { username: 'otro@example.com' } })).toBeNull();
  });

  test('coincidencia parcial de email con otro DNI responde 409', async () => {
    await seedGuest({ dni: '40000002', email: 'compartido@example.com' });

    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'Impostor',
      email: 'compartido@example.com',
      dni: '40000003',
      password: 'clave-segura',
    });

    expect(res.status).toBe(409);
  });

  test('datos inválidos responden 422 y no crean nada', async () => {
    const res = await request(app).post('/api/v1/auth/guest/register').send({
      nombre: 'Juan',
      email: 'no-es-email',
      dni: '12',
      password: 'corta',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await prisma.user.count()).toBe(2);
    expect(await prisma.guest.count()).toBe(0);
  });
});

describe('Login de huésped', () => {
  test('credenciales válidas emiten token con rol y guestId', async () => {
    const registered = await registerGuest({ email: 'login@example.com', dni: '50000001' });

    const res = await request(app)
      .post('/api/v1/auth/guest/login')
      .send({ email: 'LOGIN@example.com', password: GUEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.nombre).toBe('Huésped de Prueba');
    const payload = decode(res.body.token);
    expect(payload.rol).toBe('HUESPED');
    expect(payload.guestId).toBe(registered.guest.id);
  });

  test('contraseña incorrecta responde 401 sin token', async () => {
    await registerGuest({ email: 'login@example.com', dni: '50000002' });

    const res = await request(app)
      .post('/api/v1/auth/guest/login')
      .send({ email: 'login@example.com', password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('un usuario de personal no puede iniciar sesión como huésped', async () => {
    await prisma.user.update({
      where: { username: 'admin' },
      data: { username: 'admin@example.com' },
    });

    const res = await request(app)
      .post('/api/v1/auth/guest/login')
      .send({ email: 'admin@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  test('el login de personal no se altera', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.rol).toBe('ADMINISTRADOR');
    expect(res.body.user.guestId).toBeNull();
    expect(res.body.user.nombre).toBeUndefined();
  });
});

describe('Aislamiento entre huésped y personal', () => {
  test('un token de huésped recibe 403 en las rutas de gestión', async () => {
    const { token } = await registerGuest();
    const headers = { Authorization: `Bearer ${token}` };

    const endpoints = [
      '/api/v1/users',
      '/api/v1/guests',
      '/api/v1/rooms',
      '/api/v1/rates',
      '/api/v1/reservations',
      '/api/v1/extras',
      '/api/v1/housekeeping',
      '/api/v1/maintenance',
      '/api/v1/reports',
      '/api/v1/audit',
    ];

    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint).set(headers);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    }
  });

  test('un token de huésped puede consultar disponibilidad', async () => {
    const { token } = await registerGuest();

    const res = await request(app)
      .get('/api/v1/availability')
      .set('Authorization', `Bearer ${token}`)
      .query({ checkIn: day(1), checkOut: day(3) });

    expect(res.status).toBe(200);
  });

  test('el personal conserva el acceso a las rutas de gestión', async () => {
    const token = await tokenFor('recepcionista');
    const res = await request(app)
      .get('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('un token de personal recibe 403 en la ruta de huésped', async () => {
    const token = await tokenFor('admin');
    const res = await request(app)
      .get('/api/v1/guest/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
