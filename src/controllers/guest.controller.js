const guestService = require('../services/guest.service');

async function createGuest(req, res, next) {
  try {
    const guest = await guestService.createGuest(req.body);
    return res.status(201).json(guest);
  } catch (err) {
    return next(err);
  }
}

async function listGuests(req, res, next) {
  try {
    const [total, items] = await guestService.listGuests(req.query);
    const page = req.query.page;
    const pageSize = req.query.pageSize;
    return res.json({ data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    return next(err);
  }
}

async function getGuest(req, res, next) {
  try {
    const guest = await guestService.getGuest(req.params.id);
    return res.json(guest);
  } catch (err) {
    return next(err);
  }
}

async function updateGuest(req, res, next) {
  try {
    const guest = await guestService.updateGuest(req.params.id, req.body);
    return res.json(guest);
  } catch (err) {
    return next(err);
  }
}

async function deleteGuest(req, res, next) {
  try {
    await guestService.deleteGuest(req.params.id);
    return res.json({ message: 'Huésped eliminado' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createGuest, listGuests, getGuest, updateGuest, deleteGuest };
