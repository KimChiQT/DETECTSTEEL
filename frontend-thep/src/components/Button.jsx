import React from 'react'

export default function Button({ children, onClick, className = '', variant = 'primary', disabled = false, type = 'button' }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300'
  const styles = variant === 'primary'
    ? 'bg-[#1E3A8A] text-white px-5 py-3 shadow hover:scale-105 disabled:opacity-60 disabled:hover:scale-100'
    : 'bg-white border px-4 py-2 text-slate-700'

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}
