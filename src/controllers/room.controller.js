const roomService = require('../services/room.service');

async function createRoom(req, res, next) {
  try {
    const room = await roomService.createRoom(req.body, req.user);
    return res.status(201).json(room);
  } catch (err) {
    return next(err);
  }
}

async function listRooms(req, res, next) {
  try {
    const [total, items] = await roomService.listRooms(req.query);
    const page = req.query.page;
    const pageSize = req.query.pageSize;
    return res.json({ data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    return next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body, req.user);
    return res.json(room);
  } catch (err) {
    return next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    await roomService.deleteRoom(req.params.id, req.user);
    return res.json({ message: 'Habitación eliminada' });
  } catch (err) {
    return next(err);
  }
}

async function getRoom(req, res, next) {
  try {
    const room = await roomService.getRoom(req.params.id);
    return res.json(room);
  } catch (err) {
    return next(err);
  }
}

async function getRoomHousekeeping(req, res, next) {
  try {
    const data = await roomService.getRoomHousekeeping(req.params.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createRoom, listRooms, updateRoom, deleteRoom, getRoom, getRoomHousekeeping };
