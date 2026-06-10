import React from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, CircleGauge, Layers3, Target, TriangleAlert } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import MetricCard from '../components/ui/MetricCard'
import SectionHeader from '../components/ui/SectionHeader'
import { mockOpsData } from '../data/mockOpsData'

const precisionRecall = mockOpsData.modelMetrics.prTradeoff.map((entry) => ({
  label: `${Math.round(entry.threshold * 100)}%`,
  precision: Number((entry.precision * 100).toFixed(1)),
  recall: Number((entry.recall * 100).toFixed(1)),
}))

const confusionData = [
  { name: 'TP', value: mockOpsData.modelMetrics.confusionMatrix[0][0], color: '#2dd4bf' },
  { name: 'FP', value: mockOpsData.modelMetrics.confusionMatrix[0][1], color: '#f59e0b' },
  { name: 'FN', value: mockOpsData.modelMetrics.confusionMatrix[1][0], color: '#ff3b5c' },
  { name: 'TN', value: mockOpsData.modelMetrics.confusionMatrix[1][1], color: '#60a5fa' },
]

export default function Metrics() {
  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow="Model evaluation"
        title="Model metrics"
        description="Precision, recall, F1, calibration, and a compact view of the trade-offs that matter in AIOps."
        action={<div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">GATv2 + BiLSTM</div>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Recall" value={mockOpsData.modelMetrics.recall.toFixed(2)} change="High coverage" hint="catch more failures" icon={<Target size={18} />} tone="critical" />
        <MetricCard title="F1" value={mockOpsData.modelMetrics.f1.toFixed(2)} change="Balanced risk" hint="precision-recall compromise" icon={<CircleGauge size={18} />} tone="warning" />
        <MetricCard title="Precision" value={mockOpsData.modelMetrics.precision.toFixed(2)} change="Sensitive net" hint="model favors early warning" icon={<BarChart3 size={18} />} tone="accent" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="rounded-[30px] p-6" contentClassName="h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Confusion matrix</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Prediction outcomes</h3>
            </div>
            <Layers3 size={20} className="text-[var(--accent)]" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {confusionData.map((item) => (
              <div key={item.name} className="rounded-[24px] border border-[var(--border-subtle)] p-4" style={{ backgroundColor: `${item.color}14` }}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{item.name}</p>
                <p className="mt-3 font-mono text-4xl font-bold text-[var(--text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
            Recall is prioritized because the failure engine is designed to surface risk early. Missing a true failure is more expensive than alerting on a few borderline cases, especially in distributed systems where one bad dependency can fan out quickly.
          </div>
        </GlassCard>

        <GlassCard className="rounded-[30px] p-6" contentClassName="h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Precision / Recall tradeoff</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">How the threshold shifts behaviour</h3>
            </div>
            <TriangleAlert size={20} className="text-[var(--warning)]" />
          </div>
          <div className="mt-6 h-[360px]">
            <ResponsiveContainer>
              <AreaChart data={precisionRecall} margin={{ top: 12, right: 12, left: -6, bottom: 4 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="precision" name="Precision" stroke="#f97316" fill="#f97316" fillOpacity={0.16} />
                <Area type="monotone" dataKey="recall" name="Recall" stroke="#ff3b5c" fill="#ff3b5c" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <GlassCard className="rounded-[30px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Training loss</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Stabilization across epochs</h3>
            </div>
            <BarChart3 size={20} className="text-[var(--accent-2)]" />
          </div>
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer>
              <AreaChart data={mockOpsData.modelMetrics.lossCurve.map((value, index) => ({ label: `E${index + 1}`, value }))} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.48} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2.2} fill="url(#lossGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="rounded-[30px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Why recall matters</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">AIOps is a risk capture problem</h3>
            </div>
            <TriangleAlert size={20} className="text-[var(--critical)]" />
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
            <p>
              In failure prediction, the model is not trying to win a benchmark leaderboard. It is trying to find the signal that lets the team intervene before downstream impact becomes expensive.
            </p>
            <p>
              A higher recall means more possible failures are surfaced, which is usually the right trade-off when the cost of a missed incident is higher than the cost of reviewing extra alerts.
            </p>
            <p>
              The interface keeps this visible with score cards, trend curves, and a confusion matrix that make the trade-off explicit instead of hiding it behind a single headline number.
            </p>
          </div>
          <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Training summary</p>
            <p className="mt-2 font-mono text-sm text-[var(--text-secondary)]">
              recall={mockOpsData.modelMetrics.recall} | f1={mockOpsData.modelMetrics.f1} | precision={mockOpsData.modelMetrics.precision}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
