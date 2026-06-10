import React from 'react'
import { Link } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCompactNumber, formatConfidence } from '../../utils/formatters'

export default function ServiceHealthTable({ services = [] }) {
  return (
    <GlassCard className="rounded-[28px] p-6" contentClassName="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Service health</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--text-primary)]">Node-level reliability</h3>
        </div>
        <StatusBadge status={services[0]?.status || 'unknown'} label={`${services.length} services`} />
      </div>

      <div className="mt-5 flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              <th className="px-3 pb-2 font-semibold">Service</th>
              <th className="px-3 pb-2 font-semibold">Status</th>
              <th className="px-3 pb-2 font-semibold">Telemetry</th>
              <th className="px-3 pb-2 font-semibold">Recent failures</th>
              <th className="px-3 pb-2 font-semibold">Avg confidence</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.name} className="rounded-2xl bg-[rgba(255,255,255,0.03)] transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                <td className="rounded-l-2xl px-3 py-4 font-semibold text-[var(--text-primary)]">
                  <Link to={`/services/${encodeURIComponent(service.name)}`} className="hover:text-[var(--accent-2)]">
                    {service.name}
                  </Link>
                </td>
                <td className="px-3 py-4">
                  <StatusBadge status={service.status} />
                </td>
                <td className="px-3 py-4 text-[var(--text-secondary)]">
                  {formatCompactNumber(service.telemetryCount || 0)}
                </td>
                <td className="px-3 py-4 text-[var(--text-secondary)]">
                  {formatCompactNumber(service.recentFailures || 0)}
                </td>
                <td className="rounded-r-2xl px-3 py-4 text-[var(--text-secondary)]">
                  {service.avgConfidence !== null && service.avgConfidence !== undefined ? formatConfidence(service.avgConfidence) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}