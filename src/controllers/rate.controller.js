const rateService = require('../services/rate.service');

async function createSeason(req, res, next) {
  try {
    const season = await rateService.createSeason(req.body);
    return res.status(201).json(season);
  } catch (err) {
    return next(err);
  }
}

async function listSeasons(req, res, next) {
  try {
    const seasons = await rateService.listSeasons(req.query);
    return res.json(seasons);
  } catch (err) {
    return next(err);
  }
}

async function deleteSeason(req, res, next) {
  try {
    await rateService.deleteSeason(req.params.id);
    return res.json({ message: 'Temporada eliminada' });
  } catch (err) {
    return next(err);
  }
}

async function createWeekdayRate(req, res, next) {
  try {
    const rate = await rateService.createWeekdayRate(req.body);
    return res.status(201).json(rate);
  } catch (err) {
    return next(err);
  }
}

async function listWeekdayRates(req, res, next) {
  try {
    const rates = await rateService.listWeekdayRates(req.query);
    return res.json(rates);
  } catch (err) {
    return next(err);
  }
}

async function deleteWeekdayRate(req, res, next) {
  try {
    await rateService.deleteWeekdayRate(req.params.id);
    return res.json({ message: 'Tarifa por día de semana eliminada' });
  } catch (err) {
    return next(err);
  }
}

async function quoteRates(req, res, next) {
  try {
    const detail = await rateService.getDetalleTarifas(req.query);
    return res.json(detail);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createSeason,
  createWeekdayRate,
  deleteSeason,
  deleteWeekdayRate,
  listSeasons,
  listWeekdayRates,
  quoteRates,
};
