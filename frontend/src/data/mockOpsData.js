const serviceNames = [
  'api-gateway',
  'auth-service',
  'payment-service',
  'cart-service',
  'inventory-service',
  'notification-service',
  'order-service',
  'user-service',
  'product-service',
  'recommendation-service',
  'search-service',
  'cache-service',
  'db-proxy',
  'message-broker',
  'billing-service',
  'shipping-service',
  'analytics-service',
  'config-service',
  'logging-service',
  'trace-collector',
  'session-service',
  'fulfillment-service',
  'fraud-service',
  'catalog-service',
  'pricing-service',
  'review-service',
  'media-service',
  'checkout-service',
  'promotion-service',
  'loyalty-service',
  'edge-router',
  'scheduler-service',
  'report-service',
  'insight-service',
  'experiment-service',
  'audit-service',
  'notification-worker',
  'webhook-service',
  'warehouse-service',
  'catalog-indexer',
  'recommendation-worker',
  'billing-ledger-service',
  'telemetry-ingestor',
  'incident-service',
]

const dependencyMap = {
  'edge-router': ['api-gateway'],
  'api-gateway': ['auth-service', 'cart-service', 'catalog-service', 'order-service', 'search-service', 'recommendation-service'],
  'auth-service': ['user-service', 'session-service', 'audit-service'],
  'payment-service': ['billing-service', 'billing-ledger-service', 'fraud-service', 'db-proxy'],
  'cart-service': ['session-service', 'cache-service', 'catalog-service'],
  'inventory-service': ['warehouse-service', 'db-proxy', 'telemetry-ingestor'],
  'notification-service': ['notification-worker', 'webhook-service', 'message-broker'],
  'order-service': ['payment-service', 'inventory-service', 'shipping-service', 'notification-service', 'message-broker'],
  'user-service': ['session-service', 'audit-service', 'config-service'],
  'product-service': ['catalog-service', 'search-service', 'media-service'],
  'recommendation-service': ['analytics-service', 'experiment-service', 'catalog-indexer'],
  'search-service': ['catalog-indexer', 'cache-service'],
  'cache-service': ['db-proxy'],
  'db-proxy': ['incident-service'],
  'message-broker': ['logging-service'],
  'billing-service': ['billing-ledger-service', 'audit-service'],
  'shipping-service': ['warehouse-service', 'telemetry-ingestor'],
  'analytics-service': ['insight-service', 'report-service'],
  'config-service': ['logging-service'],
  'logging-service': ['trace-collector'],
  'trace-collector': ['insight-service'],
  'session-service': ['cache-service', 'auth-service'],
  'fulfillment-service': ['inventory-service', 'shipping-service'],
  'fraud-service': ['analytics-service', 'audit-service'],
  'catalog-service': ['catalog-indexer', 'media-service'],
  'pricing-service': ['product-service', 'analytics-service'],
  'review-service': ['catalog-service', 'analytics-service'],
  'media-service': ['trace-collector'],
  'checkout-service': ['cart-service', 'payment-service'],
  'promotion-service': ['pricing-service', 'loyalty-service'],
  'loyalty-service': ['user-service', 'analytics-service'],
  'scheduler-service': ['report-service', 'telemetry-ingestor'],
  'report-service': ['analytics-service'],
  'insight-service': ['audit-service'],
  'experiment-service': ['recommendation-service', 'analytics-service'],
  'audit-service': ['logging-service'],
  'notification-worker': ['message-broker', 'logging-service'],
  'webhook-service': ['api-gateway', 'message-broker'],
  'warehouse-service': ['db-proxy'],
  'catalog-indexer': ['search-service', 'logging-service'],
  'recommendation-worker': ['recommendation-service', 'analytics-service'],
  'billing-ledger-service': ['db-proxy', 'audit-service'],
  'telemetry-ingestor': ['trace-collector', 'analytics-service'],
  'incident-service': ['logging-service', 'message-broker'],
}

const reverseDependencyMap = Object.entries(dependencyMap).reduce((accumulator, [source, targets]) => {
  targets.forEach((target) => {
    if (!accumulator[target]) {
      accumulator[target] = []
    }

    accumulator[target].push(source)
  })

  return accumulator
}, {})

const timelineLabels = Array.from({ length: 24 }, (_, index) => `t${index + 1}`)

const incidentWaves = [
  {
    id: 'payment-cascade',
    start: 3,
    duration: 6,
    roots: ['payment-service', 'db-proxy'],
    maxImpact: 0.84,
  },
  {
    id: 'edge-auth-spike',
    start: 9,
    duration: 5,
    roots: ['edge-router', 'auth-service'],
    maxImpact: 0.72,
  },
  {
    id: 'catalog-latency-burst',
    start: 14,
    duration: 7,
    roots: ['catalog-service', 'search-service', 'recommendation-service'],
    maxImpact: 0.78,
  },
  {
    id: 'telemetry-backpressure',
    start: 19,
    duration: 5,
    roots: ['telemetry-ingestor', 'trace-collector'],
    maxImpact: 0.67,
  },
]

const serviceSummaries = {
  'api-gateway': 'Front-door traffic mesh with policy enforcement and request shaping.',
  'auth-service': 'Authentication and token exchange for internal and external callers.',
  'payment-service': 'Payment orchestration with retry logic and failure isolation.',
  'cart-service': 'Cart state and checkout session coordination.',
  'inventory-service': 'Inventory reservation and stock reconciliation.',
  'notification-service': 'Alert fan-out across email, push, and webhook channels.',
  'order-service': 'Order lifecycle manager with dependency fan-out.',
  'user-service': 'Identity profile, preferences, and user metadata.',
  'product-service': 'Product catalog enrichment and browsing context.',
  'recommendation-service': 'Ranking layer that scores the next best action.',
  'search-service': 'Query parsing, retrieval, and result ranking.',
  'cache-service': 'Latency shield for hot reads and repeated calls.',
  'db-proxy': 'Connection routing and pool protection for the datastore.',
  'message-broker': 'Event backbone for asynchronous fan-out.',
  'billing-service': 'Billing workflow, invoice generation, and reconciliation.',
  'shipping-service': 'Delivery orchestration and courier handoff.',
  'analytics-service': 'Usage telemetry aggregation and trend analysis.',
  'config-service': 'Runtime configuration distribution and rollout control.',
  'logging-service': 'Central log ingestion and retention layer.',
  'trace-collector': 'OpenTelemetry trace ingress and normalization.',
  'session-service': 'User session state and cache-backed token exchange.',
  'fulfillment-service': 'Warehouse fulfilment and packaging coordinator.',
  'fraud-service': 'Risk scoring and transaction anomaly detection.',
  'catalog-service': 'Product catalog serving and enrichment orchestration.',
  'pricing-service': 'Price rules, discounts, and margin guards.',
  'review-service': 'Ratings pipeline and sentiment enrichment.',
  'media-service': 'Asset delivery and media transformation.',
  'checkout-service': 'Checkout journey aggregator and state machine.',
  'promotion-service': 'Offer targeting and discount eligibility.',
  'loyalty-service': 'Points and reward redemption engine.',
  'edge-router': 'Ingress proxy and routing control point.',
  'scheduler-service': 'Cron-like background orchestration.',
  'report-service': 'Operational reporting and SLA summaries.',
  'insight-service': 'Cross-service anomaly synthesis and insights.',
  'experiment-service': 'Feature flag experiments and canary scoring.',
  'audit-service': 'Immutable event trail for compliance workflows.',
  'notification-worker': 'Background job execution for outbound alerts.',
  'webhook-service': 'External callback delivery with retry windows.',
  'warehouse-service': 'Physical inventory and warehouse coordination.',
  'catalog-indexer': 'Search indexing and catalog denormalization.',
  'recommendation-worker': 'Offline recommendation scoring jobs.',
  'billing-ledger-service': 'Ledger persistence and transactional bookkeeping.',
  'telemetry-ingestor': 'Batch telemetry ingress and normalization pipeline.',
  'incident-service': 'Incident triage and on-call workflow hub.',
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hashSeed(input) {
  let value = 0

  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) % 100000
  }

  return value
}

function buildScore(name, index, stepIndex) {
  return (hashSeed(name) + index * 17 + stepIndex * 29 + (index % 7) * 13) % 1000
}

function buildMetric(base, spread, stepIndex, index, severityBoost) {
  const wobble = ((index * 11 + stepIndex * 7) % spread) - spread / 2
  return clamp(base + wobble + severityBoost, 0, 100)
}

function buildBlastRadius(roots, maxDepth = 2) {
  const queue = roots.map((root) => ({ name: root, depth: 0 }))
  const depthByService = new Map()

  while (queue.length) {
    const current = queue.shift()

    if (depthByService.has(current.name) && depthByService.get(current.name) <= current.depth) {
      continue
    }

    depthByService.set(current.name, current.depth)

    if (current.depth >= maxDepth) {
      continue
    }

    const neighbours = [
      ...(dependencyMap[current.name] || []),
      ...(reverseDependencyMap[current.name] || []),
    ]

    neighbours.forEach((serviceName) => {
      queue.push({ name: serviceName, depth: current.depth + 1 })
    })
  }

  return depthByService
}

function getWaveIntensity(stepIndex, wave) {
  const end = wave.start + wave.duration - 1

  if (stepIndex < wave.start || stepIndex > end) {
    return 0
  }

  const relative = wave.duration === 1 ? 1 : (stepIndex - wave.start) / (wave.duration - 1)
  const triangularPeak = 1 - Math.abs(relative * 2 - 1)
  return triangularPeak * wave.maxImpact
}

function createServiceSnapshots() {
  const serviceHistory = Object.fromEntries(serviceNames.map((name) => [name, []]))
  const timeline = []

  timelineLabels.forEach((label, stepIndex) => {
    const timestamp = new Date(Date.UTC(2026, 3, 20, 8 + stepIndex, (stepIndex * 11) % 60, 0)).toISOString()

    const incidentPressure = new Map()
    let maxWaveIntensity = 0

    incidentWaves.forEach((wave) => {
      const intensity = getWaveIntensity(stepIndex, wave)

      if (intensity <= 0) {
        return
      }

      maxWaveIntensity = Math.max(maxWaveIntensity, intensity)

      const blastRadius = buildBlastRadius(wave.roots, 2)

      blastRadius.forEach((depth, serviceName) => {
        const depthModifier = depth === 0 ? 1 : depth === 1 ? 0.66 : 0.42
        const pressure = intensity * depthModifier
        incidentPressure.set(serviceName, (incidentPressure.get(serviceName) || 0) + pressure)
      })
    })

    const riskRanking = serviceNames
      .map((name, index) => {
        const fanOut = (dependencyMap[name] || []).length
        const fanIn = (reverseDependencyMap[name] || []).length
        const topologyPressure = (fanIn + fanOut) * 0.012
        const cyclicalDrift = (((stepIndex + index) % 9) - 4) * 0.008
        const baselineRisk = 0.12 + ((buildScore(name, index, stepIndex) % 100) / 100) * 0.44 + topologyPressure + cyclicalDrift

        const propagatedPressure = incidentPressure.get(name) || 0
        const neighbourPressure = (dependencyMap[name] || []).reduce((sum, downstream) => sum + (incidentPressure.get(downstream) || 0), 0)
        const riskScore = clamp(baselineRisk + propagatedPressure + neighbourPressure * 0.14, 0.03, 0.99)

        return { name, index, riskScore }
      })
      .sort((left, right) => right.riskScore - left.riskScore)

    const criticalCount = Math.max(4, Math.min(10, 4 + Math.round(maxWaveIntensity * 7)))
    const warningBoundary = Math.max(11, Math.min(20, criticalCount + 8 + Math.round(maxWaveIntensity * 4)))
    const critical = new Set(riskRanking.slice(0, criticalCount).map((entry) => entry.name))
    const warning = new Set(riskRanking.slice(criticalCount, warningBoundary).map((entry) => entry.name))
    const riskByName = new Map(riskRanking.map((entry) => [entry.name, entry.riskScore]))

    const snapshot = serviceNames.map((name, index) => {
      const severity = critical.has(name) ? 'critical' : warning.has(name) ? 'warning' : 'healthy'
      const fanOut = (dependencyMap[name] || []).length
      const fanIn = (reverseDependencyMap[name] || []).length
      const dependencyWeight = fanOut + fanIn
      const propagatedPressure = incidentPressure.get(name) || 0
      const severityBoost = severity === 'critical' ? 24 : severity === 'warning' ? 11 : -3
      const failureProbability = clamp(
        (riskByName.get(name) || 0.08) + (severity === 'critical' ? 0.15 : severity === 'warning' ? 0.05 : -0.06),
        0.03,
        0.99
      )
      const cpu = buildMetric(30 + dependencyWeight * 2.8 + stepIndex * 1.2 + propagatedPressure * 30, 26, stepIndex, index, severityBoost)
      const memory = buildMetric(39 + dependencyWeight * 2.1 + stepIndex * 0.9 + propagatedPressure * 24, 22, stepIndex, index, severityBoost - 2)
      const latency = clamp(
        88 + dependencyWeight * 14 + stepIndex * 10 + propagatedPressure * 360 + (severity === 'critical' ? 180 : severity === 'warning' ? 70 : -8),
        18,
        1200
      )
      const errorRate = clamp(
        0.01 + (dependencyWeight % 7) * 0.008 + propagatedPressure * 0.18 + (severity === 'critical' ? 0.1 : severity === 'warning' ? 0.036 : 0.005),
        0.002,
        0.68
      )
      const interactionBase = 130 + dependencyWeight * 30 + ((index * 37 + stepIndex * 17) % 470)
      const interactionMultiplier = 1 + propagatedPressure * 1.1 + (severity === 'critical' ? 0.24 : severity === 'warning' ? 0.1 : 0)

      const entry = {
        id: `${name}-${label}`,
        name,
        label,
        timestamp,
        status: severity,
        interaction_count: Math.round(interactionBase * interactionMultiplier),
        metrics: {
          cpu: Number(cpu.toFixed(1)),
          memory: Number(memory.toFixed(1)),
          latency: Math.round(latency),
          error_rate: Number(errorRate.toFixed(3)),
          failure_probability: Number(failureProbability.toFixed(3)),
        },
        summary: serviceSummaries[name],
        upstream: dependencyMap[name] ? Object.entries(dependencyMap).filter(([, targets]) => targets.includes(name)).map(([source]) => source) : [],
        downstream: dependencyMap[name] || [],
      }

      serviceHistory[name].push(entry)
      return entry
    })

    timeline.push({
      label,
      timestamp,
      snapshot,
      failing: snapshot.filter((entry) => entry.status === 'critical').map((entry) => entry.name),
      atRisk: snapshot.filter((entry) => entry.status === 'warning').map((entry) => entry.name),
    })
  })

  const services = serviceNames.map((name, index) => {
    const latest = serviceHistory[name][serviceHistory[name].length - 1]
    const history = serviceHistory[name]
    const meanCpu = history.reduce((sum, entry) => sum + entry.metrics.cpu, 0) / history.length
    const meanLatency = history.reduce((sum, entry) => sum + entry.metrics.latency, 0) / history.length
    const failureProbability = history.reduce((sum, entry) => sum + entry.metrics.failure_probability, 0) / history.length

    return {
      id: name,
      name,
      description: serviceSummaries[name],
      status: latest.status,
      interaction_count: latest.interaction_count,
      failure_probability: latest.metrics.failure_probability,
      cpu: latest.metrics.cpu,
      memory: latest.metrics.memory,
      latency: latest.metrics.latency,
      error_rate: latest.metrics.error_rate,
      history,
      upstream: latest.upstream,
      downstream: latest.downstream,
      severityRank: latest.status === 'critical' ? 3 : latest.status === 'warning' ? 2 : 1,
      avgCpu: Number(meanCpu.toFixed(1)),
      avgLatency: Math.round(meanLatency),
      avgFailureProbability: Number(failureProbability.toFixed(3)),
      sortIndex: index,
    }
  })

  const alerts = timeline.flatMap((frame, frameIndex) =>
    frame.snapshot
      .filter((entry) => entry.status !== 'healthy')
      .sort((left, right) => right.metrics.failure_probability - left.metrics.failure_probability)
      .slice(0, 12)
      .map((entry, itemIndex) => ({
        id: `${frame.label}-${entry.name}`,
        service: entry.name,
        risk: entry.metrics.failure_probability,
        severity: entry.status === 'critical' ? 'high' : 'medium',
        timestamp: entry.timestamp,
        status: itemIndex === 0 && frameIndex % 2 === 0 ? 'open' : 'queued',
        acknowledged: itemIndex > 6,
        summary:
          entry.status === 'critical'
            ? `${entry.name} failure cascade detected. Upstream pressure from ${(entry.upstream || []).slice(0, 2).join(', ') || 'core services'} with downstream impact on ${(entry.downstream || []).slice(0, 2).join(', ') || 'shared dependencies'}.`
            : `${entry.name} degradation signals increased under dependency load from ${(entry.upstream || []).slice(0, 2).join(', ') || 'adjacent services'}.`,
      }))
  )
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 72)

  const modelMetrics = {
    recall: 0.82,
    f1: 0.6275115919629057,
    precision: 0.51,
    accuracy: 0.87,
    confusionMatrix: [
      [203, 197],
      [44, 1448],
    ],
    lossCurve: [1.24, 1.08, 0.96, 0.84, 0.77, 0.71, 0.69, 0.64, 0.61, 0.58],
    prTradeoff: [
      { threshold: 0.15, precision: 0.52, recall: 0.84 },
      { threshold: 0.25, precision: 0.58, recall: 0.78 },
      { threshold: 0.35, precision: 0.64, recall: 0.72 },
      { threshold: 0.45, precision: 0.69, recall: 0.63 },
      { threshold: 0.55, precision: 0.74, recall: 0.54 },
      { threshold: 0.65, precision: 0.79, recall: 0.44 },
    ],
  }

  const dashboardTrend = timeline.map((frame, index) => ({
    label: frame.label,
    failureProbability: Number((frame.snapshot.filter((entry) => entry.status === 'critical').length / frame.snapshot.length * 100).toFixed(1)),
    latency: Math.round(frame.snapshot.reduce((sum, entry) => sum + entry.metrics.latency, 0) / frame.snapshot.length),
    risk: Number((frame.snapshot.reduce((sum, entry) => sum + entry.metrics.failure_probability, 0) / frame.snapshot.length * 100).toFixed(1)),
    index,
  }))

  const serviceSeries = Object.fromEntries(
    serviceNames.map((name) => [
      name,
      serviceHistory[name].map((entry, index) => ({
        label: timelineLabels[index],
        timestamp: entry.timestamp,
        cpu: entry.metrics.cpu,
        memory: entry.metrics.memory,
        latency: entry.metrics.latency,
        errorRate: Number((entry.metrics.error_rate * 100).toFixed(2)),
        failureProbability: Number((entry.metrics.failure_probability * 100).toFixed(1)),
      })),
    ])
  )

  return {
    serviceNames,
    dependencyMap,
    timeline,
    services,
    alerts,
    modelMetrics,
    dashboardTrend,
    serviceSeries,
    latestSnapshot: timeline[timeline.length - 1].snapshot,
  }
}

export const mockOpsData = createServiceSnapshots()

export function getServiceById(id) {
  return mockOpsData.services.find((service) => service.id === id)
}

export function getStatusLabel(status) {
  if (status === 'critical') {
    return 'FAILURE PREDICTED'
  }

  if (status === 'warning') {
    return 'AT RISK'
  }

  return 'NORMAL'
}
