import axios from 'axios'

/**
 * Production-grade API client with:
 * - Request/response interceptors
 * - Exponential backoff retry logic
 * - Request timeout handling
 * - Correlation ID tracking
 * - Structured error responses
 */

const API_CONFIG = {
  timeout: 15000,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 10000,
  },
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Generate correlation ID for tracking requests across client and server
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Request interceptor - add correlation ID and logging
 */
apiClient.interceptors.request.use(
  (config) => {
    const correlationId = generateCorrelationId()
    config.headers['x-correlation-id'] = correlationId
    config.metadata = { startTime: Date.now(), correlationId }

    console.debug(`[${correlationId}] ${config.method.toUpperCase()} ${config.url}`)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Exponential backoff retry strategy
 */
function shouldRetry(error, attempt) {
  if (!error.response) return attempt < API_CONFIG.retryConfig.maxRetries
  const status = error.response.status
  // Retry on network errors and 5xx, but not 4xx client errors
  return (status >= 500 || !error.response) && attempt < API_CONFIG.retryConfig.maxRetries
}

function getRetryDelay(attempt) {
  const delay = API_CONFIG.retryConfig.baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * 1000
  return Math.min(delay + jitter, API_CONFIG.retryConfig.maxDelay)
}

/**
 * Response interceptor - handle retries and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime
    console.debug(
      `[${response.config.metadata.correlationId}] ${response.status} (${duration}ms)`
    )
    return response
  },
  async (error) => {
    const config = error.config

    if (!config) return Promise.reject(error)

    // Initialize retry count
    if (!config.retryAttempt) {
      config.retryAttempt = 0
    }

    // Check if we should retry
    if (shouldRetry(error, config.retryAttempt)) {
      config.retryAttempt += 1
      const delay = getRetryDelay(config.retryAttempt - 1)

      console.warn(
        `[${config.metadata.correlationId}] Retry attempt ${config.retryAttempt}/${API_CONFIG.retryConfig.maxRetries} after ${Math.round(delay)}ms`
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry the request
      return apiClient(config)
    }

    // Max retries exceeded or non-retryable error
    const duration = Date.now() - config.metadata.startTime
    console.error(
      `[${config.metadata.correlationId}] Failed after ${duration}ms:`,
      error.response?.status || error.code,
      error.message
    )

    return Promise.reject(error)
  }
)

/**
 * Helper to unwrap API response format
 */
function unwrapResponse(response) {
  const payload = response?.data

  if (payload && typeof payload === 'object' && 'success' in payload) {
    return {
      data: payload.data ?? null,
      meta: payload.meta ?? null,
      message: payload.message ?? '',
      success: Boolean(payload.success),
      correlationId: response.config.metadata?.correlationId,
    }
  }

  return {
    data: payload ?? null,
    meta: null,
    message: '',
    success: true,
    correlationId: response.config.metadata?.correlationId,
  }
}

/**
 * Helper to normalize list responses
 */
function normalizeListResponse(payload) {
  return {
    items: Array.isArray(payload.data) ? payload.data : [],
    pagination: payload.meta?.pagination ?? null,
    message: payload.message,
    success: payload.success,
    correlationId: payload.correlationId,
  }
}

/**
 * Generic request handler
 */
async function request(method, url, options = {}) {
  try {
    const response = await apiClient.request({ method, url, ...options })
    const normalized = unwrapResponse(response)

    if (!normalized.success) {
      const error = new Error(normalized.message || 'Request failed')
      error.details = normalized
      throw error
    }

    return normalized
  } catch (error) {
    // Enhance error with request context
    error.correlationId = error.response?.config?.metadata?.correlationId
    error.retryAttempts = error.config?.retryAttempt ?? 0
    throw error
  }
}

// ═════════════════════════════════════════════════
// API METHODS
// ═════════════════════════════════════════════════

export async function getDashboardSummary() {
  return request('GET', '/dashboard/summary')
}

export async function getServices() {
  return request('GET', '/services')
}

export async function getServiceDetail(name) {
  return request('GET', `/service/${encodeURIComponent(name)}`)
}

export async function getDependencyGraph() {
  return request('GET', '/services/dependencies')
}

export async function getPredictions(params = {}) {
  const payload = await request('GET', '/predictions', { params })
  return normalizeListResponse(payload)
}

export async function getTelemetry(params = {}) {
  const payload = await request('GET', '/telemetry', { params })
  return normalizeListResponse(payload)
}

export function getClientConfig() {
  return {
    timeout: API_CONFIG.timeout,
    retryConfig: API_CONFIG.retryConfig,
  }
}

export default apiClient