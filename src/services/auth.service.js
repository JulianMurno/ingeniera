const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const prisma = require('../lib/prisma');
const userRepo = require('../repositories/user.repository');
const guestRepo = require('../repositories/guest.repository');
const tokenRepo = require('../repositories/tokenInvalidado.repository');
const { HttpError } = require('../lib/httpError');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const { getJwtExpiresIn } = require('../config/authConfig');

const SALT_ROUNDS = 10;

function toPublicUser(user) {
  const publicUser = {
    id: user.id,
    username: user.username,
    rol: user.rol,
    activo: user.activo,
    guestId: user.guestId ?? null,
  };
  if (user.guest) {
    publicUser.nombre = user.guest.nombre;
  }
  return publicUser;
}

function signGuestToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      rol: user.rol,
      guestId: user.guestId,
      jti: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: getJwtExpiresIn() },
  );
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeDni(dni) {
  return dni.trim().toUpperCase();
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

async function loginGuest(email, password) {
  const user = await userRepo.findByUsernameWithGuest(normalizeEmail(email));
  if (!user || user.rol !== 'HUESPED' || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Credenciales inválidas');
  }
  if (!user.activo) {
    throw new HttpError(401, 'UNAUTHORIZED', 'El usuario está desactivado');
  }

  return { token: signGuestToken(user), user: toPublicUser(user) };
}

async function registerGuest(data) {
  const email = normalizeEmail(data.email);
  const dni = normalizeDni(data.dni);
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const existingAccount = await userRepo.findByUsernameWithGuest(email, tx);
      if (existingAccount) {
        throw new HttpError(409, 'CONFLICT', 'Ya existe una cuenta con ese email');
      }

      let guest = await guestRepo.findByDni(dni, tx);
      if (guest) {
        if (!guest.activo) {
          throw new HttpError(409, 'CONFLICT', 'El huésped está archivado');
        }
        if (guest.email.toLowerCase() !== email) {
          throw new HttpError(
            409,
            'CONFLICT',
            'El DNI ya está registrado con otro email; los datos no coinciden',
          );
        }
        if (guest.accounts.length > 0) {
          throw new HttpError(409, 'CONFLICT', 'El huésped ya tiene una cuenta asociada');
        }
      } else {
        guest = await guestRepo.findByEmail(email, tx);
        if (guest) {
          throw new HttpError(
            409,
            'CONFLICT',
            'El email ya está registrado con otro DNI; los datos no coinciden',
          );
        }
        guest = await guestRepo.create(
          {
            nombre: data.nombre.trim(),
            email,
            dni,
            telefono: data.telefono ? data.telefono.trim() : null,
          },
          tx,
        );
      }

      return userRepo.createGuestAccount(
        { username: email, password, rol: 'HUESPED', activo: true, guestId: guest.id },
        tx,
      );
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Ya existe una cuenta o ficha con esos datos');
    }
    throw err;
  }

  return { token: signGuestToken(user), user: toPublicUser(user) };
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

module.exports = { login, loginGuest, registerGuest, logout, changeOwnPassword, toPublicUser };
