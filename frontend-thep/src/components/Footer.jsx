import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A8A] text-[11px] font-black text-white shadow-sm">
            ST
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-[#1E3A8A]">DETECTSTEEL</div>
            <div className="text-[10px] font-medium text-slate-400">AI Steel Inspection v1.0</div>
          </div>
        </div>

        {/* Center text */}
        <p className="text-xs text-slate-400">
          Giải pháp kiểm định chất lượng thép thông minh — Phát triển bởi Đội ngũ R&amp;D
        </p>

        {/* Copyright */}
        <p className="text-xs font-semibold text-slate-500">
          © 2025 DetectSteel AI
        </p>
      </div>
    </footer>
  )
}
