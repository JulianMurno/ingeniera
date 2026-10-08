const prisma = require('../lib/prisma');

function findMany({ where, page = 1, pageSize = 10 }) {
  return prisma
    .$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, rol: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    .then(([total, rows]) => [total, rows]);
}

module.exports = { findMany };
