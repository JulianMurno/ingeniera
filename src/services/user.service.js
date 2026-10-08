const bcrypt = require('bcryptjs');

const userRepo = require('../repositories/user.repository');
const { HttpError } = require('../lib/httpError');
const { audit, ACCIONES, RECURSOS } = require('../lib/audit');

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

async function createUser(data, actor = null) {
  await assertUsernameAvailable(data.username);
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await userRepo.create({
    username: data.username,
    password,
    rol: data.rol,
    activo: true,
  });

  await audit({
    actor,
    accion: ACCIONES.CREAR,
    recurso: RECURSOS.USUARIO,
    recursoId: user.id,
    detalle: { username: user.username, rol: user.rol },
  });

  return user;
}

function listUsers() {
  return userRepo.findMany();
}

async function updateUser(id, data, actor = null) {
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

  const user = await userRepo.update(id, changes);

  await audit({
    actor,
    accion: ACCIONES.MODIFICAR,
    recurso: RECURSOS.USUARIO,
    recursoId: id,
    detalle: { campos: Object.keys(changes), username: user.username, rol: user.rol },
  });

  return user;
}

async function deactivateUser(id, actor = null) {
  const existing = await getExisting(id);
  if (actor && existing.id === Number(actor.id)) {
    throw new HttpError(409, 'CONFLICT', 'El administrador no puede desactivar su propio usuario');
  }
  const user = await userRepo.setActivo(id, false);

  await audit({
    actor,
    accion: ACCIONES.ELIMINAR,
    recurso: RECURSOS.USUARIO,
    recursoId: id,
    detalle: { username: user.username, activo: false },
  });

  return user;
}

module.exports = { createUser, listUsers, updateUser, deactivateUser };
