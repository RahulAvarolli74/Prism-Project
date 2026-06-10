const { Router } = require('express');
const predictionController = require('./prediction.controller');

const router = Router();

/**
 * @route   GET /api/v1/predictions
 * @desc    List predictions with filters (service, failure, date range, confidence)
 * @query   page, limit, service, failure, startDate, endDate, minConfidence
 * @access  Public
 */
router.get('/', predictionController.list);

/**
 * @route   GET /api/v1/predictions/failures/recent
 * @desc    Get recent failure predictions
 * @query   limit
 * @access  Public
 */
router.get('/failures/recent', predictionController.getRecentFailures);

/**
 * @route   GET /api/v1/predictions/nodes/top-affected
 * @desc    Get top affected nodes by failure count
 * @query   limit
 * @access  Public
 */
router.get('/nodes/top-affected', predictionController.getTopAffectedNodes);

/**
 * @route   GET /api/v1/predictions/ml/health
 * @desc    Get ML service health and circuit breaker status
 * @access  Public
 */
router.get('/ml/health', predictionController.getMLHealth);

/**
 * @route   GET /api/v1/predictions/:id
 * @desc    Get a single prediction by ID
 * @access  Public
 */
router.get('/:id', predictionController.getById);

module.exports = router;
