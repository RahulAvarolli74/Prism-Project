import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Activity, AlertTriangle, BarChart3, BrainCircuit, GitBranch, Layers3, TimerReset, Users } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import MetricCard from '../components/ui/MetricCard'
import MetricTrendChart from '../components/charts/MetricTrendChart'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { useOperationsData } from '../hooks/useOperationsData'

function CircularGauge({ value }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex items-center justify-center rounded-[30px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-5">
      <svg viewBox="0 0 140 140" className="h-[180px] w-[180px] -rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.09)" strokeWidth="14" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#healthGauge)"
          strokeWidth="14"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="healthGauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ff3b5c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-5xl font-bold text-[var(--text-primary)]">{value}</div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">system health</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { services, dashboardTrend: trend, latestSnapshot: latestFrame, alerts, modelMetrics } = useOperationsData()
  const currentRisk = Math.round(trend[trend.length - 1]?.risk || 0)
  const healthScore = Math.max(0, Math.round(100 - ((latestFrame.reduce((sum, entry) => sum + (entry.metrics?.failure_probability || 0), 0) / Math.max(latestFrame.length, 1)) * 100)))
  const topServices = [...services].sort((left, right) => right.failure_probability - left.failure_probability).slice(0, 5)

  const severityCounts = services.reduce((accumulator, service) => {
    accumulator[service.status] = (accumulator[service.status] || 0) + 1
    return accumulator
  }, { healthy: 0, warning: 0, critical: 0 })

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow="Operations center"
        title="Microservices failure prediction dashboard"
        description="A dense control room for topology, risk, and model output. The layout is tuned for fast scanning on a live operations shift."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={currentRisk >= 60 ? 'critical' : currentRisk >= 35 ? 'warning' : 'healthy'} />
            <Link
              to="/graph"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              View dependency graph
              <ArrowRight size={15} />
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">System posture</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)]">Health score</h2>
            </div>
            <StatusBadge status={healthScore >= 70 ? 'healthy' : healthScore >= 45 ? 'warning' : 'critical'} />
          </div>
          <div className="grid place-items-center py-2">
            <CircularGauge value={healthScore} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Normal</p>
              <p className="mt-2 font-mono text-3xl font-bold text-[var(--text-primary)]">{severityCounts.healthy}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">At risk</p>
              <p className="mt-2 font-mono text-3xl font-bold text-[var(--text-primary)]">{severityCounts.warning}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Failing</p>
              <p className="mt-2 font-mono text-3xl font-bold text-[var(--text-primary)]">{severityCounts.critical}</p>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Active services" value={services.length} change="44 monitored" hint="service inventory" icon={<Users size={18} />} tone="neutral" />
          <MetricCard title="Current alerts" value={alerts.filter((alert) => alert.status === 'open').length} change="Live feed" hint="open alert queue" icon={<AlertTriangle size={18} />} tone="warning" />
          <MetricCard title="Predicted failures" value={topServices.filter((service) => service.failure_probability >= 0.5).length} change="top risk set" hint="failure forecast" icon={<BrainCircuit size={18} />} tone="critical" />
          <MetricCard title="Avg latency" value={`${Math.round(latestFrame.reduce((sum, entry) => sum + entry.metrics.latency, 0) / latestFrame.length)} ms`} change="current frame" hint="dependency pressure" icon={<TimerReset size={18} />} tone="accent" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Failure trend</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Predicted failure pressure across timestamps</h3>
            </div>
            <div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              6 timestamps
            </div>
          </div>
          <div className="mt-6">
            <MetricTrendChart
              data={trend}
              series={[
                { dataKey: 'risk', name: 'Risk', color: '#ff3b5c' },
                { dataKey: 'latency', name: 'Latency', color: '#f97316' },
                { dataKey: 'failureProbability', name: 'Failure rate', color: '#fbbf24' },
              ]}
              formatter={(value, key) => (key === 'latency' ? `${Math.round(Number(value))} ms` : `${Number(value).toFixed(1)}%`)}
              height={360}
            />
          </div>
        </GlassCard>

        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Quick nav</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Jump to other operational views</h3>
            </div>
            <Layers3 size={20} className="text-[var(--accent)]" />
          </div>

          <div className="mt-5 grid gap-3">
            {[
              { title: 'Dependency graph', to: '/graph', icon: GitBranch, description: 'Inspect blast radius and propagation paths.' },
              { title: 'Alerts panel', to: '/alerts', icon: AlertTriangle, description: 'Review open, queued, and acknowledged alerts.' },
              { title: 'Model metrics', to: '/metrics', icon: BarChart3, description: 'Check recall, F1, precision, and training dynamics.' },
              { title: 'Timeline view', to: '/timeline', icon: Activity, description: 'Step through the six timestamp evolution.' },
            ].map(({ title, to, icon: Icon, description }) => (
              <Link
                key={title}
                to={to}
                className="group rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] text-[var(--accent)]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-[var(--text-primary)]">{title}</div>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="mt-1 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Risk-ranked services</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Top 5 risky services</h3>
            </div>
            <Layers3 size={20} className="text-[var(--warning)]" />
          </div>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--border-subtle)]">
            <table className="min-w-full divide-y divide-[var(--border-subtle)]">
              <thead className="bg-[rgba(255,255,255,0.03)] text-left text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Failure %</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {topServices.map((service) => (
                  <tr key={service.id} className="bg-[rgba(255,255,255,0.01)]">
                    <td className="px-4 py-4 text-sm font-semibold text-[var(--text-primary)]">{service.name}</td>
                    <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">{Math.round(service.failure_probability * 100)}%</td>
                    <td className="px-4 py-4"><StatusBadge status={service.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Telemetry summary</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Latest frame snapshot</h3>
            </div>
            <BarChart3 size={20} className="text-[var(--accent-2)]" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {latestFrame.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{entry.name}</div>
                  <StatusBadge status={entry.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[var(--text-muted)]">CPU</p>
                    <p className="mt-1 font-mono font-semibold text-[var(--text-primary)]">{Number(entry.metrics.cpu || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Latency</p>
                    <p className="mt-1 font-mono font-semibold text-[var(--text-primary)]">{Math.round(Number(entry.metrics.latency || 0))} ms</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}