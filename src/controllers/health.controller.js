const prisma = require('../lib/prisma');

async function getHealth(req, res) {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'ok', api: 'ok', db: 'ok', timestamp });
  } catch (err) {
    console.error('Health check: la base de datos no responde:', err.message);
    return res.status(503).json({ status: 'degraded', api: 'ok', db: 'down', timestamp });
  }
}

module.exports = { getHealth };
