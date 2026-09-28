const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  guestCreateSchema,
  guestUpdateSchema,
  guestQuerySchema,
} = require('../schemas/guest.schema');
const { idParamSchema } = require('../schemas/room.schema');
const {
  createGuest,
  listGuests,
  getGuest,
  updateGuest,
  deleteGuest,
} = require('../controllers/guest.controller');

const router = Router();

router.use(requireAuth);

router.post('/', validate(guestCreateSchema), createGuest);
router.get('/', validate(guestQuerySchema, 'query'), listGuests);
router.get('/:id', validate(idParamSchema, 'params'), getGuest);
router.patch('/:id', validate(guestUpdateSchema), validate(idParamSchema, 'params'), updateGuest);
router.delete('/:id', validate(idParamSchema, 'params'), deleteGuest);

module.exports = router;
