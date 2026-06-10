import React from 'react'
import { Activity, RefreshCw, Wifi, WifiOff, WifiZero } from 'lucide-react'
import { useDashboardStore } from '../../store/useDashboardStore'
import ThemeToggle from '../common/ThemeToggle'
import { formatRelativeTime } from '../../utils/formatters'

function statusMeta(status) {
  switch (status) {
    case 'live':
      return { label: 'Live', icon: Wifi, color: 'var(--success)' }
    case 'reconnecting':
      return { label: 'Reconnecting', icon: WifiZero, color: 'var(--warning)' }
    case 'offline':
      return { label: 'Offline', icon: WifiOff, color: 'var(--danger)' }
    case 'degraded':
      return { label: 'Degraded', icon: WifiZero, color: 'var(--warning)' }
    default:
      return { label: 'Connecting', icon: WifiZero, color: 'var(--text-secondary)' }
  }
}

export default function TopBar() {
  const summary = useDashboardStore((state) => state.summary)
  const connectionStatus = useDashboardStore((state) => state.connectionStatus)
  const refreshDashboard = useDashboardStore((state) => state.refreshDashboard)
  const lastUpdated = useDashboardStore((state) => state.lastUpdated)

  const meta = statusMeta(connectionStatus)
  const StatusIcon = meta.icon

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[rgba(4,8,17,0.74)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--accent-2)] xl:hidden">
            <Activity size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Microservices observability</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
                Failure Prediction Engine
              </h2>
              <span className="hidden h-1 w-1 rounded-full bg-[var(--text-muted)] sm:inline-block" />
              <p className="text-sm text-[var(--text-secondary)]">
                {summary?.generatedAt ? `Refreshed ${formatRelativeTime(lastUpdated || summary.generatedAt)}` : 'Bootstrapping telemetry'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-[var(--text-secondary)] md:flex">
            <StatusIcon size={14} style={{ color: meta.color }} />
            {meta.label}
          </div>
          <button
            type="button"
            onClick={refreshDashboard}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}