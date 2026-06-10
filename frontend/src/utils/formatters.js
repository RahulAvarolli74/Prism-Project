const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatNumber(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }

  return numberFormatter.format(Number(value))
}

export function formatCompactNumber(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }

  return compactFormatter.format(Number(value))
}

export function formatPercent(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }

  return `${Number(value).toFixed(1)}%`
}

export function formatConfidence(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }

  return `${Math.round(Number(value) * 100)}%`
}

export function formatLatency(value, fallback = '—') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback
  }

  return `${Number(value).toFixed(Number(value) >= 100 ? 0 : 1)} ms`
}

export function formatDateTime(value, fallback = '—') {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return timeFormatter.format(date)
}

export function formatRelativeTime(value, fallback = '—') {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  const deltaMs = Date.now() - date.getTime()
  const minutes = Math.floor(deltaMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function safeJsonPreview(value) {
  if (value === null || value === undefined) {
    return 'No data'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return 'Unable to render payload'
  }
}

export function normalizeStatus(status) {
  const value = String(status || 'unknown').toLowerCase()

  if (value === 'degraded') return 'warning'
  if (value === 'critical' || value === 'failing' || value === 'down') return 'critical'
  if (value === 'healthy' || value === 'ok' || value === 'up') return 'healthy'
  if (value === 'warning') return 'warning'

  return 'unknown'
}

export function getStatusTone(status) {
  const normalized = normalizeStatus(status)

  switch (normalized) {
    case 'healthy':
      return {
        label: 'Healthy',
        background: 'rgba(45, 212, 191, 0.16)',
        color: 'var(--success)',
        border: 'rgba(45, 212, 191, 0.28)',
      }
    case 'warning':
      return {
        label: 'Warning',
        background: 'rgba(251, 191, 36, 0.16)',
        color: 'var(--warning)',
        border: 'rgba(251, 191, 36, 0.28)',
      }
    case 'critical':
      return {
        label: 'Critical',
        background: 'rgba(251, 113, 133, 0.16)',
        color: 'var(--critical)',
        border: 'rgba(251, 113, 133, 0.28)',
      }
    default:
      return {
        label: 'Unknown',
        background: 'rgba(148, 163, 184, 0.14)',
        color: 'var(--text-secondary)',
        border: 'rgba(148, 163, 184, 0.2)',
      }
  }
}

export function getConfidenceBand(confidence) {
  const value = Number(confidence) || 0

  if (value >= 0.85) {
    return 'critical'
  }

  if (value >= 0.6) {
    return 'warning'
  }

  return 'healthy'
}

export function sortServicesByRisk(services = []) {
  const rank = {
    critical: 3,
    warning: 2,
    healthy: 1,
    unknown: 0,
  }

  return [...services].sort((left, right) => {
    const statusDelta = (rank[normalizeStatus(right.status)] || 0) - (rank[normalizeStatus(left.status)] || 0)

    if (statusDelta !== 0) {
      return statusDelta
    }

    return (right.recentFailures || 0) - (left.recentFailures || 0)
      || (right.telemetryCount || 0) - (left.telemetryCount || 0)
      || String(left.name).localeCompare(String(right.name))
  })
}