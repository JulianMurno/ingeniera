const auditService = require('../services/audit.service');

async function listAuditLogs(req, res, next) {
  try {
    const [total, items] = await auditService.listAuditLogs(req.query);
    return res.json({
      data: items,
      pagination: { page: req.query.page, pageSize: req.query.pageSize, total },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAuditLogs };
