process.env.DATABASE_URL = 'file:./test.db';

const bcrypt = require('bcryptjs');
const request = require('supertest');

const prisma = require('../../src/lib/prisma');
const app = require('../../src/app');

const TEST_PASSWORD = '123456';
const GUEST_PASSWORD = 'huesped123';

let cachedTokens = {};

async function resetDb() {
  await prisma.extraCharge.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.hotelExtra.deleteMany();
  await prisma.housekeepingTask.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.season.deleteMany();
  await prisma.weekdayRate.deleteMany();
  await prisma.room.deleteMany();
  await prisma.tokenInvalidado.deleteMany();
  await prisma.user.deleteMany();
  await prisma.guest.deleteMany();

  const password = bcrypt.hashSync(TEST_PASSWORD, 10);
  await prisma.user.createMany({
    data: [
      { username: 'admin', password, rol: 'ADMINISTRADOR' },
      { username: 'recepcionista', password, rol: 'RECEPCIONISTA' },
    ],
  });

  cachedTokens = {};
}

async function freshTokenFor(username) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ username, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login de test falló para ${username}: ${res.status}`);
  }
  return res.body.token;
}

async function tokenFor(username) {
  if (cachedTokens[username]) return cachedTokens[username];
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ username, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login de test falló para ${username}: ${res.status}`);
  }
  cachedTokens[username] = res.body.token;
  return cachedTokens[username];
}

function authHeader(username) {
  return tokenFor(username).then((token) => `Bearer ${token}`);
}

async function registerGuest(overrides = {}) {
  const data = {
    nombre: 'Huésped de Prueba',
    email: 'huesped@example.com',
    dni: '30000001',
    password: GUEST_PASSWORD,
    ...overrides,
  };
  const res = await request(app).post('/api/v1/auth/guest/register').send(data);
  if (res.status !== 201) {
    throw new Error(`Registro de huésped de test falló: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const guest = await prisma.guest.findUnique({ where: { dni: data.dni } });
  return { ...res.body, guest, email: data.email, dni: data.dni, password: data.password };
}

function withEnv(values, run) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const restore = () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  let result;
  try {
    result = run();
  } catch (err) {
    restore();
    throw err;
  }

  if (result && typeof result.then === 'function') {
    return Promise.resolve(result).finally(restore);
  }
  restore();
  return result;
}

afterAll(() => prisma.$disconnect());

module.exports = {
  app,
  prisma,
  resetDb,
  tokenFor,
  freshTokenFor,
  authHeader,
  registerGuest,
  TEST_PASSWORD,
  GUEST_PASSWORD,
  withEnv,
};
