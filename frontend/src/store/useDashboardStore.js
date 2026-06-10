import { create } from 'zustand'
import {
  getDashboardSummary,
  getDependencyGraph,
  getPredictions,
  getServiceDetail,
  getServices,
  getTelemetry,
} from '../services/api'
import { buildFleetMetricSeries, buildPredictionTimeline } from '../utils/fleet'
import { normalizeStatus, sortServicesByRisk } from '../utils/formatters'

const initialLoading = {
  summary: false,
  services: false,
  predictions: false,
  dependencyGraph: false,
  fleetMetrics: false,
  serviceDetails: {},
}

const initialErrors = {
  summary: null,
  services: null,
  predictions: null,
  dependencyGraph: null,
  fleetMetrics: null,
  serviceDetails: {},
}

function mergeServicesWithHealth(services = [], serviceHealth = []) {
  const healthByName = new Map(serviceHealth.map((entry) => [entry.name, entry]))

  return sortServicesByRisk(services.map((service) => {
    const health = healthByName.get(service.name) || {}

    return {
      ...service,
      status: normalizeStatus(health.status),
      score: health.score ?? null,
      recentFailures: health.recentFailures ?? 0,
      avgConfidence: health.avgConfidence ?? null,
      telemetryCount: health.telemetryCount ?? service.telemetryCount ?? 0,
    }
  }))
}

function buildAlertFeed(summary = null, liveAlerts = []) {
  const alerts = Array.isArray(summary?.recentFailures)
    ? summary.recentFailures.map((item) => ({
        id: item.id,
        service: item.service,
        confidence: item.confidence,
        rootCause: item.rootCause,
        createdAt: item.createdAt,
        level: item.confidence >= 0.85 ? 'critical' : 'warning',
        source: 'backend',
      }))
    : []

  return [...liveAlerts, ...alerts]
    .sort((left, right) => new Date(right.createdAt || right.timestamp || 0).getTime() - new Date(left.createdAt || left.timestamp || 0).getTime())
    .slice(0, 18)
}

function pickSnapshotServices(services = []) {
  return services
    .filter((service) => service.name)
    .slice(0, 4)
}

export const useDashboardStore = create((set, get) => ({
  summary: null,
  services: [],
  predictions: [],
  predictionTimeline: [],
  dependencyGraph: [],
  serviceSnapshots: [],
  fleetMetrics: [],
  liveEvents: [],
  alerts: [],
  connectionStatus: 'connecting',
  selectedServiceName: null,
  lastUpdated: null,
  refreshToken: 0,
  loading: initialLoading,
  errors: initialErrors,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setSelectedServiceName: (selectedServiceName) => set({ selectedServiceName }),

  clearSelectedServiceName: () => set({ selectedServiceName: null }),

  pushLiveEvent: (event) => set((state) => ({
    liveEvents: [event, ...state.liveEvents].slice(0, 50),
  })),

  pushAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 30),
  })),

  bootstrapDashboard: async () => {
    await get().refreshDashboard()
  },

  refreshDashboard: async () => {
    const token = Date.now()

    set((state) => ({
      refreshToken: token,
      loading: {
        ...state.loading,
        summary: true,
        services: true,
        predictions: true,
        dependencyGraph: true,
        fleetMetrics: true,
      },
      errors: {
        ...state.errors,
        summary: null,
        services: null,
        predictions: null,
        dependencyGraph: null,
        fleetMetrics: null,
      },
    }))

    try {
      const [summaryResponse, servicesResponse, predictionsResponse, dependencyResponse] = await Promise.all([
        getDashboardSummary(),
        getServices(),
        getPredictions({ limit: 20 }),
        getDependencyGraph(),
      ])

      if (get().refreshToken !== token) {
        return
      }

      const summary = summaryResponse.data ?? null
      const services = mergeServicesWithHealth(servicesResponse.data ?? [], summary?.serviceHealth ?? [])
      const predictions = predictionsResponse.items ?? []
      const predictionTimeline = buildPredictionTimeline(predictions)
      const dependencyGraph = dependencyResponse.data ?? []
      const serviceSnapshots = await Promise.all(
        pickSnapshotServices(services).map(async (service) => {
          try {
            const snapshot = await getServiceDetail(service.name)
            return snapshot.data
          } catch {
            return null
          }
        })
      )

      if (get().refreshToken !== token) {
        return
      }

      set((state) => ({
        summary,
        services,
        predictions,
        predictionTimeline,
        dependencyGraph,
        serviceSnapshots: serviceSnapshots.filter(Boolean),
        alerts: buildAlertFeed(summary, state.alerts.filter((alert) => alert.source === 'socket')),
        lastUpdated: new Date().toISOString(),
        loading: {
          ...state.loading,
          summary: false,
          services: false,
          predictions: false,
          dependencyGraph: false,
          fleetMetrics: false,
        },
        errors: initialErrors,
      }))

      set((state) => ({
        fleetMetrics: buildFleetMetricSeries(state.serviceSnapshots),
      }))
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          summary: false,
          services: false,
          predictions: false,
          dependencyGraph: false,
          fleetMetrics: false,
        },
        errors: {
          ...state.errors,
          summary: error.message,
          services: error.message,
          predictions: error.message,
          dependencyGraph: error.message,
          fleetMetrics: error.message,
        },
      }))
    }
  },

  refreshServiceDetail: async (serviceName) => {
    if (!serviceName) {
      return null
    }

    set((state) => ({
      loading: {
        ...state.loading,
        serviceDetails: {
          ...state.loading.serviceDetails,
          [serviceName]: true,
        },
      },
      errors: {
        ...state.errors,
        serviceDetails: {
          ...state.errors.serviceDetails,
          [serviceName]: null,
        },
      },
    }))

    try {
      const [detailResponse, predictionResponse, telemetryResponse] = await Promise.all([
        getServiceDetail(serviceName),
        getPredictions({ service: serviceName, limit: 8 }),
        getTelemetry({ serviceName, limit: 6 }),
      ])

      const detail = detailResponse.data ?? null
      const predictions = predictionResponse.items ?? []
      const telemetry = telemetryResponse.items ?? []

      const payload = {
        detail,
        predictions,
        telemetry,
        predictionTimeline: buildPredictionTimeline(predictions),
        updatedAt: new Date().toISOString(),
      }

      set((state) => ({
        serviceDetails: {
          ...state.serviceDetails,
          [serviceName]: payload,
        },
        loading: {
          ...state.loading,
          serviceDetails: {
            ...state.loading.serviceDetails,
            [serviceName]: false,
          },
        },
      }))

      return payload
    } catch (error) {
      set((state) => ({
        loading: {
          ...state.loading,
          serviceDetails: {
            ...state.loading.serviceDetails,
            [serviceName]: false,
          },
        },
        errors: {
          ...state.errors,
          serviceDetails: {
            ...state.errors.serviceDetails,
            [serviceName]: error.message,
          },
        },
      }))

      return null
    }
  },

  recordSocketEvent: (eventType, payload) => {
    const event = {
      id: payload?.predictionId || payload?.telemetryId || payload?.serviceName || `${eventType}-${Date.now()}`,
      type: eventType,
      payload,
      createdAt: new Date().toISOString(),
      source: 'socket',
    }

    set((state) => ({
      liveEvents: [event, ...state.liveEvents].slice(0, 50),
      alerts:
        eventType === 'service_alert'
          ? [
              {
                ...payload,
                id: event.id,
                source: 'socket',
                createdAt: event.createdAt,
              },
              ...state.alerts,
            ].slice(0, 30)
          : state.alerts,
    }))
  },

  refreshFleetMetrics: () => {
    set((state) => ({
      fleetMetrics: buildFleetMetricSeries(state.serviceSnapshots),
    }))
  },

  hydrateSocketAlertFeed: () => {
    set((state) => ({
      alerts: buildAlertFeed(state.summary, state.alerts.filter((alert) => alert.source === 'socket')),
    }))
  },
}))