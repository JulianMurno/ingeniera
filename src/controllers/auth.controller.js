const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.username, req.body.password);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.token.jti, req.token.exp);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const user = await authService.changeOwnPassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, changePassword };
