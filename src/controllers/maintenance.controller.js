const maintenanceService = require('../services/maintenance.service');

async function createTicket(req, res, next) {
  try {
    const ticket = await maintenanceService.createTicket(req.body, req.user.id);
    return res.status(201).json(ticket);
  } catch (err) {
    return next(err);
  }
}

async function listTickets(req, res, next) {
  try {
    const [total, items] = await maintenanceService.listTickets(req.query);
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;
    return res.json({ data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    return next(err);
  }
}

async function getTicket(req, res, next) {
  try {
    const ticket = await maintenanceService.getTicket(req.params.id);
    return res.status(200).json(ticket);
  } catch (err) {
    return next(err);
  }
}

async function updateTicket(req, res, next) {
  try {
    const ticket = await maintenanceService.updateTicket(req.params.id, req.body, req.user);
    return res.status(200).json(ticket);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
};
