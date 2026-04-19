import React from 'react'

export default function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{children}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
    </div>
  )
}
