const jwt = require('jsonwebtoken');
const { HttpError } = require('../lib/httpError');
const tokenRepo = require('../repositories/tokenInvalidado.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Token requerido'));
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Token inválido o vencido'));
  }

  try {
    if (await tokenRepo.isRevoked(payload.jti)) {
      return next(new HttpError(401, 'UNAUTHORIZED', 'Token invalidado'));
    }
  } catch (err) {
    return next(err);
  }

  req.user = { id: payload.sub, username: payload.username, rol: payload.rol };
  if (payload.guestId !== undefined && payload.guestId !== null) {
    req.user.guestId = payload.guestId;
  }
  req.token = { jti: payload.jti, exp: payload.exp };
  return next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return next(new HttpError(403, 'FORBIDDEN', 'No autorizado para esta operación'));
    }
    return next();
  };
}

function requireGuest(req, res, next) {
  if (!req.user || req.user.rol !== 'HUESPED' || req.user.guestId === undefined) {
    return next(new HttpError(403, 'FORBIDDEN', 'Acceso exclusivo para huéspedes'));
  }
  return next();
}

const requireStaff = authorize('ADMINISTRADOR', 'RECEPCIONISTA');

module.exports = { requireAuth, authorize, requireGuest, requireStaff, JWT_SECRET };
