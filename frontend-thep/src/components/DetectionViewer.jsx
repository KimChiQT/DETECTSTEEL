import React, { useRef, useState } from 'react'

function Box({ b }) {
  const isMajor = b.major
  const borderColor = isMajor ? '#ef4444' : '#22c55e'
  const bgColor = isMajor ? 'rgba(239,68,68,0.10)' : 'rgba(34,197,94,0.10)'
  const labelBg = isMajor ? '#dc2626' : '#16a34a'

  return (
    <div
      className="absolute"
      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
    >
      {/* Box border */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{ border: `2px solid ${borderColor}`, background: bgColor }}
      />
      {/* Label chip — hiển thị bên trong góc trên-trái nếu không đủ chỗ phía trên */}
      <div
        className="absolute left-0 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-bold text-white"
        style={{
          background: labelBg,
          top: b.y > 8 ? '-22px' : '2px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.55)',
          letterSpacing: '0.01em',
          lineHeight: '1.5',
        }}
      >
        {b.label} <span style={{ opacity: 0.9 }}>({Number(b.conf || 0).toFixed(1)}%)</span>
      </div>
    </div>
  )
}

export default function DetectionViewer({ image, defects = [], loading = false }) {
  if (!image) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Chưa chọn ảnh
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-black" style={{ height: '380px' }}>
      <img
        src={image.image_base64 || image.url}
        alt={image.name}
        className="h-full w-full object-contain"
      />

      {/* Bounding boxes */}
      <div className="absolute inset-0">
        {defects.map((d, i) => (
          <Box key={i} b={d} />
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/50">
          <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm font-semibold text-white">AI đang phân tích...</p>
        </div>
      )}
    </div>
  )
}
