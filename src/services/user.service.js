const bcrypt = require('bcryptjs');

const userRepo = require('../repositories/user.repository');
const { HttpError } = require('../lib/httpError');

const SALT_ROUNDS = 10;

async function getExisting(id) {
  const user = await userRepo.findById(id);
  if (!user) {
    throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  }
  return user;
}

async function assertUsernameAvailable(username, excludeId) {
  const existing = excludeId
    ? await userRepo.findByUsername(username).then((found) => (found && found.id !== excludeId ? found : null))
    : await userRepo.findByUsername(username);
  if (existing) {
    throw new HttpError(409, 'CONFLICT', 'Ya existe un usuario con ese nombre');
  }
}

async function createUser(data) {
  await assertUsernameAvailable(data.username);
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  return userRepo.create({ username: data.username, password, rol: data.rol, activo: true });
}

function listUsers() {
  return userRepo.findMany();
}

async function updateUser(id, data) {
  const existing = await getExisting(id);

  if (data.username !== undefined && data.username !== existing.username) {
    await assertUsernameAvailable(data.username, id);
  }

  const changes = {};
  if (data.username !== undefined) changes.username = data.username;
  if (data.rol !== undefined) changes.rol = data.rol;
  if (data.activo !== undefined) changes.activo = data.activo;
  if (data.password !== undefined) {
    changes.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  return userRepo.update(id, changes);
}

async function deactivateUser(id, requesterId) {
  const existing = await getExisting(id);
  if (existing.id === requesterId) {
    throw new HttpError(409, 'CONFLICT', 'El administrador no puede desactivar su propio usuario');
  }
  return userRepo.setActivo(id, false);
}

module.exports = { createUser, listUsers, updateUser, deactivateUser };
