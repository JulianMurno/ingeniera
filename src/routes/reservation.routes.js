const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  reservationCreateSchema,
  reservationUpdateSchema,
  reservationCancelSchema,
  reservationQuerySchema,
} = require('../schemas/reservation.schema');
const { chargeCreateSchema, chargeParamsSchema } = require('../schemas/extras.schema');
const { idParamSchema } = require('../schemas/room.schema');
const {
  createReservation,
  listReservations,
  getReservation,
  updateReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  markNoShow,
} = require('../controllers/reservation.controller');
const {
  createCharge,
  listCharges,
  cancelCharge,
} = require('../controllers/extras.controller');

const router = Router();

router.use(requireAuth);

router.post('/', validate(reservationCreateSchema), createReservation);
router.get('/', validate(reservationQuerySchema, 'query'), listReservations);
router.get('/:id', validate(idParamSchema, 'params'), getReservation);
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(reservationUpdateSchema),
  updateReservation,
);
router.post(
  '/:id/cancel',
  validate(idParamSchema, 'params'),
  validate(reservationCancelSchema),
  cancelReservation,
);
router.post('/:id/checkin', validate(idParamSchema, 'params'), checkInReservation);
router.post('/:id/checkout', validate(idParamSchema, 'params'), checkOutReservation);
router.post('/:id/no-show', validate(idParamSchema, 'params'), markNoShow);

router.post(
  '/:id/charges',
  validate(idParamSchema, 'params'),
  validate(chargeCreateSchema),
  createCharge,
);
router.get('/:id/charges', validate(idParamSchema, 'params'), listCharges);
router.patch(
  '/:id/charges/:chargeId',
  authorize('ADMINISTRADOR'),
  validate(chargeParamsSchema, 'params'),
  cancelCharge,
);

module.exports = router;
