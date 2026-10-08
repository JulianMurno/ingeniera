const request = require('supertest');
const { app } = require('../helpers/db');

describe('Frontend estático', () => {
  test('GET / sirve el index de la aplicación', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('HOTELing');
    expect(res.text).toContain('/app.js');
  });

  test('GET /app.js y /styles.css responden 200', async () => {
    const appJs = await request(app).get('/app.js');
    const styles = await request(app).get('/styles.css');

    expect(appJs.status).toBe(200);
    expect(appJs.text).toContain('/api/v1');
    expect(styles.status).toBe(200);
    expect(styles.text).toContain('login-card');
  });

  test('una ruta desconocida sigue respondiendo 404', async () => {
    const res = await request(app).get('/ruta-inexistente');

    expect(res.status).toBe(404);
  });
});