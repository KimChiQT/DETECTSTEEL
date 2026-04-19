import React from 'react'

function IconCamera() {
  return (
    <svg className="h-6 w-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h4l2-2h4l2 2h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function IconAhp() {
  return (
    <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3L4 9v12h5v-7h6v7h5V9z" strokeLinejoin="round" />
    </svg>
  )
}

function IconReport() {
  return (
    <svg className="h-6 w-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M14 3v4h4M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  )
}

/* Compact mockup previews */
function MockupDetect() {
  return (
    <div className="relative h-full w-full bg-slate-800">
      <div className="absolute left-[15%] top-[18%] h-[38%] w-[32%] rounded border-2 border-red-400/80" />
      <div className="absolute left-[52%] top-[30%] h-[28%] w-[26%] rounded border-2 border-yellow-400/80" />
      <div className="absolute bottom-1.5 right-1.5 rounded bg-emerald-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white">Chi tiết báo cáo phân tích</div>
    </div>
  )
}

function MockupAhp() {
  return (
    <div className="h-full w-full bg-white p-2">
      <div className="mb-1 text-[7px] font-semibold text-slate-400">AHP Panel</div>
      {['Chi phí', 'Thời gian', 'Diện tích'].map((l, i) => (
        <div key={i} className="mb-1 flex items-center gap-1">
          <span className="w-9 text-[7px] text-slate-500">{l}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${40 + i * 20}%` }} />
          </div>
        </div>
      ))}
      <div className="mt-1 rounded bg-[#1E3A8A] py-0.5 text-center text-[7px] font-bold text-white">NÊN SỬA CHỮA</div>
    </div>
  )
}

function MockupReport() {
  return (
    <div className="h-full w-full bg-white p-2">
      <div className="mb-1 text-[7px] font-semibold text-slate-400">Báo cáo PDF</div>
      <div className="mb-1 h-1 w-3/4 rounded bg-slate-200" />
      <div className="mb-1 h-1 w-1/2 rounded bg-slate-200" />
      <div className="flex gap-1">
        <div className="h-6 flex-1 rounded bg-slate-100" />
        <div className="h-6 flex-1 rounded bg-rose-50" />
      </div>
    </div>
  )
}

const items = [
  { icon: <IconCamera />, title: 'Nhận diện lỗi thép thời gian thực', desc: 'Sử dụng mô hình YOLOv8 tiên tiến được tối ưu cho bề mặt thép.', mockup: <MockupDetect /> },
  { icon: <IconAhp />, title: 'Hỗ trợ quyết định AHP thông minh', desc: 'Đưa ra gợi ý Sửa chữa hay Loại bỏ dựa trên đa tiêu chí.', mockup: <MockupAhp /> },
  { icon: <IconReport />, title: 'Báo cáo trực quan chi tiết', desc: 'Xuất kết quả chi tiết dạng PDF chuyên nghiệp.', mockup: <MockupReport /> },
]

export default function Features() {
  return (
    <section id="features-section" className="shrink-0 bg-white px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-3 md:gap-4">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-2.5 p-3 pb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200">
                {it.icon}
              </div>
              <div>
                <h3 className="text-xs font-bold leading-snug text-slate-900 md:text-[13px]">{it.title}</h3>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-500 md:text-[11px]">{it.desc}</p>
              </div>
            </div>
            <div className="mx-3 mb-3 h-20 overflow-hidden rounded-lg border border-slate-200">
              {it.mockup}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
