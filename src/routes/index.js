const { Router } = require('express');

const { requireAuth, requireStaff } = require('../middlewares/auth.middleware');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const guestRoutes = require('./guest.routes');
const roomRoutes = require('./room.routes');
const rateRoutes = require('./rate.routes');
const availabilityRoutes = require('./availability.routes');
const guestPortalRoutes = require('./guest-portal.routes');
const reservationRoutes = require('./reservation.routes');
const extrasRoutes = require('./extras.routes');
const housekeepingRoutes = require('./housekeeping.routes');
const maintenanceRoutes = require('./maintenance.routes');
const reportRoutes = require('./report.routes');
const auditRoutes = require('./audit.routes');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/availability', availabilityRoutes);
router.use('/guest', guestPortalRoutes);

router.use('/users', requireAuth, requireStaff, userRoutes);
router.use('/guests', requireAuth, requireStaff, guestRoutes);
router.use('/rooms', requireAuth, requireStaff, roomRoutes);
router.use('/rates', requireAuth, requireStaff, rateRoutes);
router.use('/reservations', requireAuth, requireStaff, reservationRoutes);
router.use('/extras', requireAuth, requireStaff, extrasRoutes);
router.use('/housekeeping', requireAuth, requireStaff, housekeepingRoutes);
router.use('/maintenance', requireAuth, requireStaff, maintenanceRoutes);
router.use('/reports', requireAuth, requireStaff, reportRoutes);
router.use('/audit', requireAuth, requireStaff, auditRoutes);

module.exports = router;
