const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
} = require('../schemas/maintenance.schema');
const { idParamSchema } = require('../schemas/room.schema');
const { createTicket, listTickets, getTicket, updateTicket } = require('../controllers/maintenance.controller');

const router = Router();

router.use(requireAuth);

router.post('/tickets', validate(createTicketSchema), createTicket);
router.get('/tickets', validate(ticketQuerySchema, 'query'), listTickets);
router.get('/tickets/:id', validate(idParamSchema, 'params'), getTicket);
router.patch('/tickets/:id', validate(idParamSchema, 'params'), validate(updateTicketSchema), updateTicket);

module.exports = router;
