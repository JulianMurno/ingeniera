const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app, prisma, resetDb, tokenFor, freshTokenFor, TEST_PASSWORD, withEnv } = require('../helpers/db');
const { JWT_SECRET } = require('../../src/middlewares/auth.middleware');

function decode(token) {
  return jwt.decode(token);
}

function expiredToken(username = 'admin', rol = 'ADMINISTRADOR') {
  return jwt.sign({ sub: 1, username, rol, jti: 'jti-vencido' }, JWT_SECRET, { expiresIn: '-1s' });
}

beforeEach(resetDb);

describe('Auth', () => {
  test('login válido emite un token JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.rol).toBe('ADMINISTRADOR');
  });

  test('credenciales inválidas responden 401 sin token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.token).toBeUndefined();
  });

  test('ruta protegida sin token responde 401', async () => {
    const res = await request(app).get('/api/v1/rooms');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('ruta protegida con token inválido responde 401', async () => {
    const res = await request(app)
      .get('/api/v1/rooms')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  test('acceso denegado por rol: recepcionista no crea habitaciones (403)', async () => {
    const token = await tokenFor('recepcionista');
    const res = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('administrador sí crea habitaciones', async () => {
    const token = await tokenFor('admin');
    const res = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ numero: '101', tipo: 'SINGLE', tarifa: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.numero).toBe('101');
  });
});

describe('Expiración de token', () => {
  test('el token emitido incluye jti y exp', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: TEST_PASSWORD });

    const payload = decode(res.body.token);

    expect(payload.jti).toEqual(expect.any(String));
    expect(payload.jti).toMatch(/^[0-9a-f-]{36}$/);
    expect(payload.exp).toEqual(expect.any(Number));
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('la expiración se toma de JWT_EXPIRES_IN', async () => {
    await withEnv({ JWT_EXPIRES_IN: '2h' }, async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: TEST_PASSWORD });

      const { exp, iat } = decode(res.body.token);
      expect(exp - iat).toBe(2 * 60 * 60);
    });
  });

  test('un JWT_EXPIRES_IN inválido cae en el valor por defecto', async () => {
    await withEnv({ JWT_EXPIRES_IN: 'no-es-una-duracion' }, async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: TEST_PASSWORD });

      const { exp, iat } = decode(res.body.token);
      expect(exp - iat).toBe(8 * 60 * 60);
    });
  });

  test('un token vencido en ruta protegida responde 401', async () => {
    const res = await request(app)
      .get('/api/v1/rooms')
      .set('Authorization', `Bearer ${expiredToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Logout e invalidación de token', () => {
  test('logout responde 200 y el token deja de ser utilizable', async () => {
    const token = await freshTokenFor('recepcionista');

    const before = await request(app)
      .get('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const after = await request(app)
      .get('/api/v1/rooms')
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe('UNAUTHORIZED');
  });

  test('logout invalida únicamente la sesión presentedada', async () => {
    const first = await freshTokenFor('recepcionista');
    const second = await freshTokenFor('recepcionista');

    await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${first}`);

    const res = await request(app)
      .get('/api/v1/rooms')
      .set('Authorization', `Bearer ${second}`);
    expect(res.status).toBe(200);
  });

  test('logout sin token responde 401', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('Cambio de contraseña propia', () => {
  test('cambio exitoso: la nueva contraseña sirve para iniciar sesión', async () => {
    const token = await tokenFor('recepcionista');

    const res = await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'nueva-clave-1' });

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
    expect(res.body.username).toBe('recepcionista');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'recepcionista', password: 'nueva-clave-1' });
    expect(login.status).toBe(200);

    const old = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'recepcionista', password: TEST_PASSWORD });
    expect(old.status).toBe(401);
  });

  test('la contraseña se guarda hasheada con bcrypt', async () => {
    const token = await tokenFor('admin');

    await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'nueva-clave-1' });

    const user = await prisma.user.findUnique({ where: { username: 'admin' } });
    expect(user.password).not.toBe('nueva-clave-1');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  test('contraseña actual incorrecta responde 401 y no cambia la contraseña', async () => {
    const token = await tokenFor('recepcionista');

    const res = await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'incorrecta', newPassword: 'nueva-clave-1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');

    const user = await prisma.user.findUnique({ where: { username: 'recepcionista' } });
    expect(bcrypt.compareSync(TEST_PASSWORD, user.password)).toBe(true);
  });

  test('una contraseña nueva demasiado corta responde 422', async () => {
    const token = await tokenFor('recepcionista');

    const res = await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: '123' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('cambio de contraseña sin token responde 401', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/password')
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'nueva-clave-1' });

    expect(res.status).toBe(401);
  });
});
