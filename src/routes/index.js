const { Router } = require('express');

const authRoutes = require('./auth.routes');
const guestRoutes = require('./guest.routes');
const roomRoutes = require('./room.routes');
const rateRoutes = require('./rate.routes');
const availabilityRoutes = require('./availability.routes');
const reservationRoutes = require('./reservation.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/guests', guestRoutes);
router.use('/rooms', roomRoutes);
router.use('/rates', rateRoutes);
router.use('/availability', availabilityRoutes);
router.use('/reservations', reservationRoutes);

module.exports = router;
