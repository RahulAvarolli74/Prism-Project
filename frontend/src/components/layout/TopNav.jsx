import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, PanelLeftClose, Shield } from 'lucide-react'
import ThemeToggle from '../common/ThemeToggle'
import { useOperationsData } from '../../hooks/useOperationsData'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Graph', to: '/graph' },
  { label: 'Alerts', to: '/alerts' },
  { label: 'Metrics', to: '/metrics' },
  { label: 'Timeline', to: '/timeline' },
]

function NavPill({ to, label, end = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => [
        'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200',
        isActive
          ? 'bg-[rgba(249,115,22,0.16)] text-[var(--text-primary)] shadow-[0_0_0_1px_rgba(249,115,22,0.22)]'
          : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]',
      ].join(' ')}
    >
      {label}
    </NavLink>
  )
}

export default function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { services, getStatusLabel } = useOperationsData()

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-4 lg:px-6">
        <div className="mx-auto flex max-w-[1520px] items-center gap-2.5 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--nav-surface)] px-2.5 py-1.5 shadow-[0_22px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <div className="hidden sm:block">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">PRISM</div>
              <div className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">Failure Engine</div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <nav className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-1">
              {navItems.map((item) => (
                <NavPill key={item.to} {...item} end={item.to === '/'} />
              ))}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] bg-[rgba(3,7,18,0.64)] backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(92vw,380px)] flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Navigation</div>
                <div className="mt-1 font-display text-xl font-bold text-[var(--text-primary)]">PRISM Control</div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)]"
                aria-label="Close navigation"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {navItems.map((item) => (
                <NavPill key={item.to} {...item} end={item.to === '/'} onClick={() => setMenuOpen(false)} />
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Shield size={15} className="text-[var(--warning)]" />
                Current posture
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {getStatusLabel(services.find((entry) => entry.status !== 'healthy')?.status || 'healthy')} across the latest telemetry frame.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}