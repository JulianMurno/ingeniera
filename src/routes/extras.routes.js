const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  extraCreateSchema,
  extraUpdateSchema,
  extraQuerySchema,
  extraConsumoQuerySchema,
} = require('../schemas/extras.schema');
const { idParamSchema } = require('../schemas/room.schema');
const {
  listExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  getConsumo,
} = require('../controllers/extras.controller');

const router = Router();

router.use(requireAuth);

router.get('/', validate(extraQuerySchema, 'query'), listExtras);
router.get('/consumo', validate(extraConsumoQuerySchema, 'query'), getConsumo);
router.post('/', authorize('ADMINISTRADOR'), validate(extraCreateSchema), createExtra);
router.patch(
  '/:id',
  authorize('ADMINISTRADOR'),
  validate(idParamSchema, 'params'),
  validate(extraUpdateSchema),
  updateExtra,
);
router.delete(
  '/:id',
  authorize('ADMINISTRADOR'),
  validate(idParamSchema, 'params'),
  deleteExtra,
);

module.exports = router;
