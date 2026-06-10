const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { initializeWebSocket } = require('./integrations/websocket');
const logger = require('./utils/logger');

// ── Create HTTP Server ──
const server = http.createServer(app);

// ── Initialize WebSocket ──
const io = initializeWebSocket(server);

/**
 * Start the server.
 */
async function start() {
  try {
    // Connect to PostgreSQL
    await connectDatabase();

    // Start listening
    server.listen(env.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 PRISM Backend Server                        ║
║                                                   ║
║   Environment : ${env.nodeEnv.padEnd(33)}║
║   Port        : ${String(env.port).padEnd(33)}║
║   API         : http://localhost:${env.port}/api/v1${' '.repeat(13)}║
║   Health      : http://localhost:${env.port}/health${' '.repeat(16)}║
║   WebSocket   : ws://localhost:${env.port}${' '.repeat(20)}║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════

const shutdown = async (signal) => {
  logger.info(`\n🔄 ${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('✅ HTTP server closed');

    // Close WebSocket connections
    if (io) {
      io.close();
      logger.info('✅ WebSocket server closed');
    }

    // Disconnect database
    await disconnectDatabase();

    logger.info('👋 Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Handle unhandled rejections ──
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason: reason?.message || reason });
});

// ── Handle uncaught exceptions ──
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// ── Start ──
start();

module.exports = server;
