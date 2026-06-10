const { Router } = require('express');
const telemetryController = require('./telemetry.controller');
const validate = require('../../middlewares/validation.middleware');
const telemetryValidations = require('./telemetry.validator');

const router = Router();

router.post(
  '/:signalType(traces|logs|metrics)',
  validate(telemetryValidations.otel),
  telemetryController.ingestOtel
);

module.exports = router;
