const predictionService = require('./prediction.service');
const mlIntegration = require('./ml.integration');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Prediction Controller
 * Handles HTTP request/response for prediction endpoints.
 */
class PredictionController {
  /**
   * GET /predictions — List predictions with filters
   */
  list = asyncHandler(async (req, res) => {
    const result = await predictionService.getPredictions(req.query);

    ApiResponse.paginated(
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    ).send(res);
  });

  /**
   * GET /predictions/:id — Get single prediction
   */
  getById = asyncHandler(async (req, res) => {
    const prediction = await predictionService.getPredictionById(req.params.id);
    ApiResponse.success(prediction).send(res);
  });

  /**
   * GET /predictions/failures/recent — Get recent failure predictions
   */
  getRecentFailures = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const failures = await predictionService.getRecentFailures(limit);
    ApiResponse.success(failures).send(res);
  });

  /**
   * GET /predictions/nodes/top-affected — Get top affected nodes
   */
  getTopAffectedNodes = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 5;
    const nodes = await predictionService.getTopAffectedNodes(limit);
    ApiResponse.success(nodes).send(res);
  });

  /**
   * GET /predictions/ml/health — Get ML service health
   */
  getMLHealth = asyncHandler(async (req, res) => {
    const health = await mlIntegration.getHealth();
    const circuitStatus = mlIntegration.getCircuitStatus();

    ApiResponse.success({
      ...health,
      circuitBreaker: circuitStatus,
    }).send(res);
  });
}

module.exports = new PredictionController();
