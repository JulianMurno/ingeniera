const { Router } = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const guestRoutes = require('./guest.routes');
const roomRoutes = require('./room.routes');
const rateRoutes = require('./rate.routes');
const availabilityRoutes = require('./availability.routes');
const reservationRoutes = require('./reservation.routes');
const housekeepingRoutes = require('./housekeeping.routes');
const maintenanceRoutes = require('./maintenance.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/guests', guestRoutes);
router.use('/rooms', roomRoutes);
router.use('/rates', rateRoutes);
router.use('/availability', availabilityRoutes);
router.use('/reservations', reservationRoutes);
router.use('/housekeeping', housekeepingRoutes);
router.use('/maintenance', maintenanceRoutes);

module.exports = router;
