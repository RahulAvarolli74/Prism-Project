import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape from 'cytoscape'
import { ArrowRight, Filter, GitBranch, Network, PanelRightOpen } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import MiniTrendChart from '../components/charts/MiniTrendChart'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useOperationsData } from '../hooks/useOperationsData'
import { getServiceDetail } from '../services/api'

function buildPositions(services) {
  const ordered = [...services].sort((left, right) => right.failure_probability - left.failure_probability)
  return ordered.map((service, index) => ({
    ...service,
    x: 150 + (index % 6) * 230,
    y: 120 + Math.floor(index / 6) * 150,
  }))
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function pickMetric(metrics = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const numeric = Number(metrics?.[key])
    if (Number.isFinite(numeric)) {
      return numeric
    }
  }

  return fallback
}

export default function DependencyGraph() {
  const { services, dependencyMap, getServiceById } = useOperationsData()
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const { theme } = useTheme()
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(services.find((service) => service.status !== 'healthy')?.id || services[0]?.id || '')
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null)

  const visibleServices = useMemo(() => {
    if (filter === 'failures') {
      return services.filter((service) => service.status === 'critical')
    }

    if (filter === 'at-risk') {
      return services.filter((service) => service.status !== 'healthy')
    }

    return services
  }, [filter, services])

  const selectedService = getServiceById(selectedId) || visibleServices[0]

  useEffect(() => {
    let active = true

    if (!selectedService?.name) {
      setSelectedServiceDetail(null)
      return () => {
        active = false
      }
    }

    getServiceDetail(selectedService.name)
      .then((response) => {
        if (active) {
          setSelectedServiceDetail(response.data || null)
        }
      })
      .catch(() => {
        if (active) {
          setSelectedServiceDetail(null)
        }
      })

    return () => {
      active = false
    }
  }, [selectedService?.name])

  const selectedHistory = useMemo(() => {
    const detailTelemetry = Array.isArray(selectedServiceDetail?.recentTelemetry) ? selectedServiceDetail.recentTelemetry : []
    const baselineRisk = toNumber(selectedService?.failure_probability, 0)

    // Prefer fetched detail telemetry; fall back to mock history
    if (detailTelemetry.length > 0) {
      return detailTelemetry
        .slice()
        .reverse()
        .map((entry, index) => {
          const metrics = entry?.metrics || {}
          return {
            label: `t${index + 1}`,
            metrics: {
              cpu: pickMetric(metrics, ['cpu', 'cpu_usage', 'cpuUsage'], 0),
              memory: pickMetric(metrics, ['memory', 'memory_usage', 'memoryUsage'], 0),
              latency: pickMetric(metrics, ['latency', 'latency_ms', 'response_time', 'responseTime'], 0),
              failure_probability: toNumber(entry?.latestPrediction?.confidence, baselineRisk),
            },
          }
        })
    }

    // Fallback to mock history (already has metrics structure)
    const mockHistory = selectedService?.history || []
    return mockHistory.map((entry, index) => ({
      label: entry.label || `t${index + 1}`,
      metrics: {
        cpu: toNumber(entry?.metrics?.cpu, 0),
        memory: toNumber(entry?.metrics?.memory, 0),
        latency: toNumber(entry?.metrics?.latency, 0),
        failure_probability: toNumber(entry?.metrics?.failure_probability, baselineRisk),
      },
    }))
  }, [selectedService?.failure_probability, selectedService?.history, selectedServiceDetail?.recentTelemetry])

  const latestHistoryPoint = selectedHistory[selectedHistory.length - 1]

  const roundedSelectedCpu = Number(
    pickMetric(
      latestHistoryPoint?.metrics,
      ['cpu', 'cpu_usage', 'cpuUsage'],
      toNumber(selectedService?.cpu, 0)
    )
  ).toFixed(1)

  const roundedSelectedMemory = Number(
    pickMetric(
      latestHistoryPoint?.metrics,
      ['memory', 'memory_usage', 'memoryUsage'],
      toNumber(selectedService?.memory, 0)
    )
  ).toFixed(1)

  const roundedSelectedLatency = Math.round(
    pickMetric(
      latestHistoryPoint?.metrics,
      ['latency', 'latency_ms', 'response_time', 'responseTime'],
      toNumber(selectedService?.latency, 0)
    )
  )

  useEffect(() => {
    if (!containerRef.current) {
      return undefined
    }

    const positions = buildPositions(visibleServices)
    const visibleIds = new Set(positions.map((service) => service.id))
    const elements = [
      ...positions.map((service) => ({
        data: {
          id: service.id,
          label: service.id,
          status: service.status,
          interactionCount: service.interaction_count,
          failureProbability: service.failure_probability,
          serviceId: service.id,
        },
        position: { x: service.x, y: service.y },
        classes: service.status,
      })),
      ...Object.entries(dependencyMap)
        .flatMap(([source, targets]) => targets.map((target) => ({ source, target })))
        .filter(({ source, target }) => visibleIds.has(source) && visibleIds.has(target))
        .map((edge) => ({
          data: { id: `${edge.source}-${edge.target}`, source: edge.source, target: edge.target },
        })),
    ]

    if (cyRef.current) {
      cyRef.current.destroy()
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      layout: { name: 'preset', fit: true, padding: 30 },
      style: [
        {
          selector: 'core',
          style: { 'background-color': 'transparent' },
        },
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: 'var(--text-primary)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 11,
            'font-weight': '700',
            'text-wrap': 'wrap',
            'text-max-width': 90,
            width: 'mapData(interactionCount, 90, 500, 42, 92)',
            height: 'mapData(interactionCount, 90, 500, 42, 92)',
            'border-width': 2,
            'border-color': 'rgba(255,255,255,0.18)',
            'background-color': '#4f46e5',
          },
        },
        {
          selector: '.healthy',
          style: { 'background-color': 'rgba(45,212,191,0.9)' },
        },
        {
          selector: '.warning',
          style: { 'background-color': 'rgba(245,158,11,0.95)' },
        },
        {
          selector: '.critical',
          style: { 'background-color': 'rgba(255,59,92,0.95)' },
        },
        {
          selector: 'edge',
          style: {
            width: 2.8,
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': theme === 'light' ? 'rgba(51,65,85,0.88)' : 'rgba(226,232,240,0.82)',
            'line-color': theme === 'light' ? 'rgba(71,85,105,0.65)' : 'rgba(226,232,240,0.44)',
            'line-opacity': 0.95,
            'target-arrow-fill': 'filled',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#f97316',
            'border-width': 4,
            'shadow-blur': 16,
            'shadow-color': '#f97316',
            'shadow-opacity': 0.35,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
          },
        },
      ],
    })

    cy.on('tap', 'node', (event) => {
      setSelectedId(event.target.data('serviceId'))
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [visibleServices, theme])

  return (
    <div className="mx-auto max-w-[1520px] space-y-6 pb-8">
      <SectionHeader
        eyebrow="Topology"
        title="Service dependency graph"
        description="Interactive view of service calls, failure propagation, and dependency hotspots."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={selectedService?.status || 'healthy'} label={selectedService?.name || 'selected'} />
            <Link
              to={`/service/${selectedService?.id || ''}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              Service detail
              <ArrowRight size={15} />
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <Filter size={14} />
          Filter graph
        </div>
        {[
          { label: 'Show all', value: 'all' },
          { label: 'At risk only', value: 'at-risk' },
          { label: 'Failures only', value: 'failures' },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filter === item.value ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-[1500px] items-start gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassCard className="rounded-[30px] p-4" contentClassName="h-full">
          <div className="mb-4 flex items-center justify-between gap-3 px-2 pt-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Interactive graph</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Nodes scale by interaction count</h3>
            </div>
            <div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              <Network size={14} className="inline-block" /> cytoscape
            </div>
          </div>
          <div ref={containerRef} className="h-[74vh] min-h-[640px] rounded-[26px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]" />
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Selected service</p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{selectedService?.name}</h3>
              </div>
              <PanelRightOpen size={20} className="text-[var(--accent)]" />
            </div>
            <StatusBadge status={selectedService?.status || 'healthy'} />
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{selectedService?.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">CPU</p>
                <p className="mt-2 font-mono text-3xl font-bold text-[var(--text-primary)]">{roundedSelectedCpu}%</p>
              </div>
              <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Memory</p>
                <p className="mt-2 font-mono text-3xl font-bold text-[var(--text-primary)]">{roundedSelectedMemory}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="rounded-[30px] p-6" contentClassName="space-y-4">
            <MiniTrendChart title="Failure probability" value={Math.round((selectedService?.failure_probability || 0) * 100)} data={selectedHistory.map((entry, index) => ({ label: entry.label || `t${index + 1}`, value: Math.round(toNumber(entry?.metrics?.failure_probability, toNumber(selectedService?.failure_probability, 0)) * 100) }))} dataKey="value" color="#ff3b5c" unit="%" />
            <MiniTrendChart title="Latency" value={roundedSelectedLatency} data={selectedHistory.map((entry, index) => ({ label: entry.label || `t${index + 1}`, value: Math.round(toNumber(entry?.metrics?.latency, 0)) }))} dataKey="value" color="#f97316" unit=" ms" />
          </GlassCard>

          <GlassCard className="rounded-[30px] p-6" contentClassName="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Dependencies</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Upstream / downstream</h3>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Upstream</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedService?.upstream || []).map((item) => <Link key={item} to={`/service/${item}`} className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-[var(--text-primary)]">{item}</Link>)}
                {!selectedService?.upstream.length ? <div className="text-sm text-[var(--text-muted)]">None</div> : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Downstream</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedService?.downstream || []).map((item) => <Link key={item} to={`/service/${item}`} className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-[var(--text-primary)]">{item}</Link>)}
                {!selectedService?.downstream.length ? <div className="text-sm text-[var(--text-muted)]">None</div> : null}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}