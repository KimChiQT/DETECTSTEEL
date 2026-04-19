import React from 'react'

function IconCamera() {
  return (
    <svg className="h-7 w-7 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h4l2-2h4l2 2h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function IconAhp() {
  return (
    <svg className="h-7 w-7 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 18h4v-7H3zM10 18h4V5h-4zM17 18h4v-4h-4z" strokeLinejoin="round" />
    </svg>
  )
}

function IconReport() {
  return (
    <svg className="h-7 w-7 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M14 3v4h4M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  )
}

function MockupDetect() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      <div className="absolute left-[12%] top-[15%] h-[40%] w-[35%] rounded border-2 border-red-400/80">
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-red-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white">Vết rạn 87%</span>
      </div>
      <div className="absolute right-[12%] top-[35%] h-[30%] w-[28%] rounded border-2 border-amber-400/80">
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white">Vảy cán 72%</span>
      </div>
      <div className="absolute bottom-2 right-2 rounded bg-emerald-500/90 px-2 py-0.5 text-[8px] font-bold text-white">2 lỗi phát hiện</div>
    </div>
  )
}

function MockupAhp() {
  return (
    <div className="h-full w-full rounded-lg bg-white p-3">
      <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">AHP Analysis</div>
      {[['Chi phí sửa chữa', 60, 'bg-blue-500'], ['Thời gian xử lý', 80, 'bg-indigo-500'], ['Diện tích lỗi', 45, 'bg-violet-500']].map(([l, w, c]) => (
        <div key={l} className="mb-2 flex items-center gap-2">
          <span className="w-24 shrink-0 text-[8px] text-slate-500">{l}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${c}`} style={{ width: `${w}%` }} />
          </div>
          <span className="text-[8px] font-semibold text-slate-600">{w}%</span>
        </div>
      ))}
      <div className="mt-2 rounded-lg bg-[#1E3A8A] py-1 text-center text-[9px] font-black uppercase tracking-wider text-white">
        → Nên Sửa Chữa
      </div>
    </div>
  )
}

function MockupReport() {
  return (
    <div className="h-full w-full rounded-lg bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-rose-500" />
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Báo cáo PDF</div>
      </div>
      <div className="mb-1.5 h-1.5 w-3/4 rounded-full bg-slate-200" />
      <div className="mb-1.5 h-1.5 w-1/2 rounded-full bg-slate-200" />
      <div className="mb-1.5 h-1.5 w-5/6 rounded-full bg-slate-200" />
      <div className="mt-2 flex gap-1.5">
        <div className="h-8 flex-1 rounded bg-blue-50 border border-blue-100" />
        <div className="h-8 flex-1 rounded bg-rose-50 border border-rose-100" />
        <div className="h-8 flex-1 rounded bg-emerald-50 border border-emerald-100" />
      </div>
    </div>
  )
}

const items = [
  {
    icon: <IconCamera />,
    color: 'bg-sky-50 ring-sky-200',
    title: 'Nhận diện lỗi thép thời gian thực',
    desc: 'Sử dụng mô hình YOLOv8 tiên tiến được tối ưu cho bề mặt thép, phát hiện 6 loại khuyết tật với độ chính xác cao.',
    mockup: <MockupDetect />,
  },
  {
    icon: <IconAhp />,
    color: 'bg-indigo-50 ring-indigo-200',
    title: 'Hỗ trợ quyết định AHP thông minh',
    desc: 'Đưa ra gợi ý Sửa chữa hay Loại bỏ dựa trên phân tích đa tiêu chí: chi phí, thời gian, mức độ nghiêm trọng.',
    mockup: <MockupAhp />,
  },
  {
    icon: <IconReport />,
    color: 'bg-rose-50 ring-rose-200',
    title: 'Báo cáo trực quan chi tiết',
    desc: 'Xuất kết quả phân tích đầy đủ dạng PDF chuyên nghiệp, bao gồm hình ảnh, thống kê và khuyến nghị.',
    mockup: <MockupReport />,
  },
]

export default function Features() {
  return (
    <section id="features-section" className="bg-white px-6 py-20 md:px-10 lg:px-16">
      {/* Section header */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#1E3A8A]">
          Tính năng nổi bật
        </div>
        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
          Công nghệ AI hiện đại<br className="hidden sm:block" /> cho ngành thép
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-500">
          Hệ thống tích hợp đầy đủ từ phát hiện lỗi đến hỗ trợ quyết định và báo cáo chuyên nghiệp.
        </p>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Mockup preview */}
            <div className="h-44 overflow-hidden border-b border-slate-100 bg-slate-50 p-3">
              {it.mockup}
            </div>

            {/* Text content */}
            <div className="flex flex-1 flex-col p-6">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${it.color}`}>
                {it.icon}
              </div>
              <h3 className="text-base font-bold leading-snug text-slate-900 md:text-lg">{it.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
