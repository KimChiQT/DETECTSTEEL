import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-transform duration-300 hover:shadow-lg ${className}`}>
      {children}
    </div>
  )
}
