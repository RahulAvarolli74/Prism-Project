import React, { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Activity, Cpu, MemoryStick, TriangleAlert, Waves } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import MetricCard from '../components/ui/MetricCard'
import MiniTrendChart from '../components/charts/MiniTrendChart'
import { useOperationsData } from '../hooks/useOperationsData'
import { formatDateTime } from '../utils/formatters'
import { useDashboardStore } from '../store/useDashboardStore'

export default function ServiceDetails() {
  const { id = '' } = useParams()
  const serviceId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { getServiceById, alerts } = useOperationsData()
  const setSelectedServiceName = useDashboardStore((state) => state.setSelectedServiceName)
  const clearSelectedServiceName = useDashboardStore((state) => state.clearSelectedServiceName)
  const refreshServiceDetail = useDashboardStore((state) => state.refreshServiceDetail)
  const service = getServiceById(serviceId)

  useEffect(() => {
    if (!serviceId) {
      return undefined
    }

    setSelectedServiceName(serviceId)
    refreshServiceDetail(serviceId)

    return () => {
      clearSelectedServiceName()
    }
  }, [clearSelectedServiceName, refreshServiceDetail, serviceId, setSelectedServiceName])

  const recentAlerts = useMemo(
    () => alerts.filter((alert) => alert.service === serviceId).slice(0, 5),
    [alerts, serviceId]
  )

  if (!service) {
    return (
      <GlassCard className="rounded-[30px] p-6">
        <SectionHeader
          eyebrow="Service drill-down"
          title="Service not found"
          description="The requested service id does not exist in the current mock inventory."
          action={
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </button>
          }
        />
      </GlassCard>
    )
  }

  const status = service.status
  const current = service.history[service.history.length - 1]
  const roundedCpu = Number(service.cpu || 0).toFixed(1)
  const roundedMemory = Number(service.memory || 0).toFixed(1)
  const roundedLatency = Math.round(Number(service.latency || 0))
  const roundedCurrentCpu = Number(current?.metrics?.cpu || 0).toFixed(1)
  const roundedCurrentMemory = Number(current?.metrics?.memory || 0).toFixed(1)
  const roundedCurrentLatency = Math.round(Number(current?.metrics?.latency || 0))

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow="Service drill-down"
        title={service.name}
        description={service.description}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <Link
              to="/graph"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              Graph
              <ArrowRight size={15} />
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Status" value={status.toUpperCase()} change={`${Math.round(service.failure_probability * 100)}% predicted risk`} hint="current posture" icon={<Activity size={18} />} tone={status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'success'} />
        <MetricCard title="CPU" value={`${roundedCpu}%`} change="latest frame" hint="utilization" icon={<Cpu size={18} />} tone="neutral" />
        <MetricCard title="Memory" value={`${roundedMemory}%`} change="latest frame" hint="footprint" icon={<MemoryStick size={18} />} tone="accent" />
        <MetricCard title="Latency" value={`${roundedLatency} ms`} change="latest frame" hint="response time" icon={<Waves size={18} />} tone={roundedLatency >= 500 ? 'critical' : 'warning'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="rounded-[30px] p-6" contentClassName="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Telemetry trends</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Resource curves over time</h3>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <MiniTrendChart title="CPU" value={roundedCurrentCpu} data={service.history.map((entry) => ({ label: entry.label, value: Number(Number(entry.metrics.cpu || 0).toFixed(1)) }))} dataKey="value" color="#f97316" unit="%" />
            <MiniTrendChart title="Memory" value={roundedCurrentMemory} data={service.history.map((entry) => ({ label: entry.label, value: Number(Number(entry.metrics.memory || 0).toFixed(1)) }))} dataKey="value" color="#ff3b5c" unit="%" />
            <MiniTrendChart title="Latency" value={roundedCurrentLatency} data={service.history.map((entry) => ({ label: entry.label, value: Math.round(Number(entry.metrics.latency || 0)) }))} dataKey="value" color="#f59e0b" unit=" ms" />
            <MiniTrendChart title="Error rate" value={Math.round(current.metrics.error_rate * 1000) / 10} data={service.history.map((entry) => ({ label: entry.label, value: Number((entry.metrics.error_rate * 100).toFixed(1)) }))} dataKey="value" color="#60a5fa" unit="%" />
          </div>
        </GlassCard>

        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Failure score</p>
            <div className="mt-2 font-mono text-5xl font-bold text-[var(--text-primary)]">{Math.round(service.failure_probability * 100)}%</div>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              The service is scored from the latest dependency-aware telemetry frame and ranked against its neighbouring services.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Upstream</p>
              <div className="mt-3 space-y-2">
                {service.upstream.length ? service.upstream.map((item) => <Link key={item} to={`/service/${item}`} className="block text-sm text-[var(--text-primary)] hover:text-[var(--accent)]">{item}</Link>) : <div className="text-sm text-[var(--text-muted)]">None</div>}
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Downstream</p>
              <div className="mt-3 space-y-2">
                {service.downstream.length ? service.downstream.map((item) => <Link key={item} to={`/service/${item}`} className="block text-sm text-[var(--text-primary)] hover:text-[var(--accent)]">{item}</Link>) : <div className="text-sm text-[var(--text-muted)]">None</div>}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Recent alerts</p>
            <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Alerts tied to this service</h3>
          </div>
          <div className="space-y-3">
            {recentAlerts.length ? recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={alert.status === 'open' ? 'critical' : 'healthy'} label={String(alert.severity || 'low').toUpperCase()} />
                  <div className="text-xs text-[var(--text-muted)]">{formatDateTime(alert.timestamp)}</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{alert.summary}</p>
              </div>
            )) : (
              <div className="rounded-[22px] border border-dashed border-[var(--border-subtle)] p-5 text-sm text-[var(--text-muted)]">No alerts surfaced for this service.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Latest snapshot</p>
            <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Telemetry payload</h3>
          </div>
          <pre className="overflow-auto rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 font-mono text-xs leading-6 text-[var(--text-secondary)]">
{JSON.stringify(current, null, 2)}
          </pre>
        </GlassCard>
      </div>
    </div>
  )
}
