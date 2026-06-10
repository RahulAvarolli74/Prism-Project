import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[rgba(4,8,17,0.96)] px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {formatter ? formatter(entry.value, entry.dataKey) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MetricTrendChart({
  data = [],
  series = [],
  height = 300,
  xKey = 'label',
  formatter,
  emptyLabel = 'No telemetry captured yet',
}) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] text-sm text-[var(--text-muted)]">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={(value) => (Number.isFinite(value) ? `${Math.round(value)}` : value)}
          />
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {series.map((entry) => (
            <Line
              key={entry.dataKey}
              type="monotone"
              dataKey={entry.dataKey}
              name={entry.name}
              stroke={entry.color}
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}