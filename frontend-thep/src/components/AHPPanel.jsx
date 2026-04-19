import React, { useState } from 'react'

function WeightSlider({ label, value, onChange }) {
  const [showTip, setShowTip] = useState(false)

  const tipText = {
    'CHI PHÍ': `Thang đo 1-9: ${value}\n(Sửa rẻ hơn Hơi Quan Trọng hơn Bỏ)`,
    'THỜI GIAN': `Thang đo 1-9: ${value}`,
    'DIỆN TÍCH': `Thang đo 1-9: ${value}`,
  }

  return (
    <div className="relative">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600">{label}</label>
        <span className="text-sm font-bold text-slate-800">{value}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="1"
          max="9"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1E3A8A]"
        />
        {showTip && (
          <div className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-pre rounded-lg bg-slate-800 px-3 py-1.5 text-[10px] leading-snug text-white shadow-lg">
            {tipText[label] || `Thang đo 1-9: ${value}`}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AHPPanel({
  costWeight, timeWeight, areaWeight,
  setCostWeight, setTimeWeight, setAreaWeight,
  onCompute, computing,
  onAnalyze, loading, canAnalyze, canAHP,
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold text-slate-800">Hệ hỗ trợ quyết định (AHP)</h4>

      <div className="space-y-4">
        <WeightSlider label="CHI PHÍ"    value={costWeight}  onChange={setCostWeight} />
        <WeightSlider label="THỜI GIAN"  value={timeWeight}  onChange={setTimeWeight} />
        <WeightSlider label="DIỆN TÍCH"  value={areaWeight}  onChange={setAreaWeight} />
      </div>

      <div className="mt-5 space-y-2">
        {/* Analyze button – secondary style */}
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E3A8A] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1E3A8A] transition hover:bg-[#1E3A8A]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Đang phân tích...
            </>
          ) : (
            'BẮT ĐẦU PHÂN TÍCH'
          )}
        </button>

        {/* AHP compute button – primary style */}
        <button
          onClick={onCompute}
          disabled={computing || !canAHP}
          title={!canAHP ? 'Hãy phân tích ảnh trước' : ''}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {computing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Đang tính...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              TÍNH TƯ VẤN
            </>
          )}
        </button>
      </div>
    </div>
  )
}
