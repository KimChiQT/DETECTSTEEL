import React from 'react'

export default function Hero({ onDemo }) {
  return (
    <section
      id="home-hero"
      className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-background.png')" }}
        aria-hidden
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-700/30" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/60" aria-hidden />

      {/* Scan line animation */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="ds-scanline"><div className="bar" /></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            AI-Powered Steel Inspection
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-balance text-4xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
          DETECTSTEEL
        </h1>
        <h2 className="mt-2 text-balance text-xl font-bold uppercase leading-snug tracking-wide text-cyan-300 drop-shadow sm:text-2xl md:text-3xl">
          Giải Pháp AI Tối Ưu<br className="hidden sm:block" /> Kiểm Định Lỗi Thép
        </h2>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-300 md:text-lg">
          Nhận diện khuyết tật bề mặt thời gian thực, hỗ trợ quyết định thông minh bằng AHP, nâng cao chất lượng sản xuất.
        </p>

        {/* Stats row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[
            { value: '6', label: 'Loại lỗi thép' },
            { value: '95%+', label: 'Độ chính xác' },
            { value: 'Real-time', label: 'Phân tích' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-3xl font-black text-white md:text-4xl">{s.value}</span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onDemo}
            className="rounded-xl bg-[#1E3A8A] px-10 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all duration-200 hover:bg-[#2563EB] hover:scale-105 hover:shadow-blue-500/30 active:scale-100 md:px-12 md:py-4 md:text-base"
          >
            Bắt Đầu Ngay
          </button>
          <a
            href="#features-section"
            className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:scale-105 md:px-10 md:py-4 md:text-base"
          >
            Tìm hiểu thêm ↓
          </a>
        </div>
      </div>

      {/* Decorative bounding boxes — AI detection mockup */}
      <div className="pointer-events-none absolute left-[6%] top-[22%] hidden h-16 w-24 rounded border-2 border-red-400/70 ds-detect-box md:block" aria-hidden>
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-red-500/80 px-2 py-0.5 text-[9px] font-bold text-white">Vết rạn 87%</span>
      </div>
      <div className="pointer-events-none absolute left-[14%] top-[50%] hidden h-12 w-18 rounded border-2 border-amber-400/70 ds-detect-box md:block" aria-hidden>
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-amber-500/80 px-2 py-0.5 text-[9px] font-bold text-white">Vảy cán 72%</span>
      </div>
      <div className="pointer-events-none absolute right-[8%] top-[30%] hidden h-14 w-20 rounded border-2 border-cyan-400/70 ds-detect-box md:block" aria-hidden>
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-cyan-500/80 px-2 py-0.5 text-[9px] font-bold text-white">Đốm bề mặt 91%</span>
      </div>
      <div className="pointer-events-none absolute right-[15%] top-[58%] hidden h-10 w-16 rounded border-2 border-blue-400/70 ds-detect-box md:block" aria-hidden>
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-blue-500/80 px-2 py-0.5 text-[9px] font-bold text-white">Vết lõm 65%</span>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400" aria-hidden>
        <span className="text-[10px] uppercase tracking-widest">Cuộn xuống</span>
        <svg className="h-5 w-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
