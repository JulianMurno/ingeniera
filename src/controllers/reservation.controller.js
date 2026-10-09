const reservationService = require('../services/reservation.service');

async function createReservation(req, res, next) {
  try {
    const reservation = await reservationService.createReservation(req.body);
    return res.status(201).json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function listReservations(req, res, next) {
  try {
    const [total, items] = await reservationService.listReservations(req.query);
    const page = req.query.page;
    const pageSize = req.query.pageSize;
    return res.json({ data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    return next(err);
  }
}

async function getReservation(req, res, next) {
  try {
    const incluirCargos = req.query.incluirCargos === 'true';
    const reservation = await reservationService.getReservation(req.params.id, { incluirCargos });
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function updateReservation(req, res, next) {
  try {
    const reservation = await reservationService.updateReservation(req.params.id, req.body);
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const reservation = await reservationService.cancelReservation(req.params.id, req.body);
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function checkInReservation(req, res, next) {
  try {
    const reservation = await reservationService.checkInReservation(req.params.id);
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function checkOutReservation(req, res, next) {
  try {
    const reservation = await reservationService.checkOutReservation(req.params.id);
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function markNoShow(req, res, next) {
  try {
    const reservation = await reservationService.markNoShow(req.params.id);
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createReservation,
  listReservations,
  getReservation,
  updateReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  markNoShow,
};
