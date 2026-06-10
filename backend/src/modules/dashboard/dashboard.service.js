const telemetryModel = require('../telemetry/telemetry.model');
const predictionModel = require('../prediction/prediction.model');
const serviceModel = require('../service/service.model');
const mlIntegration = require('../prediction/ml.integration');
const logger = require('../../utils/logger');

/**
 * Dashboard Business Logic Layer
 * 
 * Aggregates data across all modules for the dashboard summary API.
 */
class DashboardService {
  /**
   * Get comprehensive dashboard summary.
   * @returns {Promise<object>}
   */
  async getSummary() {
    const [
      totalServices,
      totalTelemetry,
      totalPredictions,
      totalFailures,
      recentTelemetryCount,
      recentFailures,
      topAffectedNodes,
      mlHealth,
    ] = await Promise.all([
      serviceModel.count(),
      telemetryModel.count(),
      predictionModel.count(),
      predictionModel.countFailures(),
      telemetryModel.countRecent(60 * 60 * 1000), // Last 1 hour
      predictionModel.getRecentFailures(5),
      predictionModel.getTopAffectedNodes(5),
      mlIntegration.getHealth().catch(() => ({ status: 'unknown' })),
    ]);

    // Calculate failure rate
    const failureRate = totalPredictions > 0
      ? parseFloat(((totalFailures / totalPredictions) * 100).toFixed(2))
      : 0;

    // Get per-service health overview
    const services = await serviceModel.findAll({ withCounts: true });
    const serviceHealth = await this._calculateServiceHealth(services);

    return {
      overview: {
        totalServices,
        totalTelemetry,
        totalPredictions,
        totalFailures,
        failureRate,
        telemetryIngestionRate: {
          lastHour: recentTelemetryCount,
        },
      },
      recentFailures: recentFailures.map((f) => ({
        id: f.id,
        service: f.telemetry?.service?.name || f.affectedNode,
        confidence: f.confidence,
        rootCause: f.rootCause,
        createdAt: f.createdAt,
      })),
      topAffectedNodes,
      serviceHealth,
      mlServiceStatus: {
        ...mlHealth,
        circuitBreaker: mlIntegration.getCircuitStatus(),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate per-service health scores based on recent predictions.
   * @param {object[]} services
   * @returns {Promise<object[]>}
   */
  async _calculateServiceHealth(services) {
    const healthData = [];

    for (const svc of services) {
      // Get recent predictions for this service
      const { data: predictions } = await predictionModel.findAll({
        serviceName: svc.name,
        page: 1,
        limit: 10,
      });

      if (predictions.length === 0) {
        healthData.push({
          name: svc.name,
          status: 'unknown',
          score: null,
          telemetryCount: svc._count?.telemetry || 0,
        });
        continue;
      }

      const failureCount = predictions.filter((p) => p.failure).length;
      const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

      let status;
      if (failureCount === 0) {
        status = 'healthy';
      } else if (failureCount <= predictions.length * 0.3) {
        status = 'degraded';
      } else {
        status = 'critical';
      }

      healthData.push({
        name: svc.name,
        status,
        score: parseFloat(((1 - failureCount / predictions.length) * 100).toFixed(1)),
        recentFailures: failureCount,
        avgConfidence: parseFloat(avgConfidence.toFixed(3)),
        telemetryCount: svc._count?.telemetry || 0,
      });
    }

    return healthData;
  }
}

module.exports = new DashboardService();
