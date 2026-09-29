require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = bcrypt.hashSync(process.env.SEED_PASSWORD || '123456', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { activo: true },
    create: { username: 'admin', password, rol: 'ADMINISTRADOR', activo: true },
  });

  await prisma.user.upsert({
    where: { username: 'recepcionista' },
    update: { activo: true },
    create: { username: 'recepcionista', password, rol: 'RECEPCIONISTA', activo: true },
  });

  console.log('Usuarios sembrados: admin (ADMINISTRADOR) y recepcionista (RECEPCIONISTA)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
