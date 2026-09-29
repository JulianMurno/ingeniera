const prisma = require('../lib/prisma');

async function revoke(jti, expiraEn) {
  await prisma.$transaction([
    prisma.tokenInvalidado.deleteMany({ where: { expiraEn: { lt: new Date() } } }),
    prisma.tokenInvalidado.create({ data: { jti, expiraEn } }),
  ]);
}

async function isRevoked(jti) {
  if (!jti) return false;
  const found = await prisma.tokenInvalidado.findUnique({ where: { jti } });
  return Boolean(found);
}

module.exports = { revoke, isRevoked };
