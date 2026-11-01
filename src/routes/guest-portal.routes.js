const { Router } = require('express');
const { requireAuth, requireGuest } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  guestReservationCreateSchema,
  guestReservationCancelSchema,
  guestReservationQuerySchema,
} = require('../schemas/guest-reservation.schema');
const { idParamSchema } = require('../schemas/room.schema');
const {
  me,
  list,
  get,
  create,
  cancel,
} = require('../controllers/guest-reservation.controller');

const router = Router();

router.use(requireAuth, requireGuest);

router.get('/me', me);
router.get('/reservations', validate(guestReservationQuerySchema, 'query'), list);
router.get('/reservations/:id', validate(idParamSchema, 'params'), get);
router.post('/reservations', validate(guestReservationCreateSchema), create);
router.post(
  '/reservations/:id/cancel',
  validate(idParamSchema, 'params'),
  validate(guestReservationCancelSchema),
  cancel,
);

module.exports = router;
