const { prisma } = require('../../config/db');
const CONSTANTS = require('../../config/constants');

/**
 * Telemetry Model
 * Prisma query abstractions for the Telemetry entity.
 */
class TelemetryModel {
  /**
   * Create a new telemetry record.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async create(data) {
    return prisma.telemetry.create({
      data: {
        serviceId: data.serviceId,
        timestamp: data.timestamp,
        metrics: data.metrics,
        logs: data.logs || null,
        trace: data.trace || null,
        rawData: data.rawData || null,
      },
    });
  }

  /**
   * Find telemetry records with pagination and filters.
   * @param {object} options
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @param {string} [options.serviceId]
   * @param {string} [options.serviceName]
   * @param {Date} [options.startDate]
   * @param {Date} [options.endDate]
   * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
   */
  async findAll({
    page = CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    serviceId,
    serviceName,
    startDate,
    endDate,
  } = {}) {
    const where = {};

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (serviceName) {
      where.service = { name: serviceName };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const effectiveLimit = Math.min(limit, CONSTANTS.PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * effectiveLimit;

    const [data, total] = await Promise.all([
      prisma.telemetry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: effectiveLimit,
        include: {
          service: { select: { id: true, name: true } },
          predictions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.telemetry.count({ where }),
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
   * Find a single telemetry record by ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.telemetry.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, name: true } },
        predictions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get recent telemetry for a specific service.
   * @param {string} serviceId
   * @param {number} [limit=10]
   * @returns {Promise<object[]>}
   */
  async findRecentByService(serviceId, limit = 10) {
    return prisma.telemetry.findMany({
      where: { serviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get total telemetry count.
   * @returns {Promise<number>}
   */
  async count() {
    return prisma.telemetry.count();
  }

  /**
   * Get telemetry count within a time window.
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Promise<number>}
   */
  async countRecent(windowMs) {
    return prisma.telemetry.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - windowMs),
        },
      },
    });
  }
}

module.exports = new TelemetryModel();
