import React from 'react'
import { Handle, Position } from 'reactflow'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCompactNumber } from '../../utils/formatters'

export default function ServiceNode({ data }) {
  return (
    <div
      className="min-w-[220px] rounded-3xl border border-[var(--border-subtle)] bg-[rgba(9,14,27,0.98)] px-4 py-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        boxShadow: data?.status === 'critical'
          ? '0 0 0 1px rgba(251, 113, 133, 0.22), 0 24px 50px rgba(251, 113, 133, 0.12)'
          : data?.status === 'warning'
            ? '0 0 0 1px rgba(251, 191, 36, 0.2), 0 20px 45px rgba(251, 191, 36, 0.08)'
            : '0 18px 40px rgba(0, 0, 0, 0.28)',
      }}
      onClick={data?.onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          data?.onSelect?.()
        }
      }}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-[var(--accent-2)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">{data?.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{data?.tier || 'service'}</p>
        </div>
        <StatusBadge status={data?.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-2.5">
          <p className="text-[var(--text-muted)]">Telemetry</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {formatCompactNumber(data?.telemetryCount || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-2.5">
          <p className="text-[var(--text-muted)]">Risk</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {data?.score !== null && data?.score !== undefined ? `${Number(data.score).toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-0 !bg-[var(--accent)]" />
    </div>
  )
}