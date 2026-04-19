import React from 'react'

export default function Hero({ onDemo }) {
  return (
    <section
      id="home-hero"
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-background.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-800/55 to-slate-700/30" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50" aria-hidden />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-balance text-2xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-[2.6rem]">
          DETECTSTEEL: GIẢI PHÁP AI<br className="hidden sm:block" />
          TỐI ƯU KIỂM ĐỊNH LỖI THÉP
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-slate-200 md:text-base">
          Nhận diện khuyết tật bề mặt thời gian thực, hỗ trợ quyết định thông minh bằng AHP, nâng cao chất lượng sản xuất.
        </p>
        <div className="mt-5">
          <button
            onClick={onDemo}
            className="rounded-xl bg-[#1E3A8A] px-10 py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all duration-200 hover:bg-[#2563EB] hover:scale-105 active:scale-100 md:px-12 md:py-3.5"
          >
            BẮT ĐẦU NGAY
          </button>
        </div>
      </div>

      {/* Decorative bounding boxes */}
      <div className="pointer-events-none absolute left-[7%] top-[20%] hidden h-14 w-20 rounded border-2 border-cyan-400/70 md:block" aria-hidden>
        <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-cyan-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white">YOLOv5 0.7</span>
      </div>
      <div className="pointer-events-none absolute left-[13%] top-[45%] hidden h-10 w-16 rounded border-2 border-amber-400/70 md:block" aria-hidden>
        <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-amber-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white">YOLOv8 0.1</span>
      </div>
      <div className="pointer-events-none absolute left-[20%] top-[32%] hidden h-9 w-14 rounded border-2 border-blue-400/70 md:block" aria-hidden>
        <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-blue-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white">YOLOv6 0.2</span>
      </div>
    </section>
  )
}
