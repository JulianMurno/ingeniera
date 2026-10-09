const extrasService = require('../services/extras.service');

async function listExtras(req, res, next) {
  try {
    const [total, items] = await extrasService.listExtras(req.query, req.user);
    const { page, pageSize } = req.query;
    return res.json({ data: items, pagination: { page, pageSize, total } });
  } catch (err) {
    return next(err);
  }
}

async function createExtra(req, res, next) {
  try {
    const extra = await extrasService.createExtra(req.body);
    return res.status(201).json(extra);
  } catch (err) {
    return next(err);
  }
}

async function updateExtra(req, res, next) {
  try {
    const extra = await extrasService.updateExtra(req.params.id, req.body);
    return res.json(extra);
  } catch (err) {
    return next(err);
  }
}

async function deleteExtra(req, res, next) {
  try {
    const extra = await extrasService.deleteExtra(req.params.id);
    return res.json(extra);
  } catch (err) {
    return next(err);
  }
}

async function getConsumo(req, res, next) {
  try {
    const reporte = await extrasService.consumo(req.query.desde, req.query.hasta);
    return res.json(reporte);
  } catch (err) {
    return next(err);
  }
}

async function createCharge(req, res, next) {
  try {
    const charge = await extrasService.registrarCargo(req.params.id, req.body, req.user.id);
    return res.status(201).json(charge);
  } catch (err) {
    return next(err);
  }
}

async function listCharges(req, res, next) {
  try {
    const result = await extrasService.listarCargos(req.params.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function cancelCharge(req, res, next) {
  try {
    const charge = await extrasService.anularCargo(req.params.id, req.params.chargeId, req.user.id);
    return res.json(charge);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  getConsumo,
  createCharge,
  listCharges,
  cancelCharge,
};
