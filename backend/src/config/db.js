const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

/**
 * Prisma Client Singleton
 * 
 * Ensures only one PrismaClient instance exists throughout the application lifecycle.
 * Includes connection management and graceful shutdown handling.
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // In development, reuse the client across hot reloads (nodemon)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

/**
 * Connect to database and verify connectivity.
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connection established successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}

/**
 * Disconnect from database gracefully.
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Database disconnected gracefully');
  } catch (error) {
    logger.error('❌ Error disconnecting database:', error.message);
  }
}

// Graceful shutdown hooks
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
};
