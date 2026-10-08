const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { reportQuerySchema } = require('../schemas/report.schema');
const {
  getIngresos,
  getOcupacion,
  getReservasPorTipo,
} = require('../controllers/report.controller');

const router = Router();

router.use(requireAuth);

router.get('/ocupacion', validate(reportQuerySchema, 'query'), getOcupacion);
router.get('/ingresos', validate(reportQuerySchema, 'query'), getIngresos);
router.get('/reservas-por-tipo', validate(reportQuerySchema, 'query'), getReservasPorTipo);

module.exports = router;
