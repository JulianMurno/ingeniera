const reportService = require('../services/report.service');

async function getOcupacion(req, res, next) {
  try {
    const report = await reportService.ocupacion(req.query);
    return res.json(report);
  } catch (err) {
    return next(err);
  }
}

async function getIngresos(req, res, next) {
  try {
    const report = await reportService.ingresos(req.query);
    return res.json(report);
  } catch (err) {
    return next(err);
  }
}

async function getReservasPorTipo(req, res, next) {
  try {
    const report = await reportService.reservasPorTipo(req.query);
    return res.json(report);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getIngresos, getOcupacion, getReservasPorTipo };
