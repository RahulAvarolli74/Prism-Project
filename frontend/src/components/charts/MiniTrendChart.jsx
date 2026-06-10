import React from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)]">
        {payload[0]?.value}{unit}
      </p>
    </div>
  )
}

export default function MiniTrendChart({ title, value, data = [], dataKey, color, unit = '', height = 120 }) {
  return (
    <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{title}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[var(--text-primary)]">{value}{unit}</p>
        </div>
        <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      </div>

      <div className="mt-3" style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${dataKey}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.42} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, 'dataMax + 10']} />
            <Tooltip content={<ChartTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${dataKey}-gradient)`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
