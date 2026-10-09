const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { auditQuerySchema } = require('../schemas/audit.schema');
const { listAuditLogs } = require('../controllers/audit.controller');

const router = Router();

router.use(requireAuth, authorize('ADMINISTRADOR'));

router.get('/', validate(auditQuerySchema, 'query'), listAuditLogs);

module.exports = router;
