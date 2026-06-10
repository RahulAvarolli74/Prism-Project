const serviceModel = require('./service.model');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Service Business Logic Layer
 */
class ServiceService {
  /**
   * Get all registered services.
   * @param {object} [options]
   * @param {boolean} [options.withCounts]
   * @returns {Promise<object[]>}
   */
  async getAllServices({ withCounts = true } = {}) {
    const services = await serviceModel.findAll({ withCounts });

    return services.map((svc) => ({
      id: svc.id,
      name: svc.name,
      metadata: svc.metadata,
      createdAt: svc.createdAt,
      updatedAt: svc.updatedAt,
      ...(svc._count && { telemetryCount: svc._count.telemetry }),
    }));
  }

  /**
   * Get a specific service by name with details.
   * @param {string} name - Service name
   * @returns {Promise<object>}
   */
  async getServiceByName(name) {
    const service = await serviceModel.findByName(name.toLowerCase().trim());

    if (!service) {
      throw ApiError.notFound(`Service '${name}' not found`);
    }

    // Transform telemetry data for response
    const recentTelemetry = service.telemetry.map((t) => ({
      id: t.id,
      timestamp: t.timestamp,
      metrics: t.metrics,
      latestPrediction: t.predictions[0] || null,
    }));

    // Build dependency map
    const dependencies = {
      dependsOn: service.sourceDependencies.map((d) => ({
        service: d.targetService.name,
        metadata: d.metadata,
      })),
      dependedBy: service.targetDependencies.map((d) => ({
        service: d.sourceService.name,
        metadata: d.metadata,
      })),
    };

    return {
      id: service.id,
      name: service.name,
      metadata: service.metadata,
      createdAt: service.createdAt,
      telemetryCount: service._count?.telemetry || 0,
      recentTelemetry,
      dependencies,
    };
  }

  /**
   * Get service dependency graph.
   * @returns {Promise<object>}
   */
  async getDependencyGraph() {
    const dependencies = await serviceModel.getDependencies();

    return dependencies.map((dep) => ({
      source: dep.sourceService.name,
      target: dep.targetService.name,
      metadata: dep.metadata,
    }));
  }
}

module.exports = new ServiceService();
