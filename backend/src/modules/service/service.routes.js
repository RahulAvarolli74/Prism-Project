const { Router } = require('express');
const serviceController = require('./service.controller');

const router = Router();

/**
 * @route   GET /api/v1/services
 * @desc    List all registered microservices
 * @access  Public
 */
router.get('/', serviceController.list);

/**
 * @route   GET /api/v1/services/dependencies
 * @desc    Get service dependency graph
 * @access  Public
 */
router.get('/dependencies', serviceController.getDependencies);

/**
 * @route   GET /api/v1/services/:name
 * @desc    Get service details with recent telemetry & predictions
 * @access  Public
 */
router.get('/:name', serviceController.getByName);

module.exports = router;
