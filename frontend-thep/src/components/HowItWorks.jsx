import React from 'react'

const steps = [
  { icon: '📷', title: 'Tải lên Lô Ảnh Thép', desc: 'Tải lên lô ảnh thép, hỗ trợ nhiều ảnh cùng lúc.' },
  { icon: '🤖', title: 'AI Phân Tích Lỗi', desc: 'AI phát hiện và phân loại lỗi bề mặt thép tự động.' },
  { icon: '💡', title: 'Nhận Lời Khuyên AHP', desc: 'Đưa ra gợi ý Sửa chữa hay Loại bỏ dựa trên đa tiêu chí.' },
  { icon: '📄', title: 'Tạo và Tải Báo Cáo', desc: 'Tạo và xuất kết quả chi tiết dạng PDF chuyên nghiệp.' },
]

export default function HowItWorks() {
  return (
    <section className="shrink-0 bg-slate-50 px-4 py-4 md:px-6">
      <h2 className="mb-3 text-center text-sm font-extrabold text-slate-900 md:text-base">
        How It Works
      </h2>
      <div className="mx-auto flex max-w-5xl items-start justify-center gap-1 md:gap-0">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex w-[22%] flex-col items-center text-center md:flex-1">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-slate-200 md:h-12 md:w-12">
                {s.icon}
              </div>
              <p className="text-[10px] font-bold leading-snug text-slate-800 md:text-xs">{s.title}</p>
              <p className="mt-0.5 hidden text-[9px] leading-snug text-slate-500 md:block md:text-[10px]">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="shrink-0 self-start pt-5 text-slate-300 md:px-1">
                <svg className="h-4 w-6 md:h-5 md:w-8" viewBox="0 0 40 24" fill="none">
                  <path d="M4 12h28M28 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}
