import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronDown, Zap } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#resources', hasDropdown: true },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b backdrop-blur-xl shadow-xs'
          : ''
      }`}
      style={{
        backgroundColor: scrolled ? 'var(--navbar-bg)' : 'transparent',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-brand-solid)' }}
            >
              <Zap size={18} className="text-white" />
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              PRISM
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
                )}
              </a>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <a
              href="#"
              className="px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 hover:bg-[var(--bg-tertiary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Log in
            </a>
            <a
              href="#get-started"
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-90 shadow-xs"
              style={{ backgroundColor: 'var(--bg-brand-solid)' }}
            >
              Sign up
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t pb-4 animate-in slide-in-from-top duration-200"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <div className="pt-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-base font-medium rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-4 pt-4 space-y-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <a
                href="#"
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold rounded-lg border"
                style={{ color: 'var(--btn-secondary-text)', borderColor: 'var(--btn-secondary-border)', backgroundColor: 'var(--btn-secondary-bg)' }}
              >
                Log in
              </a>
              <a
                href="#get-started"
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: 'var(--bg-brand-solid)' }}
              >
                Sign up
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
