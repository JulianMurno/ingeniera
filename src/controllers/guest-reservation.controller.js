const guestService = require('../services/guest.service');
const reservationService = require('../services/reservation.service');

async function me(req, res, next) {
  try {
    const guest = await guestService.getOwnGuest(req.user.guestId);
    return res.json(guest);
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const [total, items] = await reservationService.listGuestReservations(
      req.user.guestId,
      req.query,
    );
    return res.json({
      data: items,
      pagination: { page: req.query.page, pageSize: req.query.pageSize, total },
    });
  } catch (err) {
    return next(err);
  }
}

async function get(req, res, next) {
  try {
    const reservation = await reservationService.getGuestReservation(
      req.user.guestId,
      req.params.id,
    );
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const reservation = await reservationService.createGuestReservation(req.body, req.user);
    return res.status(201).json(reservation);
  } catch (err) {
    return next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const reservation = await reservationService.cancelGuestReservation(
      req.user.guestId,
      req.params.id,
      req.body,
      req.user,
    );
    return res.json(reservation);
  } catch (err) {
    return next(err);
  }
}

module.exports = { me, list, get, create, cancel };
