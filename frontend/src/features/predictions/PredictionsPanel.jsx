import React, { useMemo } from 'react'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatConfidence, formatRelativeTime } from '../../utils/formatters'

export default function PredictionsPanel({ predictions = [] }) {
  const orderedPredictions = useMemo(
    () =>
      [...predictions].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [predictions]
  )

  return (
    <GlassCard className="rounded-[28px] p-6" contentClassName="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Predictions</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--text-primary)]">Failure probability timeline</h3>
        </div>
        <StatusBadge status={orderedPredictions[0]?.failure ? 'critical' : 'warning'} label={`${orderedPredictions.length} recent`} />
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-auto pr-1">
        {orderedPredictions.length ? (
          orderedPredictions.map((prediction) => {
            const serviceName = prediction.telemetry?.service?.name || prediction.serviceName || 'Unknown service'

            return (
              <Link
                key={prediction.id}
                to={`/services/${encodeURIComponent(serviceName)}`}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.05)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{serviceName}</p>
                    {prediction.failure ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(251,113,133,0.28)] bg-[rgba(251,113,133,0.16)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--critical)]">
                        High risk
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="mt-1 text-sm leading-6 text-[var(--text-secondary)]"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {prediction.rootCause || 'Root cause not available yet'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-1">
                      <TriangleAlert size={12} />
                      {formatConfidence(prediction.confidence)} probability
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-1">
                      {formatRelativeTime(prediction.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-sm leading-6 text-[var(--text-muted)]">
            Prediction history will appear once the backend starts streaming inference results.
          </div>
        )}
      </div>
    </GlassCard>
  )
}