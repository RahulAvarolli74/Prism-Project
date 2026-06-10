import React from 'react'

export default function GlassCard({ children, className = '', contentClassName = '', as: Component = 'section' }) {
  return (
    <Component className={`glass-panel rounded-[28px] ${className}`}>
      <div className={contentClassName}>{children}</div>
    </Component>
  )
}