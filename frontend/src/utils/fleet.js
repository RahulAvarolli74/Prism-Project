import { formatDateTime, formatLatency, formatPercent } from './formatters'

function average(values) {
  const numbers = values.filter((value) => Number.isFinite(Number(value))).map(Number)

  if (numbers.length === 0) {
    return null
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
}

export function buildFleetMetricSeries(serviceSnapshots = []) {
  const normalizedSnapshots = serviceSnapshots
    .map((snapshot) => ({
      ...snapshot,
      telemetry: [...(snapshot?.recentTelemetry || [])].reverse(),
    }))
    .filter((snapshot) => snapshot.telemetry.length > 0)

  const maxLength = normalizedSnapshots.reduce((max, snapshot) => Math.max(max, snapshot.telemetry.length), 0)

  return Array.from({ length: maxLength }, (_, index) => {
    const telemetryBucket = normalizedSnapshots
      .map((snapshot) => snapshot.telemetry[index])
      .filter(Boolean)

    const cpu = average(telemetryBucket.map((entry) => entry.metrics?.cpu))
    const memory = average(telemetryBucket.map((entry) => entry.metrics?.memory))
    const latency = average(telemetryBucket.map((entry) => entry.metrics?.latency))
    const errorRate = average(telemetryBucket.map((entry) => entry.metrics?.error_rate))

    return {
      bucket: index + 1,
      label: formatDateTime(telemetryBucket[0]?.timestamp, `Point ${index + 1}`),
      cpu: cpu === null ? null : Number(cpu.toFixed(2)),
      memory: memory === null ? null : Number(memory.toFixed(2)),
      latency: latency === null ? null : Number(latency.toFixed(2)),
      errorRate: errorRate === null ? null : Number(errorRate.toFixed(3)),
    }
  }).filter((item) => item.cpu !== null || item.memory !== null || item.latency !== null || item.errorRate !== null)
}

export function buildPredictionTimeline(predictions = []) {
  return [...predictions]
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .map((prediction) => ({
      timestamp: prediction.createdAt,
      label: formatDateTime(prediction.createdAt),
      confidence: Number((prediction.confidence * 100).toFixed(1)),
      riskScore: Number(((prediction.failure ? prediction.confidence : prediction.confidence * 0.55) * 100).toFixed(1)),
      failure: Boolean(prediction.failure),
      serviceName: prediction.telemetry?.service?.name || prediction.serviceName || 'Unknown',
    }))
}

export function buildServiceLogPreview(logs = []) {
  if (!Array.isArray(logs)) {
    return [String(logs)]
  }

  return logs.slice(0, 5).map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry)))
}

export function summarizeMetrics(metrics = {}) {
  return [
    {
      label: 'CPU',
      value: metrics.cpu ?? null,
      formatted: formatPercent(metrics.cpu),
    },
    {
      label: 'Memory',
      value: metrics.memory ?? null,
      formatted: formatPercent(metrics.memory),
    },
    {
      label: 'Latency',
      value: metrics.latency ?? null,
      formatted: formatLatency(metrics.latency),
    },
    {
      label: 'Error rate',
      value: metrics.error_rate ?? null,
      formatted: formatPercent((metrics.error_rate || 0) * 100),
    },
  ]
}

export function detectMetricAnomalies(metrics = {}) {
  const anomalies = []

  if (Number(metrics.cpu) >= 90) {
    anomalies.push('CPU saturation above 90%')
  }

  if (Number(metrics.memory) >= 95) {
    anomalies.push('Memory pressure above 95%')
  }

  if (Number(metrics.latency) >= 500) {
    anomalies.push('Latency spike above 500 ms')
  }

  if (Number(metrics.error_rate) >= 0.15) {
    anomalies.push('Error rate above 15%')
  }

  return anomalies
}