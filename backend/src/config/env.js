const dotenv = require('dotenv');
const path = require('path');

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Centralized environment configuration with validation and defaults.
 * All environment variables are accessed through this module.
 */
const env = {
  // ── Server ──
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // ── Database ──
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prism_db?schema=public',

  // ── ML Service ──
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.ML_SERVICE_TIMEOUT, 10) || 10000,
    retries: parseInt(process.env.ML_SERVICE_RETRIES, 10) || 3,
  },

  // ── Rate Limiting ──
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // ── Logging ──
  logLevel: process.env.LOG_LEVEL || 'debug',

  // ── CORS ──
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // ── WebSocket ──
  ws: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL, 10) || 25000,
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT, 10) || 20000,
  },
};

// ── Validation ──
const requiredVars = ['DATABASE_URL'];
const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0 && env.isProd) {
  throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = env;
