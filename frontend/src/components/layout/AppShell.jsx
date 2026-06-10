import React from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import { useDashboardBootstrap } from '../../hooks/useDashboardBootstrap'

export default function AppShell() {
  useDashboardBootstrap()

  return (
    <div className="relative min-h-screen text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 dashboard-grid opacity-[0.26]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[-10rem] h-[24rem] w-[24rem] rounded-full bg-[rgba(249,115,22,0.12)] blur-[140px]" />
      <div className="pointer-events-none absolute right-[-10rem] top-[6rem] h-[20rem] w-[20rem] rounded-full bg-[rgba(255,77,109,0.10)] blur-[140px]" />

      <TopNav />

      <main className="relative mx-auto max-w-[1620px] px-3 pb-8 pt-28 sm:px-4 lg:px-6">
        <Outlet />
      </main>
    </div>
  )
}