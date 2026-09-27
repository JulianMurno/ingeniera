const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  rateIdParamSchema,
  rateListQuerySchema,
  rateQuoteQuerySchema,
  seasonCreateSchema,
  weekdayRateCreateSchema,
} = require('../schemas/rate.schema');
const {
  createSeason,
  createWeekdayRate,
  deleteSeason,
  deleteWeekdayRate,
  listSeasons,
  listWeekdayRates,
  quoteRates,
} = require('../controllers/rate.controller');

const router = Router();

router.use(requireAuth);

router.post('/seasons', authorize('ADMINISTRADOR'), validate(seasonCreateSchema), createSeason);
router.get('/seasons', validate(rateListQuerySchema, 'query'), listSeasons);
router.delete(
  '/seasons/:id',
  authorize('ADMINISTRADOR'),
  validate(rateIdParamSchema, 'params'),
  deleteSeason,
);

router.post(
  '/weekdays',
  authorize('ADMINISTRADOR'),
  validate(weekdayRateCreateSchema),
  createWeekdayRate,
);
router.get('/weekdays', validate(rateListQuerySchema, 'query'), listWeekdayRates);
router.delete(
  '/weekdays/:id',
  authorize('ADMINISTRADOR'),
  validate(rateIdParamSchema, 'params'),
  deleteWeekdayRate,
);

router.get('/quote', validate(rateQuoteQuerySchema, 'query'), quoteRates);

module.exports = router;
