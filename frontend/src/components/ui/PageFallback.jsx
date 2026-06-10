import React from 'react'

export default function PageFallback() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="h-4 w-40 rounded-full bg-[rgba(148,163,184,0.16)]" />
          <div className="mt-5 h-10 w-72 rounded-2xl bg-[rgba(148,163,184,0.12)]" />
          <div className="mt-3 h-5 w-[min(100%,26rem)] rounded-full bg-[rgba(148,163,184,0.12)]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-panel rounded-3xl p-6">
              <div className="h-4 w-24 rounded-full bg-[rgba(148,163,184,0.12)]" />
              <div className="mt-4 h-10 w-32 rounded-2xl bg-[rgba(148,163,184,0.12)]" />
              <div className="mt-6 h-20 rounded-2xl bg-[rgba(148,163,184,0.08)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}