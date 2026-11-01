const prisma = require('../lib/prisma');

function create(data, tx) {
  const client = tx || prisma;
  return client.guest.create({ data });
}

function findByDni(dni, tx) {
  const client = tx || prisma;
  return client.guest.findUnique({ where: { dni }, include: { accounts: true } });
}

function findByEmail(email, tx) {
  const client = tx || prisma;
  return client.guest.findFirst({
    where: { email: email.toLowerCase(), activo: true },
    include: { accounts: true },
  });
}

function findByDniExcluding(dni, excludeId) {
  return prisma.guest.findFirst({ where: { dni, id: { not: excludeId }, activo: true } });
}

function findById(id) {
  return prisma.guest.findUnique({ where: { id } });
}

function findActiveById(id) {
  return prisma.guest.findFirst({ where: { id, activo: true } });
}

function findMany({ dni, nombre, page = 1, pageSize = 10 } = {}) {
  const where = {
    activo: true,
    dni: dni ? { contains: dni } : undefined,
    nombre: nombre ? { contains: nombre } : undefined,
  };

  return prisma
    .$transaction([
      prisma.guest.count({ where }),
      prisma.guest.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    .then(([total, guests]) => [total, guests]);
}

function update(id, data) {
  return prisma.guest.update({ where: { id }, data });
}

function archive(id) {
  return prisma.guest.update({ where: { id }, data: { activo: false } });
}

module.exports = {
  create,
  findByDni,
  findByDniExcluding,
  findByEmail,
  findById,
  findActiveById,
  findMany,
  update,
  archive,
};
