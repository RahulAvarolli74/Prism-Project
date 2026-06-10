const { prisma } = require('../../config/db');
const CONSTANTS = require('../../config/constants');

/**
 * Prediction Model
 * Prisma query abstractions for the Prediction entity.
 */
class PredictionModel {
  /**
   * Create a new prediction record.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async create(data) {
    return prisma.prediction.create({
      data: {
        telemetryId: data.telemetryId,
        failure: data.failure,
        confidence: data.confidence,
        affectedNode: data.affectedNode || null,
        rootCause: data.rootCause || null,
        features: data.features || null,
        metadata: data.metadata || null,
      },
    });
  }

  /**
   * Find predictions with pagination and filters.
   * @param {object} options
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @param {string} [options.serviceName]
   * @param {boolean} [options.failure]
   * @param {Date} [options.startDate]
   * @param {Date} [options.endDate]
   * @param {number} [options.minConfidence]
   * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
   */
  async findAll({
    page = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    serviceName,
    failure,
    startDate,
    endDate,
    minConfidence,
  } = {}) {
    const where = {};

    if (failure !== undefined) {
      where.failure = failure;
    }

    if (minConfidence !== undefined) {
      where.confidence = { gte: minConfidence };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (serviceName) {
      where.telemetry = {
        service: { name: serviceName },
      };
    }

    const effectiveLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * effectiveLimit;

    const [data, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: effectiveLimit,
        include: {
          telemetry: {
            select: {
              id: true,
              timestamp: true,
              metrics: true,
              service: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.prediction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit: effectiveLimit,
      totalPages: Math.ceil(total / effectiveLimit),
    };
  }

  /**
   * Find a single prediction by ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.prediction.findUnique({
      where: { id },
      include: {
        telemetry: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Get total prediction count.
   * @returns {Promise<number>}
   */
  async count() {
    return prisma.prediction.count();
  }

  /**
   * Get failure count within a time window.
   * @param {number} [windowMs] - Optional time window
   * @returns {Promise<number>}
   */
  async countFailures(windowMs = null) {
    const where = { failure: true };

    if (windowMs) {
      where.createdAt = {
        gte: new Date(Date.now() - windowMs),
      };
    }

    return prisma.prediction.count({ where });
  }

  /**
   * Get recent failure predictions, grouped by service.
   * @param {number} [limit=10]
   * @returns {Promise<object[]>}
   */
  async getRecentFailures(limit = 10) {
    return prisma.prediction.findMany({
      where: { failure: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        telemetry: {
          select: {
            id: true,
            timestamp: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Get top affected nodes by failure count.
   * @param {number} [limit=5]
   * @returns {Promise<object[]>}
   */
  async getTopAffectedNodes(limit = 5) {
    const result = await prisma.prediction.groupBy({
      by: ['affectedNode'],
      where: {
        failure: true,
        affectedNode: { not: null },
      },
      _count: { id: true },
      _avg: { confidence: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return result.map((item) => ({
      node: item.affectedNode,
      failureCount: item._count.id,
      avgConfidence: parseFloat(item._avg.confidence.toFixed(3)),
    }));
  }
}

module.exports = new PredictionModel();
