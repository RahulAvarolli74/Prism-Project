import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Activity,
  BrainCircuit,
  CircleGauge,
  CircuitBoard,
  Cpu,
  DatabaseZap,
  Layers3,
  LineChart,
  MessagesSquare,
  Radar,
  ShieldAlert,
  Workflow,
} from 'lucide-react'
import TopNav from '../components/layout/TopNav'
import GlassCard from '../components/ui/GlassCard'

const sectionMotion = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

const stack = [
  { label: 'GATv2', icon: BrainCircuit },
  { label: 'BiLSTM', icon: Workflow },
  { label: 'React', icon: CircuitBoard },
  { label: 'FastAPI', icon: Activity },
  { label: 'PyTorch', icon: Cpu },
  { label: 'OpenTelemetry', icon: DatabaseZap },
]

const painPoints = [
  {
    title: 'No prediction',
    description: 'Operations teams usually learn about instability only after the first error wave hits production.',
    icon: ShieldAlert,
  },
  {
    title: 'No root cause',
    description: 'Logs, metrics, and traces are typically reviewed in isolation, which hides the dependency path behind the blast radius.',
    icon: Layers3,
  },
  {
    title: 'No proactive alerts',
    description: 'Alerting often reacts to symptoms, not to the sequence of signals that leads to a failure.',
    icon: MessagesSquare,
  },
]

const pipeline = [
  'Logs',
  'Metrics',
  'Traces',
  'Feature engineering',
  'Dependency graph',
  'GATv2',
  'BiLSTM',
  'Failure prediction',
]

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-14 text-[var(--text-primary)]">
      <TopNav />

      <div className="pointer-events-none absolute inset-0 dashboard-grid opacity-[0.2]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[8rem] h-[20rem] w-[20rem] rounded-full bg-[rgba(249,115,22,0.15)] blur-[150px]" />
      <div className="pointer-events-none absolute right-[-8rem] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-[rgba(255,77,109,0.12)] blur-[160px]" />

      <div className="relative mx-auto flex max-w-[1620px] flex-col gap-10 px-3 pt-28 sm:px-4 lg:px-6">
        <motion.section
          {...sectionMotion}
          className="relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(8,12,22,0.92),rgba(11,16,30,0.82))] p-6 text-slate-100 shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10"
        >
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(249,115,22,0.18), transparent 22%), radial-gradient(circle at 80% 15%, rgba(255,77,109,0.14), transparent 20%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: 'auto, auto, 72px 72px, 72px 72px' }} />
          <div className="relative grid min-h-[calc(100vh-11rem)] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(249,115,22,0.22)] bg-[rgba(249,115,22,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--warning)]">
                Real-time AIOps for microservices
              </div>
              <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Predict failures before they happen.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                A production-grade failure prediction engine that combines service logs, metrics, traces, and topology into one operational model. The goal is simple: surface instability early enough for teams to intervene before users feel the blast radius.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  Open dashboard
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#solution"
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.14)]"
                >
                  See how it works
                </a>
              </div>

            </div>

            <div className="grid gap-4 lg:justify-self-end">
              <GlassCard className="rounded-[30px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Model stack</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {stack.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      <Icon size={16} className="text-[var(--accent)]" />
                      {label}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="grid gap-4 lg:grid-cols-3" id="problem">
          {painPoints.map(({ title, description, icon: Icon }) => (
            <GlassCard key={title} className="rounded-[30px] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] text-[var(--critical)]">
                <Icon size={20} />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
            </GlassCard>
          ))}
        </motion.section>

        <motion.section {...sectionMotion} id="solution" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="rounded-[32px] p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Solution pipeline</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-[var(--text-primary)]">The model sees the sequence, not just the spike.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              The approach combines dependency structure with temporal telemetry. Graph attention identifies which neighbours matter, while the recurrent layer turns time-ordered logs, metrics, and traces into a prediction stream that can warn before the outage spreads.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pipeline.map((step, index) => (
                <div key={step} className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
                  <div className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">0{index + 1}</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{step}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="rounded-[32px] p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Why it matters</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
              <p>
                In real production environments, outages rarely appear as a single obvious failure. They begin with weak signals: growing latency, error bursts in a dependent service, or a trace that starts to fan out unexpectedly.
              </p>
              <p>
                This system is designed for that reality. It gives platform teams a fast read on risk, a dependency-aware blast radius view, and a ranked list of services that need attention before the first incident page is fired.
              </p>
              <p>
                The result is an operational dashboard that turns noisy observability data into a decision surface that is dense, readable, and actionable.
              </p>
            </div>
          </GlassCard>
        </motion.section>

        <motion.section {...sectionMotion} className="grid gap-6" id="architecture">
          <GlassCard className="rounded-[32px] p-6 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Architecture overview</p>
            <div className="mt-6 rounded-[28px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-6 lg:p-8">
              <div className="mx-auto grid max-w-[1320px] gap-4 md:grid-cols-3">
                {[
                  { label: 'Logs stream', icon: MessagesSquare, note: 'structured + unstructured logs' },
                  { label: 'Metrics stream', icon: LineChart, note: 'latency, CPU, memory, errors' },
                  { label: 'Trace stream', icon: Radar, note: 'service hop and span behavior' },
                ].map(({ label, icon: Icon, note }) => (
                  <div key={label} className="h-full rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--accent)]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-6 hidden max-w-[1320px] items-center gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
                {[
                  'Feature Engineering',
                  'Dependency Graph',
                  'GATv2 + BiLSTM',
                  'Failure Prediction',
                ].map((stage, index, stages) => (
                  <React.Fragment key={stage}>
                    <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] p-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Stage {index + 1}</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{stage}</p>
                    </div>
                    {index < stages.length - 1 ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--accent)]">
                        <ArrowRight size={16} />
                      </div>
                    ) : null}
                  </React.Fragment>
                ))}
              </div>

              <div className="mx-auto mt-6 grid max-w-[740px] gap-3 lg:hidden">
                {[
                  'Feature Engineering',
                  'Dependency Graph',
                  'GATv2 + BiLSTM',
                  'Failure Prediction',
                ].map((stage, index) => (
                  <div key={stage} className="rounded-[22px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Stage {index + 1}</p>
                    <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{stage}</p>
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-6 max-w-[1320px] rounded-[18px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.025)] p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5">
                    <CircleGauge size={14} className="text-[var(--warning)]" />
                    <span>Real-time inference</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5">
                    <DatabaseZap size={14} className="text-[var(--accent)]" />
                    <span>Streaming feature store</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5">
                    <Workflow size={14} className="text-[var(--success)]" />
                    <span>Dependency-aware scoring</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        <motion.section {...sectionMotion} className="grid gap-4 lg:grid-cols-3" id="stack">
          {stack.map(({ label, icon: Icon }) => (
            <GlassCard key={label} className="rounded-[28px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] text-[var(--accent)]">
                  <Icon size={19} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Core stack</p>
                  <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">{label}</h3>
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.section>

        <footer className="grid gap-4 border-t border-[var(--border-subtle)] py-8 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">PRISM Failure Prediction Engine</div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Built for teams that need a dependency-aware, production-grade view of microservice instability. The interface is intentionally dense so operators can move from signal to action without changing tools.
            </p>
          </div>
          <div className="rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            Real-time operational AI for microservices
          </div>
        </footer>
      </div>
    </div>
  )
}
