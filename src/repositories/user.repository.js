const prisma = require('../lib/prisma');

const publicFields = { id: true, username: true, rol: true, activo: true, createdAt: true };

function findByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

function findMany() {
  return prisma.user.findMany({ select: publicFields, orderBy: { id: 'asc' } });
}

function create(data) {
  return prisma.user.create({ data, select: publicFields });
}

function update(id, data) {
  return prisma.user.update({ where: { id }, data, select: publicFields });
}

function setActivo(id, activo) {
  return prisma.user.update({ where: { id }, data: { activo }, select: publicFields });
}

module.exports = { findByUsername, findById, findMany, create, update, setActivo };
