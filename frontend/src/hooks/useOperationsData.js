import { useMemo } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { mockOpsData, getServiceById as getMockServiceById, getStatusLabel as getMockStatusLabel } from '../data/mockOpsData'
import { normalizeStatus } from '../utils/formatters'

const timelineLabels = ['t1', 't2', 't3', 't4', 't5', 't6']

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))]
}

function buildDependencyMap(dependencyGraph = [], fallback = {}) {
  if (!Array.isArray(dependencyGraph) || dependencyGraph.length === 0) {
    return fallback
  }

  return dependencyGraph.reduce((accumulator, edge) => {
    if (!edge?.source || !edge?.target) {
      return accumulator
    }

    if (!accumulator[edge.source]) {
      accumulator[edge.source] = []
    }

    if (!accumulator[edge.source].includes(edge.target)) {
      accumulator[edge.source].push(edge.target)
    }

    return accumulator
  }, {})
}

function buildReverseDependencyMap(dependencyMap = {}) {
  return Object.entries(dependencyMap).reduce((accumulator, [source, targets]) => {
    for (const target of targets || []) {
      if (!accumulator[target]) {
        accumulator[target] = []
      }

      if (!accumulator[target].includes(source)) {
        accumulator[target].push(source)
      }
    }

    return accumulator
  }, {})
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeAlertSeverity(alert = {}) {
  const raw = String(alert.severity || alert.level || '').toLowerCase()

  if (raw === 'high' || raw === 'critical' || raw === 'fatal') {
    return 'high'
  }

  if (raw === 'medium' || raw === 'warning' || raw === 'warn') {
    return 'medium'
  }

  return 'low'
}

function normalizeAlertStatus(alert = {}) {
  const raw = String(alert.status || '').toLowerCase()

  if (raw === 'dismissed' || raw === 'acknowledged' || raw === 'queued') {
    return raw
  }

  return 'open'
}

function normalizeAlert(alert = {}) {
  const serviceName = alert.service || alert.serviceName || alert.affectedNode || 'unknown-service'
  const risk = toNumber(alert.risk ?? alert.confidence ?? alert.failureProbability ?? alert.probability, 0)

  return {
    ...alert,
    id: alert.id || alert.predictionId || `${serviceName}-${alert.timestamp || alert.createdAt || Date.now()}`,
    service: serviceName,
    risk,
    severity: normalizeAlertSeverity(alert),
    status: normalizeAlertStatus(alert),
    timestamp: alert.timestamp || alert.createdAt || new Date().toISOString(),
    acknowledged: Boolean(alert.acknowledged),
    summary: alert.summary || alert.message || alert.rootCause || `${serviceName} raised an alert.`,
  }
}

function buildHistoryFromTelemetry(telemetry = [], labelPrefix = 't') {
  if (!Array.isArray(telemetry) || telemetry.length === 0) {
    return []
  }

  return telemetry
    .slice()
    .reverse()
    .map((entry, index) => ({
      label: `${labelPrefix}${index + 1}`,
      timestamp: entry.timestamp,
      metrics: {
        cpu: toNumber(entry.metrics?.cpu),
        memory: toNumber(entry.metrics?.memory),
        latency: toNumber(entry.metrics?.latency),
        error_rate: toNumber(entry.metrics?.error_rate),
        failure_probability: toNumber(entry.latestPrediction?.confidence ?? entry.predictions?.[0]?.confidence ?? entry.metrics?.failure_probability ?? 0),
      },
    }))
}

function buildServiceEntry({
  name,
  index,
  health,
  telemetryCount,
  fallbackService,
  liveSnapshots,
  dependencyMap,
  reverseDependencyMap,
  predictions,
}) {
  const serviceSnapshots = liveSnapshots.filter((snapshot) => snapshot?.detail?.name === name)
  const detail = serviceSnapshots[0]?.detail
  const telemetry = detail?.recentTelemetry || []
  const recentTelemetry = telemetry.length > 0 ? telemetry : detail?.telemetry || []
  const latestTelemetry = recentTelemetry[0]
  const servicePredictions = predictions.filter((prediction) => prediction.telemetry?.service?.name === name)

  const failureCount = health?.recentFailures ?? servicePredictions.filter((prediction) => prediction.failure).length
  const avgConfidence = health?.avgConfidence ?? (servicePredictions.length > 0
    ? servicePredictions.reduce((sum, prediction) => sum + toNumber(prediction.confidence), 0) / servicePredictions.length
    : null)

  const fallbackMetrics = fallbackService?.history?.[fallbackService.history.length - 1]?.metrics || {}
  const metrics = {
    cpu: toNumber(latestTelemetry?.metrics?.cpu, fallbackMetrics.cpu ?? 0),
    memory: toNumber(latestTelemetry?.metrics?.memory, fallbackMetrics.memory ?? 0),
    latency: toNumber(latestTelemetry?.metrics?.latency, fallbackMetrics.latency ?? 0),
    error_rate: toNumber(latestTelemetry?.metrics?.error_rate, fallbackMetrics.error_rate ?? 0),
    failure_probability: clamp(
      avgConfidence !== null
        ? avgConfidence
        : toNumber(fallbackService?.failure_probability ?? 0, 0),
      0.01,
      0.99,
    ),
  }

  const status = normalizeStatus(
    health?.status || (metrics.failure_probability >= 0.7 ? 'critical' : metrics.failure_probability >= 0.4 ? 'warning' : 'healthy')
  )

  const history = recentTelemetry.length > 0
    ? buildHistoryFromTelemetry(recentTelemetry, 't')
    : fallbackService?.history || [
        {
          label: 't1',
          timestamp: detail?.updatedAt || new Date().toISOString(),
          metrics,
        },
      ]

  return {
    id: name,
    name,
    description: detail?.metadata?.description || fallbackService?.description || `${name} live telemetry`,
    status,
    interaction_count: telemetryCount || detail?.telemetryCount || fallbackService?.interaction_count || history.length,
    failure_probability: metrics.failure_probability,
    cpu: metrics.cpu,
    memory: metrics.memory,
    latency: metrics.latency,
    error_rate: metrics.error_rate,
    history,
    upstream: unique([
      ...(detail?.dependencies?.dependedBy || []).map((entry) => entry.service),
      ...(reverseDependencyMap[name] || []),
      ...(fallbackService?.upstream || []),
    ]),
    downstream: unique([
      ...(detail?.dependencies?.dependsOn || []).map((entry) => entry.service),
      ...(dependencyMap[name] || []),
      ...(fallbackService?.downstream || []),
    ]),
    severityRank: status === 'critical' ? 3 : status === 'warning' ? 2 : 1,
    avgCpu: history.length > 0 ? Number((history.reduce((sum, entry) => sum + toNumber(entry.metrics?.cpu), 0) / history.length).toFixed(1)) : metrics.cpu,
    avgLatency: history.length > 0 ? Math.round(history.reduce((sum, entry) => sum + toNumber(entry.metrics?.latency), 0) / history.length) : metrics.latency,
    avgFailureProbability: history.length > 0 ? Number((history.reduce((sum, entry) => sum + toNumber(entry.metrics?.failure_probability), 0) / history.length).toFixed(3)) : metrics.failure_probability,
    sortIndex: index,
  }
}

function buildLiveTimeline(services, predictions) {
  if (!Array.isArray(services) || services.length === 0) {
    return []
  }

  const orderedPredictions = [...(predictions || [])].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
  const predictionBuckets = Array.from({ length: timelineLabels.length }, () => [])

  orderedPredictions.forEach((prediction, index) => {
    predictionBuckets[index % timelineLabels.length].push(prediction)
  })

  return timelineLabels.map((label, index) => {
    const bucket = predictionBuckets[index]
    const failing = unique(
      bucket
        .filter((prediction) => prediction.failure)
        .map((prediction) => prediction.telemetry?.service?.name || prediction.serviceName || prediction.affectedNode)
    ).slice(0, 3)

    const atRisk = unique(
      bucket
        .map((prediction) => prediction.telemetry?.service?.name || prediction.serviceName || prediction.affectedNode)
        .filter((serviceName) => serviceName && !failing.includes(serviceName))
    ).slice(0, 6)

    return {
      label,
      timestamp: bucket[0]?.createdAt || new Date().toISOString(),
      failing,
      atRisk,
      snapshot: services.map((service) => ({
        id: `${service.id}-${label}`,
        name: service.name,
        label,
        timestamp: bucket[0]?.createdAt || new Date().toISOString(),
        status: service.status,
        interaction_count: service.interaction_count,
        metrics: {
          cpu: service.cpu,
          memory: service.memory,
          latency: service.latency,
          error_rate: service.error_rate,
          failure_probability: service.failure_probability,
        },
        summary: service.description,
        upstream: service.upstream,
        downstream: service.downstream,
      })),
    }
  })
}

function buildDashboardTrend(timeline = []) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return []
  }

  return timeline.map((frame, index) => {
    const snapshot = frame.snapshot || []
    const total = snapshot.length || 1
    const averageRisk = snapshot.reduce((sum, entry) => sum + toNumber(entry.metrics?.failure_probability), 0) / total
    const averageLatency = snapshot.reduce((sum, entry) => sum + toNumber(entry.metrics?.latency), 0) / total
    const failureProbability = (snapshot.filter((entry) => entry.status === 'critical').length / total) * 100

    return {
      label: frame.label,
      failureProbability: Number(failureProbability.toFixed(1)),
      latency: Math.round(averageLatency),
      risk: Number((averageRisk * 100).toFixed(1)),
      index,
    }
  })
}

function buildAlerts(summary, liveAlerts, services) {
  const summaryAlerts = Array.isArray(summary?.recentFailures)
    ? summary.recentFailures.map((item) => normalizeAlert({
        id: item.id,
        service: item.service,
        risk: item.confidence,
        severity: item.confidence >= 0.85 ? 'high' : 'medium',
        timestamp: item.createdAt,
        status: 'open',
        acknowledged: false,
        summary: item.rootCause || `${item.service} showed elevated failure signals.`,
      }))
    : []

  const socketAlerts = Array.isArray(liveAlerts) ? liveAlerts.map((alert) => normalizeAlert(alert)) : []

  if (summaryAlerts.length > 0 || socketAlerts.length > 0) {
    return [...socketAlerts, ...summaryAlerts].slice(0, 24)
  }

  return services
    .filter((service) => service.status !== 'healthy')
    .slice(0, 8)
    .map((service, index) => normalizeAlert({
      id: `${service.id}-${index}`,
      service: service.name,
      risk: service.failure_probability,
      severity: service.status === 'critical' ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      status: index % 2 === 0 ? 'open' : 'queued',
      acknowledged: false,
      summary: `${service.name} is ${service.status}.`,
    }))
}

function buildServiceSeries(services) {
  return Object.fromEntries(
    services.map((service) => [
      service.id,
      service.history.map((entry, index) => ({
        label: entry.label || `t${index + 1}`,
        timestamp: entry.timestamp,
        cpu: toNumber(entry.metrics?.cpu),
        memory: toNumber(entry.metrics?.memory),
        latency: toNumber(entry.metrics?.latency),
        errorRate: Number((toNumber(entry.metrics?.error_rate) * 100).toFixed(2)),
        failureProbability: Number((toNumber(entry.metrics?.failure_probability) * 100).toFixed(1)),
      })),
    ])
  )
}

export function useOperationsData() {
  const summary = useDashboardStore((state) => state.summary)
  const services = useDashboardStore((state) => state.services)
  const predictions = useDashboardStore((state) => state.predictions)
  const dependencyGraph = useDashboardStore((state) => state.dependencyGraph)
  const serviceSnapshots = useDashboardStore((state) => state.serviceSnapshots)
  const serviceDetails = useDashboardStore((state) => state.serviceDetails)
  const alerts = useDashboardStore((state) => state.alerts)
  const connectionStatus = useDashboardStore((state) => state.connectionStatus)

  return useMemo(() => {
    const hasLiveData = Boolean(summary || services.length || predictions.length || dependencyGraph.length || serviceSnapshots.length || alerts.length)

    if (!hasLiveData) {
      return {
        ...mockOpsData,
        connectionStatus,
        source: 'fallback',
        getServiceById: getMockServiceById,
        getStatusLabel: getMockStatusLabel,
        dependencyMap: mockOpsData.dependencyMap,
        services: mockOpsData.services,
        timeline: mockOpsData.timeline,
        dashboardTrend: mockOpsData.dashboardTrend,
        latestSnapshot: mockOpsData.latestSnapshot,
        alerts: mockOpsData.alerts,
        modelMetrics: mockOpsData.modelMetrics,
        serviceSeries: mockOpsData.serviceSeries,
      }
    }

    // Strict live mode: no mock fallback blending once live data exists.
    const dependencyMap = buildDependencyMap(dependencyGraph, {})
    const reverseDependencyMap = buildReverseDependencyMap(dependencyMap)
    const detailByName = new Map()

    for (const snapshot of serviceSnapshots) {
      if (snapshot?.name) {
        detailByName.set(snapshot.name, snapshot)
      }
    }

    for (const detailState of Object.values(serviceDetails || {})) {
      const detail = detailState?.detail
      if (detail?.name) {
        detailByName.set(detail.name, detail)
      }
    }

    const liveSnapshots = [...detailByName.values()].map((detail) => ({ detail }))
    const healthByName = new Map((summary?.serviceHealth || []).map((entry) => [entry.name, entry]))

    const liveServiceSeeds =
      services.length > 0
        ? services
        : (summary?.serviceHealth || []).map((entry) => ({
            name: entry.name,
            telemetryCount: entry.recentTelemetry || 0,
          }))

    const liveServices = liveServiceSeeds.map((service, index) => {
      const name = service.name || service.id
      return buildServiceEntry({
        name,
        index,
        health: healthByName.get(name),
        telemetryCount: service.telemetryCount || service._count?.telemetry || 0,
        fallbackService: null,
        liveSnapshots,
        dependencyMap,
        reverseDependencyMap,
        predictions,
      })
    })

    const timeline = buildLiveTimeline(liveServices, predictions)
    const dashboardTrend = buildDashboardTrend(timeline)
    const latestSnapshot = timeline[timeline.length - 1]?.snapshot || []
    const liveAlerts = buildAlerts(summary, alerts, liveServices)

    return {
      source: 'live',
      connectionStatus,
      summary,
      dependencyMap,
      services: liveServices.sort((left, right) => right.failure_probability - left.failure_probability),
      timeline,
      dashboardTrend,
      latestSnapshot,
      alerts: liveAlerts,
      modelMetrics: [],
      serviceSeries: buildServiceSeries(liveServices),
      getServiceById: (id) => liveServices.find((service) => service.id === id || service.name === id) || null,
      getStatusLabel: (status) => getMockStatusLabel(status),
    }
  }, [alerts, connectionStatus, dependencyGraph, predictions, serviceDetails, serviceSnapshots, services, summary])
}
