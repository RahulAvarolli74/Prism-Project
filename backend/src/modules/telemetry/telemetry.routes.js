const { Router } = require('express');
const telemetryController = require('./telemetry.controller');
const telemetryValidations = require('./telemetry.validator');
const validate = require('../../middlewares/validation.middleware');

const router = Router();

/**
 * @route   POST /api/v1/telemetry
 * @desc    Ingest telemetry data from a microservice
 * @access  Public
 */
router.post(
  '/',
  validate(telemetryValidations.ingest),
  telemetryController.ingest
);

/**
 * @route   GET /api/v1/telemetry
 * @desc    List telemetry records with pagination & filters
 * @query   page, limit, serviceName, startDate, endDate
 * @access  Public
 */
router.get(
  '/',
  validate(telemetryValidations.list),
  telemetryController.list
);

/**
 * @route   GET /api/v1/telemetry/:id
 * @desc    Get a single telemetry record by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(telemetryValidations.getById),
  telemetryController.getById
);

module.exports = router;
