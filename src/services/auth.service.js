const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userRepo = require('../repositories/user.repository');
const tokenRepo = require('../repositories/tokenInvalidado.repository');
const { HttpError } = require('../lib/httpError');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const { getJwtExpiresIn } = require('../config/authConfig');

const SALT_ROUNDS = 10;

function toPublicUser(user) {
  return { id: user.id, username: user.username, rol: user.rol, activo: user.activo };
}

async function login(username, password) {
  const user = await userRepo.findByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Credenciales inválidas');
  }
  if (!user.activo) {
    throw new HttpError(401, 'UNAUTHORIZED', 'El usuario está desactivado');
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, rol: user.rol, jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: getJwtExpiresIn() },
  );

  return { token, user: toPublicUser(user) };
}

async function logout(jti, exp) {
  if (!jti || !exp) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token inválido o vencido');
  }
  await tokenRepo.revoke(jti, new Date(exp * 1000));
  return { message: 'Sesión cerrada' };
}

async function changeOwnPassword(userId, currentPassword, newPassword) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  }
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new HttpError(401, 'UNAUTHORIZED', 'La contraseña actual es incorrecta');
  }

  const password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  return userRepo.update(userId, { password });
}

module.exports = { login, logout, changeOwnPassword, toPublicUser };
