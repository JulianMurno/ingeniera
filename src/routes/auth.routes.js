const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  loginSchema,
  guestRegisterSchema,
  guestLoginSchema,
  changePasswordSchema,
} = require('../schemas/auth.schema');
const { login, logout, changePassword } = require('../controllers/auth.controller');
const guestAuthController = require('../controllers/guest-auth.controller');

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/guest/register', validate(guestRegisterSchema), guestAuthController.register);
router.post('/guest/login', validate(guestLoginSchema), guestAuthController.login);
router.post('/logout', requireAuth, logout);
router.patch('/password', requireAuth, validate(changePasswordSchema), changePassword);

module.exports = router;
