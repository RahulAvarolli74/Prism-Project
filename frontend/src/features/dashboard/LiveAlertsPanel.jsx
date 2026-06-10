import React, { useMemo } from 'react'
import { AlertTriangle, Clock3, Flame, ShieldAlert } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatConfidence, formatRelativeTime } from '../../utils/formatters'

function severityIcon(level) {
  if (level === 'critical') return <Flame size={14} className="text-[var(--critical)]" />
  if (level === 'warning') return <ShieldAlert size={14} className="text-[var(--warning)]" />
  return <AlertTriangle size={14} className="text-[var(--accent-2)]" />
}

export default function LiveAlertsPanel({ alerts = [] }) {
  const orderedAlerts = useMemo(
    () =>
      [...alerts].sort(
        (left, right) => new Date(right.createdAt || right.timestamp || 0).getTime() - new Date(left.createdAt || left.timestamp || 0).getTime()
      ),
    [alerts]
  )

  return (
    <GlassCard className="rounded-[28px] p-6" contentClassName="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Live alerts</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--text-primary)]">Critical failures and spikes</h3>
        </div>
        <StatusBadge status={orderedAlerts[0]?.level || 'unknown'} label={orderedAlerts.length ? `${orderedAlerts.length} active` : 'Quiet'} />
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-auto pr-1">
        {orderedAlerts.length ? (
          orderedAlerts.map((alert) => (
            <div
              key={alert.id || `${alert.service}-${alert.createdAt}`}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] p-2">
                    {severityIcon(alert.level)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {alert.title || `${alert.service || 'Service'} flagged`}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      {alert.message || alert.rootCause || 'Telemetry drift detected'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={alert.level} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-1">
                  <Clock3 size={12} />
                  {formatRelativeTime(alert.createdAt || alert.timestamp)}
                </span>
                {alert.confidence !== undefined ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-1">
                    Confidence {formatConfidence(alert.confidence)}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-sm leading-6 text-[var(--text-muted)]">
            No active alerts yet. The backend will stream new predictions and service alerts here.
          </div>
        )}
      </div>
    </GlassCard>
  )
}