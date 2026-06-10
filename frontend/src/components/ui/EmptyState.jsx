import React from 'react'

export default function EmptyState({ title, description, action }) {
  return (
    <div className="glass-panel rounded-3xl p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] text-[var(--accent-2)]">
        <span className="text-2xl">~</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}