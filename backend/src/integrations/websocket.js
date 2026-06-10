const { Server } = require('socket.io');
const env = require('../config/env');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize WebSocket server (Socket.IO) attached to the HTTP server.
 *
 * @param {import('http').Server} httpServer - Node.js HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: env.ws.pingInterval,
    pingTimeout: env.ws.pingTimeout,
    transports: ['websocket', 'polling'],
  });

  io.on(CONSTANTS.WS_EVENTS.CONNECTION, (socket) => {
    logger.info(`WebSocket: Client connected [${socket.id}]`, {
      address: socket.handshake.address,
    });

    // ── Subscribe to service-specific room ──
    socket.on(CONSTANTS.WS_EVENTS.SUBSCRIBE_SERVICE, (serviceName) => {
      if (typeof serviceName !== 'string' || !serviceName.trim()) {
        socket.emit('error', { message: 'Invalid service name' });
        return;
      }

      const room = `service:${serviceName.trim().toLowerCase()}`;
      socket.join(room);
      logger.debug(`WebSocket: Client [${socket.id}] subscribed to ${room}`);
      socket.emit('subscribed', { service: serviceName, room });
    });

    // ── Unsubscribe from service room ──
    socket.on(CONSTANTS.WS_EVENTS.UNSUBSCRIBE_SERVICE, (serviceName) => {
      if (typeof serviceName !== 'string') return;

      const room = `service:${serviceName.trim().toLowerCase()}`;
      socket.leave(room);
      logger.debug(`WebSocket: Client [${socket.id}] unsubscribed from ${room}`);
      socket.emit('unsubscribed', { service: serviceName });
    });

    // ── Disconnect ──
    socket.on(CONSTANTS.WS_EVENTS.DISCONNECT, (reason) => {
      logger.info(`WebSocket: Client disconnected [${socket.id}]`, { reason });
    });

    // ── Error handling ──
    socket.on('error', (error) => {
      logger.error(`WebSocket: Socket error [${socket.id}]`, { error: error.message });
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance.
 * Returns null if WebSocket has not been initialized.
 * @returns {Server|null}
 */
function getIO() {
  return io;
}

module.exports = {
  initializeWebSocket,
  getIO,
};
