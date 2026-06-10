import React from 'react'
import { getStatusTone } from '../../utils/formatters'
import { getStatusLabel } from '../../data/mockOpsData'

export default function StatusBadge({ status, label, className = '' }) {
  const tone = getStatusTone(status)
  const displayLabel = label || getStatusLabel(status) || tone.label

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}
      style={{
        backgroundColor: tone.background,
        color: tone.color,
        borderColor: tone.border,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.color }} />
      {displayLabel}
    </span>
  )
}