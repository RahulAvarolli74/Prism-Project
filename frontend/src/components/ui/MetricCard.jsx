import React from 'react'

export default function MetricCard({ title, value, change, hint, icon, tone = 'neutral' }) {
  const toneStyles = {
    neutral: 'from-white/8 to-white/3',
    success: 'from-emerald-500/20 to-cyan-400/10',
    warning: 'from-amber-500/24 to-orange-400/12',
    critical: 'from-rose-500/24 to-red-500/12',
    accent: 'from-amber-500/18 to-rose-500/12',
  }

  return (
    <div className="glass-panel-strong hover-lift rounded-[28px] border p-5 sm:p-6">
      <div className={`rounded-2xl bg-gradient-to-br ${toneStyles[tone] || toneStyles.neutral} p-[1px]`}>
        <div className="rounded-2xl bg-[var(--surface-elevated)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">{title}</p>
              <p className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {value}
              </p>
            </div>
            {icon ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] p-3 text-[var(--critical)]">
                {icon}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            {change ? <span className="font-semibold text-[var(--warning)]">{change}</span> : <span />}
            {hint ? <span className="text-[var(--text-muted)]">{hint}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}