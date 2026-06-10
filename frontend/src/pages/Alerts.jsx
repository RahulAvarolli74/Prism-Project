import React, { useEffect, useMemo, useState } from 'react'
import { BellRing, CheckCheck, Filter, ShieldAlert, Trash2 } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { useOperationsData } from '../hooks/useOperationsData'
import { formatDateTime } from '../utils/formatters'

const severityColors = {
  high: 'rgba(255, 59, 92, 0.12)',
  medium: 'rgba(245, 158, 11, 0.12)',
  low: 'rgba(45, 212, 191, 0.12)',
}

export default function Alerts() {
  const { alerts } = useOperationsData()
  const [severity, setSeverity] = useState('all')
  const [rows, setRows] = useState(() => alerts.map((alert) => ({ ...alert })))

  useEffect(() => {
    setRows(alerts.map((alert) => ({ ...alert })))
  }, [alerts])

  const filteredRows = useMemo(() => rows.filter((row) => severity === 'all' || row.severity === severity), [rows, severity])

  const openCount = rows.filter((row) => row.status === 'open').length
  const acknowledgedCount = rows.filter((row) => row.acknowledged).length

  const updateRow = (id, nextStatus) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: nextStatus, acknowledged: nextStatus === 'acknowledged' ? true : row.acknowledged } : row)))
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow="Alerting"
        title="Alerts panel"
        description="A dense queue of prediction-driven alerts with severity filters, acknowledgement, and dismissal controls."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={openCount ? 'critical' : 'healthy'} label={`${openCount} open`} />
            <div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              {acknowledgedCount} acknowledged
            </div>
          </div>
        }
      />

      <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            <Filter size={14} />
            Filter severity
          </div>
          {['all', 'high', 'medium', 'low'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSeverity(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${severity === option ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)]">
          <table className="min-w-full divide-y divide-[var(--border-subtle)]">
            <thead className="bg-[rgba(255,255,255,0.03)] text-left text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Risk %</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredRows.map((row) => (
                <tr key={row.id} style={{ backgroundColor: severityColors[row.severity] || 'rgba(255,255,255,0.01)' }}>
                  <td className="px-4 py-4 text-sm font-semibold text-[var(--text-primary)]">{row.service}</td>
                  <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">{Math.round((Number.isFinite(Number(row.risk)) ? Number(row.risk) : 0) * 100)}%</td>
                  <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{String(row.severity || 'low').toUpperCase()}</td>
                  <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{formatDateTime(row.timestamp)}</td>
                  <td className="px-4 py-4"><StatusBadge status={row.status === 'open' ? 'critical' : 'healthy'} label={String(row.status || 'open').toUpperCase()} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'acknowledged')}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.07)]"
                      >
                        <CheckCheck size={14} />
                        Acknowledge
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, 'dismissed')}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.07)]"
                      >
                        <Trash2 size={14} />
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Open alerts', value: openCount, icon: BellRing },
            { title: 'Acknowledged', value: acknowledgedCount, icon: CheckCheck },
            { title: 'Prediction source', value: 'Model + telemetry', icon: ShieldAlert },
          ].map(({ title, value, icon: Icon }) => (
            <div key={title} className="rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{title}</p>
                <Icon size={15} className="text-[var(--accent)]" />
              </div>
              <p className="mt-3 font-mono text-3xl font-bold text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
