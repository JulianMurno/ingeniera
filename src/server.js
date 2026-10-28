require('dotenv').config();

const path = require('path');
const next = require('next');

const { createApp } = require('./app');

// `node src/server.js --production` keeps NODE_ENV cross-platform without
// needing cross-env (npm's `set VAR=...` syntax is shell-specific).
if (process.argv.includes('--production')) {
  process.env.NODE_ENV = 'production';
}

const dev = process.env.NODE_ENV !== 'production';
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const nextApp = next({ dev, dir: path.join(__dirname, 'frontend') });
const handle = nextApp.getRequestHandler();

async function main() {
  try {
    await nextApp.prepare();
  } catch (err) {
    console.error('Error al preparar Next.js:', err);
    throw err;
  }

  const app = createApp({ ui: handle });

  app.listen(PORT, HOST, () => {
    console.log(`App disponible en http://localhost:${PORT}`);
    console.log(`API en http://localhost:${PORT}/api/v1`);
    console.log(`Docs Swagger en http://localhost:${PORT}/api/docs`);
  });
}

main().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
