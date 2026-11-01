const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.registerGuest(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginGuest(req.body.email, req.body.password);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };
