const auditRepo = require('../repositories/audit.repository');
const { addDays, toDate } = require('./business.service');

async function listAuditLogs({ userId, accion, recurso, desde, hasta, page, pageSize }) {
  const where = {
    userId,
    accion,
    recurso,
    createdAt:
      desde || hasta
        ? {
            gte: desde ? toDate(desde) : undefined,
            lt: hasta ? addDays(toDate(hasta), 1) : undefined,
          }
        : undefined,
  };

  return auditRepo.findMany({ where, page, pageSize });
}

module.exports = { listAuditLogs };
