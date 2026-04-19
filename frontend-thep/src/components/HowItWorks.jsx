import React from 'react'

const steps = [
  {
    icon: '📷',
    step: '01',
    title: 'Tải lên Lô Ảnh Thép',
    desc: 'Tải lên một hoặc nhiều ảnh thép cùng lúc. Hỗ trợ JPG, PNG với kích thước linh hoạt.',
  },
  {
    icon: '🤖',
    step: '02',
    title: 'AI Phân Tích Lỗi',
    desc: 'Mô hình YOLOv8 tự động phát hiện và phân loại 6 loại khuyết tật bề mặt thép.',
  },
  {
    icon: '💡',
    step: '03',
    title: 'Nhận Lời Khuyên AHP',
    desc: 'Hệ thống AHP đưa ra gợi ý Sửa chữa hay Loại bỏ dựa trên đa tiêu chí có trọng số.',
  },
  {
    icon: '📄',
    step: '04',
    title: 'Tạo và Tải Báo Cáo',
    desc: 'Xuất kết quả phân tích đầy đủ dạng PDF chuyên nghiệp chỉ với một cú nhấp.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-slate-50 px-6 py-20 md:px-10 lg:px-16">
      {/* Section header */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-600">
          Quy trình
        </div>
        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
          Cách hoạt động
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-500">
          Chỉ 4 bước đơn giản để có kết quả kiểm định chuyên nghiệp.
        </p>
      </div>

      {/* Steps */}
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {steps.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+2.5rem)] top-8 hidden h-0.5 w-[calc(100%-5rem)] bg-slate-200 lg:block" aria-hidden />
              )}

              {/* Icon circle */}
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md ring-1 ring-slate-200">
                {s.icon}
                {/* Step number badge */}
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-black text-white shadow">
                  {s.step}
                </span>
              </div>

              <h3 className="text-sm font-bold leading-snug text-slate-900 md:text-base">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 md:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
