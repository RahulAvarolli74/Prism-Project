const serviceService = require('./service.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Service Controller
 * Handles HTTP request/response for service endpoints.
 */
class ServiceController {
  /**
   * GET /services — List all registered services
   */
  list = asyncHandler(async (req, res) => {
    const services = await serviceService.getAllServices();
    ApiResponse.success(services).send(res);
  });

  /**
   * GET /service/:name — Get service details with telemetry & predictions
   */
  getByName = asyncHandler(async (req, res) => {
    const service = await serviceService.getServiceByName(req.params.name);
    ApiResponse.success(service).send(res);
  });

  /**
   * GET /services/dependencies — Get service dependency graph
   */
  getDependencies = asyncHandler(async (req, res) => {
    const graph = await serviceService.getDependencyGraph();
    ApiResponse.success(graph).send(res);
  });
}

module.exports = new ServiceController();
