const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, prisma, resetDb, tokenFor, TEST_PASSWORD } = require('../helpers/db');

async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      username: 'recepcion2',
      password: bcrypt.hashSync(TEST_PASSWORD, 10),
      rol: 'RECEPCIONISTA',
      activo: true,
      ...overrides,
    },
  });
}

async function loginAs(username) {
  return request(app).post('/api/v1/auth/login').send({ username, password: TEST_PASSWORD });
}

beforeEach(resetDb);

describe('POST /users', () => {
  test('alta autorizada: el administrador crea un usuario y recibe 201', async () => {
    const token = await tokenFor('admin');

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'recepcion2', password: TEST_PASSWORD, rol: 'RECEPCIONISTA' });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe('recepcion2');
    expect(res.body.rol).toBe('RECEPCIONISTA');
    expect(res.body.activo).toBe(true);
    expect(res.body.password).toBeUndefined();

    const login = await loginAs('recepcion2');
    expect(login.status).toBe(200);
  });

  test('la contraseña se persiste hasheada con bcrypt', async () => {
    const token = await tokenFor('admin');

    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'recepcion2', password: TEST_PASSWORD, rol: 'RECEPCIONISTA' });

    const user = await prisma.user.findUnique({ where: { username: 'recepcion2' } });
    expect(user.password).not.toBe(TEST_PASSWORD);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  test('username duplicado responde 409 y no crea el usuario', async () => {
    const token = await tokenFor('admin');

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'recepcionista', password: 'clave-123', rol: 'RECEPCIONISTA' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(await prisma.user.count({ where: { username: 'recepcionista' } })).toBe(1);
  });

  test('el recepcionista recibe 403 y no crea el usuario', async () => {
    const token = await tokenFor('recepcionista');

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'recepcion2', password: 'clave-123', rol: 'RECEPCIONISTA' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(await prisma.user.count({ where: { username: 'recepcion2' } })).toBe(0);
  });

  test('sin token responde 401', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ username: 'recepcion2', password: 'clave-123', rol: 'RECEPCIONISTA' });

    expect(res.status).toBe(401);
  });

  test('datos inválidos responden 422', async () => {
    const token = await tokenFor('admin');

    const casos = [
      {},
      { username: 'recepcion2', password: '123', rol: 'RECEPCIONISTA' },
      { username: 'recepcion2', password: 'clave-123', rol: 'SUPERVISOR' },
      { username: 'a b', password: 'clave-123', rol: 'RECEPCIONISTA' },
    ];

    for (const body of casos) {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }

    expect(await prisma.user.count({ where: { username: 'recepcion2' } })).toBe(0);
  });
});

describe('GET /users', () => {
  test('listado exitoso sin exponer contraseñas', async () => {
    const token = await tokenFor('recepcionista');

    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    for (const user of res.body.data) {
      expect(user.password).toBeUndefined();
      expect(user).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          username: expect.any(String),
          rol: expect.any(String),
          activo: expect.any(Boolean),
        }),
      );
    }
  });

  test('el listado incluye también a los usuarios desactivados', async () => {
    const token = await tokenFor('admin');
    await createUser({ username: 'inactivo' });
    await prisma.user.update({ where: { username: 'inactivo' }, data: { activo: false } });

    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((u) => u.username)).toContain('inactivo');
  });

  test('sin token responde 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /users/{id}', () => {
  test('edición autorizada de username, rol y contraseña', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'recepcion3', rol: 'ADMINISTRADOR', password: 'clave-456' });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('recepcion3');
    expect(res.body.rol).toBe('ADMINISTRADOR');
    expect(res.body.password).toBeUndefined();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'recepcion3', password: 'clave-456' });
    expect(login.status).toBe(200);
    expect(login.body.user.rol).toBe('ADMINISTRADOR');
  });

  test('el administrador puede restablecer la contraseña sin conocer la anterior', async () => {
    const token = await tokenFor('admin');
    const target = await createUser({ password: bcrypt.hashSync('vieja-123', 10) });

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'reset-456' });

    expect(res.status).toBe(200);
    expect((await loginAs('recepcion2')).status).toBe(401);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'recepcion2', password: 'reset-456' });
    expect(login.status).toBe(200);
  });

  test('edición de un usuario inexistente responde 404', async () => {
    const token = await tokenFor('admin');

    const res = await request(app)
      .patch('/api/v1/users/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'nuevo' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('el recepcionista recibe 403', async () => {
    const token = await tokenFor('recepcionista');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'otro' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    const user = await prisma.user.findUnique({ where: { id: target.id } });
    expect(user.username).toBe('recepcion2');
  });

  test('username duplicado en la edición responde 409', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'admin' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('reenviar el mismo username no responde 409', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'recepcion2', rol: 'ADMINISTRADOR' });

    expect(res.status).toBe(200);
  });

  test('un body vacío responde 422', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /users/{id}', () => {
  test('desactivación exitosa: el usuario desactivado no puede iniciar sesión', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();
    expect((await loginAs('recepcion2')).status).toBe(200);

    const res = await request(app)
      .delete(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(false);
    expect(res.body.password).toBeUndefined();

    const login = await loginAs('recepcion2');
    expect(login.status).toBe(401);
    expect(login.body.error.code).toBe('UNAUTHORIZED');
    expect(login.body.token).toBeUndefined();
  });

  test('la desactivación es lógica: el usuario y su historial se conservan', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();

    await request(app).delete(`/api/v1/users/${target.id}`).set('Authorization', `Bearer ${token}`);

    const user = await prisma.user.findUnique({ where: { id: target.id } });
    expect(user).not.toBeNull();
    expect(user.activo).toBe(false);
  });

  test('reactivación exitosa: el usuario vuelve a poder iniciar sesión', async () => {
    const token = await tokenFor('admin');
    const target = await createUser();
    await request(app).delete(`/api/v1/users/${target.id}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: true });

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(true);
    expect((await loginAs('recepcion2')).status).toBe(200);
  });

  test('el recepcionista recibe 403', async () => {
    const token = await tokenFor('recepcionista');
    const target = await createUser();

    const res = await request(app)
      .delete(`/api/v1/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('desactivar un usuario inexistente responde 404', async () => {
    const token = await tokenFor('admin');

    const res = await request(app)
      .delete('/api/v1/users/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('el administrador no puede desactivar su propio usuario', async () => {
    const token = await tokenFor('admin');
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });

    const res = await request(app)
      .delete(`/api/v1/users/${admin.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});
