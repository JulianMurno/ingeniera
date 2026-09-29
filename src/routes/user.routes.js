const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { userCreateSchema, userUpdateSchema } = require('../schemas/user.schema');
const { idParamSchema } = require('../schemas/room.schema');
const { createUser, listUsers, updateUser, deleteUser } = require('../controllers/user.controller');

const router = Router();

router.use(requireAuth);

router.post('/', authorize('ADMINISTRADOR'), validate(userCreateSchema), createUser);
router.get('/', listUsers);
router.patch(
  '/:id',
  authorize('ADMINISTRADOR'),
  validate(userUpdateSchema),
  validate(idParamSchema, 'params'),
  updateUser,
);
router.delete('/:id', authorize('ADMINISTRADOR'), validate(idParamSchema, 'params'), deleteUser);

module.exports = router;
