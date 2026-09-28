const prisma = require('../lib/prisma');

function create(data) {
  return prisma.guest.create({ data });
}

function findByDni(dni) {
  return prisma.guest.findUnique({ where: { dni } });
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
  findById,
  findActiveById,
  findMany,
  update,
  archive,
};
