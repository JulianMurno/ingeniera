const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  roomCreateSchema,
  roomUpdateSchema,
  roomQuerySchema,
  idParamSchema,
} = require('../schemas/room.schema');
const {
  createRoom,
  listRooms,
  updateRoom,
  deleteRoom,
  getRoom,
  getRoomHousekeeping,
} = require('../controllers/room.controller');

const router = Router();

router.use(requireAuth);

router.post('/', authorize('ADMINISTRADOR'), validate(roomCreateSchema), createRoom);
router.get('/', validate(roomQuerySchema, 'query'), listRooms);
router.get('/:id', validate(idParamSchema, 'params'), getRoom);
router.get('/:id/housekeeping', validate(idParamSchema, 'params'), getRoomHousekeeping);
router.patch(
  '/:id',
  authorize('ADMINISTRADOR'),
  validate(idParamSchema, 'params'),
  validate(roomUpdateSchema),
  updateRoom,
);
router.delete('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'), deleteRoom);

module.exports = router;
