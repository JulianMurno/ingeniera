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
const reportRoutes = require('./report.routes');
const auditRoutes = require('./audit.routes');
const healthRoutes = require('./health.routes');

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
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);
router.use('/health', healthRoutes);

module.exports = router;
