const housekeepingService = require('../services/housekeeping.service');

async function createTask(req, res, next) {
  try {
    const task = await housekeepingService.createTask(req.body);
    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

async function listTasks(req, res, next) {
  try {
    const [total, items] = await housekeepingService.listTasks(req.query);
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;
    return res.json({ data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    return next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await housekeepingService.updateTask(req.params.id, req.body, req.user);
    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
}

async function getResumen(req, res, next) {
  try {
    const resumen = await housekeepingService.getResumen(req.query);
    return res.status(200).json(resumen);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  updateTask,
  getResumen,
};
