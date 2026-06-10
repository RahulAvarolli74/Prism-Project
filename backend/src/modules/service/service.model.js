const { prisma } = require('../../config/db');

/**
 * Service Model
 * Prisma query abstractions for the Service entity.
 */
class ServiceModel {
  /**
   * Upsert a service by name — creates if not exists, returns existing otherwise.
   * @param {string} name - Service name
   * @param {object} [metadata] - Optional metadata
   * @returns {Promise<object>} Service record
   */
  async upsert(name, metadata = null) {
    return prisma.service.upsert({
      where: { name },
      update: metadata ? { metadata } : {},
      create: { name, metadata },
    });
  }

  /**
   * Get all services with optional telemetry/prediction counts.
   * @param {object} [options]
   * @param {boolean} [options.withCounts=false]
   * @returns {Promise<object[]>}
   */
  async findAll({ withCounts = false } = {}) {
    if (withCounts) {
      return prisma.service.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              telemetry: true,
            },
          },
        },
      });
    }

    return prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a service by name with recent telemetry and predictions.
   * @param {string} name - Service name
   * @param {number} [recentLimit=10] - Number of recent records
   * @returns {Promise<object|null>}
   */
  async findByName(name, recentLimit = 10) {
    return prisma.service.findUnique({
      where: { name },
      include: {
        telemetry: {
          orderBy: { timestamp: 'desc' },
          take: recentLimit,
          include: {
            predictions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        sourceDependencies: {
          include: {
            targetService: {
              select: { id: true, name: true },
            },
          },
        },
        targetDependencies: {
          include: {
            sourceService: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { telemetry: true },
        },
      },
    });
  }

  /**
   * Get a service by ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.service.findUnique({ where: { id } });
  }

  /**
   * Get service count.
   * @returns {Promise<number>}
   */
  async count() {
    return prisma.service.count();
  }

  /**
   * Get all service dependencies.
   * @returns {Promise<object[]>}
   */
  async getDependencies() {
    return prisma.serviceDependency.findMany({
      include: {
        sourceService: { select: { id: true, name: true } },
        targetService: { select: { id: true, name: true } },
      },
    });
  }
}

module.exports = new ServiceModel();
