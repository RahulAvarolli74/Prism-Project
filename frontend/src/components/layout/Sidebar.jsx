import React, { useMemo } from 'react'
import { Activity, GitBranch, Radar, Server, ShieldAlert, Sparkles } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import GlassCard from '../ui/GlassCard'
import StatusBadge from '../ui/StatusBadge'
import { sortServicesByRisk, formatCompactNumber, formatRelativeTime } from '../../utils/formatters'
import { useDashboardStore } from '../../store/useDashboardStore'

const navItems = [
  { label: 'Dashboard', to: '/', icon: Activity },
  { label: 'Dependency Graph', to: '/dependency-graph', icon: GitBranch },
]

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
          isActive
            ? 'bg-[rgba(124,92,255,0.16)] text-[var(--text-primary)] shadow-[0_0_0_1px_rgba(124,92,255,0.18)]'
            : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]',
        ].join(' ')
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const summary = useDashboardStore((state) => state.summary)
  const services = useDashboardStore((state) => state.services)

  const topServices = useMemo(() => sortServicesByRisk(services).slice(0, 6), [services])

  return (
    <aside className="hidden w-[320px] shrink-0 border-r border-[var(--border-subtle)] bg-[rgba(5,8,22,0.4)] px-5 py-6 xl:flex xl:flex-col">
      <Link to="/" className="flex items-center gap-3 rounded-3xl px-3 py-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(124,92,255,0.35)] bg-[rgba(124,92,255,0.16)] text-[var(--accent-2)] shadow-[0_0_28px_rgba(124,92,255,0.22)]">
          <Radar size={20} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">PRISM</p>
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
            Failure Engine
          </h1>
        </div>
      </Link>

      <div className="mt-8 space-y-2">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </div>

      <GlassCard className="mt-6 flex-1 rounded-[28px] p-5" contentClassName="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Fleet status</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Current system posture</p>
          </div>
          <StatusBadge status={summary?.mlServiceStatus?.status || 'unknown'} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-3">
            <p className="text-[var(--text-muted)]">Services</p>
            <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              {formatCompactNumber(summary?.overview?.totalServices ?? services.length)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-3">
            <p className="text-[var(--text-muted)]">Failures</p>
            <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
              {formatCompactNumber(summary?.overview?.totalFailures ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <ShieldAlert size={15} className="text-[var(--danger)]" />
          {summary?.generatedAt ? `Updated ${formatRelativeTime(summary.generatedAt)}` : 'Waiting for live telemetry'}
        </div>

        <div className="mt-6 flex-1 space-y-3 overflow-auto pr-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            High-risk services
          </p>
          {topServices.length ? (
            topServices.map((service) => (
              <Link
                key={service.name}
                to={`/services/${encodeURIComponent(service.name)}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.05)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{service.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {service.recentFailures ? `${service.recentFailures} predicted failures` : `${service.telemetryCount || 0} telemetry events`}
                  </p>
                </div>
                <StatusBadge status={service.status} />
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-muted)]">
              Service inventory will populate once the backend responds.
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Sparkles size={15} className="text-[var(--accent-2)]" />
            Live monitoring
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Streaming telemetry, alerts, and ML predictions are stitched into a single operational view.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-muted)]">
          <Server size={14} />
          backend-connected
        </div>
      </GlassCard>
    </aside>
  )
}