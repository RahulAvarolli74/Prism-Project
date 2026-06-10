import React, { useEffect, useMemo, useState } from 'react'
import { Pause, Play, Rewind } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import SectionHeader from '../components/ui/SectionHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { useOperationsData } from '../hooks/useOperationsData'

export default function Timeline() {
  const { timeline } = useOperationsData()
  const [playing, setPlaying] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!playing || timeline.length === 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % timeline.length)
    }, 1800)

    return () => window.clearInterval(timer)
  }, [playing, timeline.length])

  useEffect(() => {
    if (activeIndex >= timeline.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, timeline.length])

  const activeFrame = timeline[activeIndex] || timeline[0] || { failing: [], snapshot: [], label: 't1', atRisk: [] }
  const currentSnapshot = useMemo(() => activeFrame.snapshot, [activeFrame])

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow="Sequence view"
        title="Timeline view"
        description="Move through the six captured timestamps and see how risk propagates across the mesh over time."
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={activeFrame.failing.length ? 'critical' : 'healthy'} label={activeFrame.label} />
            <button
              type="button"
              onClick={() => setPlaying((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex(0)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              <Rewind size={15} />
              Reset
            </button>
          </div>
        }
      />

      <GlassCard className="rounded-[30px] p-6" contentClassName="flex h-full flex-col gap-5">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {timeline.map((frame, index) => (
            <button
              key={frame.label}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`min-w-[180px] rounded-[24px] border px-4 py-4 text-left transition-all ${index === activeIndex ? 'border-[rgba(249,115,22,0.28)] bg-[rgba(249,115,22,0.08)]' : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)]'}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{frame.label}</div>
              <div className="mt-3 font-mono text-2xl font-bold text-[var(--text-primary)]">{frame.failing.length}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">failing services</div>
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Propagation</p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{activeFrame.label} risk spread</h3>
              </div>
              <StatusBadge status={activeFrame.failing.length ? 'critical' : 'healthy'} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {activeFrame.failing.slice(0, 3).map((service) => (
                <div key={service} className="rounded-full border border-[rgba(255,59,92,0.22)] bg-[rgba(255,59,92,0.08)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
                  {service}
                </div>
              ))}
              {activeFrame.atRisk.slice(0, 6).map((service) => (
                <div key={service} className="rounded-full border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.08)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
                  {service}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {currentSnapshot.slice(0, 12).map((entry) => (
                <div key={entry.id} className={`rounded-[18px] border px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${entry.status === 'critical' ? 'border-[rgba(255,59,92,0.22)] bg-[rgba(255,59,92,0.09)]' : entry.status === 'warning' ? 'border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.08)]' : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]'}`}>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Timeline status grid</p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">All {currentSnapshot.length} services at {activeFrame.label}</h3>
              </div>
              <div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                auto-advance {playing ? 'on' : 'off'}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8">
              {currentSnapshot.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] ${entry.status === 'critical' ? 'border-[rgba(255,59,92,0.22)] bg-[rgba(255,59,92,0.12)] text-[var(--text-primary)]' : entry.status === 'warning' ? 'border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.10)] text-[var(--text-primary)]' : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]'}`}
                >
                  {entry.name.slice(0, 6)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
