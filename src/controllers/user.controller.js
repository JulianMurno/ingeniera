const userService = require('../services/user.service');

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (err) {
    return next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    return res.json({ data: users });
  } catch (err) {
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await userService.deactivateUser(req.params.id, req.user.id);
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createUser, listUsers, updateUser, deleteUser };
