const { Router } = require('express');
const dashboardController = require('./dashboard.controller');

const router = Router();

/**
 * @route   GET /api/v1/dashboard/summary
 * @desc    Get aggregated dashboard statistics
 * @access  Public
 */
router.get('/summary', dashboardController.getSummary);

module.exports = router;
