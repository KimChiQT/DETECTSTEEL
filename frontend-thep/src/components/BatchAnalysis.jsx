import React, { useCallback, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')

/* ── helpers ─────────────────────────────────────────────── */
function fileToObj(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    file,
    url: URL.createObjectURL(file),
    status: 'pending', // pending | analyzing | done | error
    result: null,
  }
}

/* ── Bounding-box overlay ────────────────────────────────── */
function BBoxOverlay({ faults = [] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {faults.map((f) => {
        const isMajor = f.major
        const border = isMajor ? '#ef4444' : '#eab308'
        const bg = isMajor ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)'
        const chip = isMajor ? '#ef4444' : '#ca8a04'
        const stableKey = `${f.id || f.name || f.label}-${f.bbox?.x || 0}-${f.bbox?.y || 0}`
        return (
          <div
            key={stableKey}
            className="absolute"
            style={{ left: `${f.bbox?.x ?? f.x}%`, top: `${f.bbox?.y ?? f.y}%`, width: `${f.bbox?.w ?? f.w}%`, height: `${f.bbox?.h ?? f.h}%` }}
          >
            <div className="absolute inset-0 rounded-sm" style={{ border: `2px solid ${border}`, background: bg }} />
            <div
              className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
              style={{ background: chip }}
            >
              {f.name || f.label} ({Math.round((f.confidence ?? 0) * 100)}%)
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Defect table ────────────────────────────────────────── */
function DefectTable({ faults = [], totalCost = 0 }) {
  if (!faults.length)
    return <p className="py-4 text-center text-sm text-slate-400">Không phát hiện lỗi.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th className="py-2 text-left">Loại lỗi</th>
          <th className="py-2 text-center">% Diện Tích Lỗi</th>
          <th className="py-2 text-right">Chi phí dự tính</th>
        </tr>
      </thead>
      <tbody>
        {faults.map((f) => {
          const faultKey = `${f.id || f.name}-${f.confidence || 0}`
          return (
            <tr key={faultKey} className="border-b border-slate-100 last:border-0">
              <td className="py-2 font-medium text-slate-700">{f.name || f.label}</td>
              <td className="py-2 text-center text-slate-600">{Number(f.confidence).toFixed(2)}</td>
              <td className="py-2 text-right font-semibold text-slate-800">{fmt(f.cost)}</td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-200">
          <td colSpan={2} className="py-2 text-right text-xs font-semibold text-slate-500">Tổng</td>
          <td className="py-2 text-right font-black text-slate-900">{fmt(totalCost)} VND</td>
        </tr>
      </tfoot>
    </table>
  )
}

/* ── Batch summary panel ─────────────────────────────────── */
function SummaryPanel({ images, selectedImg, onGoAHP }) {
  const done = images.filter((i) => i.status === 'done')
  const totalCost = done.reduce((s, i) => s + (i.result?.total_estimated_cost ?? 0), 0)
  const totalFaults = done.reduce((s, i) => s + (i.result?.fault_count ?? 0), 0)
  const majorImg = done.reduce(
    (best, i) => {
      const w = i.result?.warning_count ?? 0
      return w > (best?.result?.warning_count ?? -1) ? i : best
    },
    null
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
          TÓM TẮT LÔ &amp; GỢI Ý
        </p>

        {/* ĐỌC KẾT QUẢ LÔ */}
        <div className="mb-5 flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">🤖</div>
          <div>
            <p className="text-sm font-bold text-slate-800">ĐỌC KẾT QUẢ LÔ</p>
            {done.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">Chưa có ảnh nào được phân tích.</p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Lô ảnh gồm <strong>{images.length}</strong> hình ảnh. Đã phát hiện{' '}
                <strong>{totalFaults}</strong> lỗi
                {majorImg && majorImg.result?.warning_count > 0
                  ? ` nghiêm trọng trên ảnh ${majorImg.name}.`
                  : '.'}
                {totalCost > 0 && (
                  <> Tổng chi phí dự tính cho lô: <strong>{fmt(totalCost)} VND</strong>.</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* GỢI Ý SƠ BỘ */}
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">⚖️</div>
          <div>
            <p className="text-sm font-bold text-slate-800">GỢI Ý SƠ BỘ</p>
            {majorImg && majorImg.result?.warning_count > 0 ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Dựa trên kết quả phân tích AI, ảnh <strong>{majorImg.name}</strong> có lỗi nghiêm
                trọng. Cần đánh giá kỹ lưỡng để đưa ra quyết định Sửa chữa hay Loại bỏ tối ưu.
              </p>
            ) : done.length > 0 ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Không phát hiện lỗi nghiêm trọng. Lô ảnh có thể tiếp tục sản xuất.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Phân tích lô để nhận gợi ý.</p>
            )}
          </div>
        </div>
      </div>

      {/* CTA → AHP */}
      <button
        onClick={onGoAHP}
        disabled={done.length === 0}
        className="flex w-full flex-col items-center justify-center gap-1 rounded-xl bg-[#1E3A8A] px-4 py-4 text-center text-white shadow-md transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
        <span className="text-xs font-black uppercase tracking-wide">CHUYỂN SANG PHÂN TÍCH ĐÁNH GIÁ</span>
        <span className="text-[10px] font-semibold opacity-80">AHP (Analytic Hierarchy Process)</span>
      </button>

      {/* Stats row */}
      {done.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-[10px] text-slate-400">Lô ảnh</p>
              <p className="text-lg font-black text-slate-900">{images.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Đã phân tích</p>
              <p className="text-lg font-black text-[#1E3A8A]">{done.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Tổng lỗi</p>
              <p className="text-lg font-black text-slate-900">{totalFaults}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Chi phí ước tính</p>
              <p className="text-sm font-black text-rose-600">{fmt(totalCost)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── How It Works strip ──────────────────────────────────── */
function HowItWorksStrip() {
  const steps = [
    { icon: '📷', title: 'Tải lên Lô Ảnh Thép', desc: 'Tải lên lô ảnh thép, hỗ trợ nhiều ảnh cùng lúc.' },
    { icon: '🤖', title: 'AI Phân Tích Lỗi', desc: 'AI phát hiện và phân loại lỗi bề mặt thép tự động.' },
    { icon: '💡', title: 'Nhận Lời Khuyên AHP', desc: 'Đưa ra gợi ý Sửa chữa hay Loại bỏ dựa trên đa tiêu chí.' },
    { icon: '📄', title: 'Tạo và Tải Báo Cáo', desc: 'Tạo và xuất kết quả chi tiết dạng PDF chuyên nghiệp.' },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex min-w-[100px] flex-1 flex-col items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl shadow-sm">{s.icon}</div>
              <p className="text-xs font-semibold text-slate-800">{s.title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{s.desc}</p>
            </div>
            {i < steps.length - 1 && <div className="mt-5 hidden text-slate-300 md:block text-lg">→</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/* BatchAnalysis page                                         */
/* ══════════════════════════════════════════════════════════ */
export default function BatchAnalysis({ onGoAHP }) {
  const [images, setImages] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [apiError, setApiError] = useState('')
  const inputRef = useRef()

  const selectedImg = images.find((i) => i.id === selectedId) ?? null

  /* ── File handling ── */
  const addFiles = useCallback((fileList) => {
    const arr = Array.from(fileList).filter((f) => /image\/(png|jpe?g|bmp)/i.test(f.type))
    if (!arr.length) return
    const mapped = arr.map(fileToObj)
    setImages((prev) => {
      const next = [...prev, ...mapped]
      return next
    })
    setSelectedId((cur) => cur ?? mapped[0].id)
  }, [])

  const onDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }
  const onFileInput = (e) => addFiles(e.target.files)

  const removeImage = (id) => {
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== id)
      setSelectedId((cur) => (cur === id ? next[0]?.id ?? null : cur))
      return next
    })
  }

  /* ── Analyze all images via /analyze-batch ── */
  const handleAnalyzeAll = async () => {
    const pending = images.filter((i) => i.status === 'pending')
    if (!pending.length) return
    setApiError('')
    setAnalyzing(true)

    // Mark all pending as analyzing
    setImages((prev) =>
      prev.map((i) => i.status === 'pending' ? { ...i, status: 'analyzing' } : i)
    )
    // Select first pending
    setSelectedId(pending[0].id)

    try {
      const fd = new FormData()
      pending.forEach((img) => fd.append('files', img.file))

      const res = await fetch(`${API_BASE}/analyze-batch`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Lỗi phân tích lô')

      const results = data.results || []

      // Map results back to images by index (same order as pending)
      setImages((prev) =>
        prev.map((img) => {
          const pendingIdx = pending.findIndex((p) => p.id === img.id)
          if (pendingIdx === -1) return img
          const result = results[pendingIdx]
          if (!result) return { ...img, status: 'error', errorMsg: 'Không có kết quả' }
          if (result.error) return { ...img, status: 'error', errorMsg: result.error }
          return {
            ...img,
            status: 'done',
            result,
            image_base64: result.image_base64,
          }
        })
      )

      // Auto-select first done image
      const firstDone = pending[0]
      if (firstDone) setSelectedId(firstDone.id)

    } catch (err) {
      // Mark all analyzing as error
      setImages((prev) =>
        prev.map((i) => i.status === 'analyzing' ? { ...i, status: 'error', errorMsg: err.message } : i)
      )
      setApiError(`Phân tích lô thất bại: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  /* ── Persist batch to localStorage for Stats/History ── */
  const persistBatch = () => {
    const done = images.filter((i) => i.status === 'done')
    if (!done.length) return
    try {
      const key = 'detectsteel_history'
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      done.forEach((img) => {
        list.unshift({
          id: `${img.result?.id ?? Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ts: Date.now(),
          imageId: img.name,
          imageData: img.image_base64,
          defects: (img.result?.faults ?? []).map((f) => ({
            id: f.id, label: f.name, confidence: f.confidence, cost: f.cost, major: f.major,
          })),
          fileCount: 1,
          repairScore: img.result?.repairScore ?? 0,
          replaceScore: img.result?.replaceScore ?? 0,
          decision: img.result?.decision ?? 'repair',
        })
      })
      localStorage.setItem(key, JSON.stringify(list))
    } catch (e) { console.error(e) }
  }

  const handleGoAHP = () => {
    persistBatch()
    if (onGoAHP) onGoAHP()
  }

  const pendingCount = images.filter((i) => i.status === 'pending').length
  const doneCount = images.filter((i) => i.status === 'done').length

  return (
    <div id="batch-root" className="min-h-screen bg-[#F6F8FC] px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* Error banner */}
        {apiError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            {apiError}
            <button onClick={() => setApiError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Main 3-col grid ── */}
        <div className="grid grid-cols-12 gap-4">

          {/* LEFT – file list */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                DANH SÁCH TỆP LÔ{' '}
                {images.length > 0 && (
                  <span className="text-[#1E3A8A]">
                    #{String(images.length).padStart(3, '0')}
                  </span>
                )}
              </h3>

              {/* Thumbnail grid */}
              {images.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {images.map((img) => {
                    const active = selectedId === img.id
                    const statusRing =
                      img.status === 'done' ? 'border-emerald-400 ring-emerald-200' :
                        img.status === 'analyzing' ? 'border-blue-400 ring-blue-200 animate-pulse' :
                          img.status === 'error' ? 'border-red-400 ring-red-200' :
                            active ? 'border-[#1E3A8A] ring-[#1E3A8A]/20' : 'border-slate-200'
                    return (
                      <div
                        key={img.id}
                        onClick={() => setSelectedId(img.id)}
                        className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 ring-2 ring-transparent transition-all ${statusRing}`}
                      >
                        <img
                          src={img.image_base64 || img.url}
                          alt={img.name}
                          className="h-20 w-full object-cover"
                        />
                        {/* Status badge */}
                        <div className="absolute right-1 top-1">
                          {img.status === 'done' && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">✓</span>
                          )}
                          {img.status === 'analyzing' && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                              <svg className="h-2.5 w-2.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                            </span>
                          )}
                          {img.status === 'error' && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">!</span>
                          )}
                        </div>
                        {/* Remove */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                          className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] text-slate-500 opacity-0 shadow transition group-hover:opacity-100 hover:text-red-500"
                        >×</button>
                        <p className="truncate bg-white px-1.5 py-0.5 text-[10px] text-slate-600">{img.name}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[#1E3A8A]/50 hover:bg-blue-50/30"
              >
                <svg className="h-9 w-9 text-[#1E3A8A]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Kéo thả/Tải ảnh</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Hỗ trợ PNG, BMP, JPG — tải nhiều ảnh cùng lúc.</p>
                </div>
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/bmp" onChange={onFileInput} className="hidden" multiple />
              </div>

              {/* Analyze button */}
              {images.length > 0 && (
                <button
                  onClick={handleAnalyzeAll}
                  disabled={analyzing || pendingCount === 0}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Đang phân tích...
                    </>
                  ) : (
                    `Phân tích lô (${pendingCount} ảnh)`
                  )}
                </button>
              )}

              {/* Footer count */}
              {images.length > 0 && (
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Lô ảnh: {images.length} | Đã phân tích: {doneCount}
                </p>
              )}
            </div>
          </aside>

          {/* CENTER – viewer + defect table */}
          <main className="col-span-12 lg:col-span-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* Image viewer */}
              {selectedImg ? (
                <div
                  className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-black"
                  style={{ height: 380 }}
                >
                  <img
                    src={selectedImg.image_base64 || selectedImg.url}
                    alt={selectedImg.name}
                    className="h-full w-full object-contain"
                  />
                  {selectedImg.status === 'done' && selectedImg.result?.faults && (
                    <BBoxOverlay faults={selectedImg.result.faults} />
                  )}
                  {selectedImg.status === 'analyzing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/50">
                      <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <p className="text-sm font-semibold text-white">AI đang phân tích...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-[380px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  Tải ảnh lên để bắt đầu phân tích
                </div>
              )}

              {/* Defect table */}
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-bold text-slate-900">
                  CHI TIẾT LỖI PHÂN TÍCH:{' '}
                  <span className="font-normal text-slate-500">{selectedImg?.name ?? '---'}</span>
                </h4>
                {selectedImg?.status === 'done' ? (
                  <DefectTable
                    faults={selectedImg.result?.faults ?? []}
                    totalCost={selectedImg.result?.total_estimated_cost ?? 0}
                  />
                ) : selectedImg?.status === 'error' ? (
                  <p className="py-4 text-center text-sm text-red-500">{selectedImg.errorMsg}</p>
                ) : (
                  <p className="py-4 text-center text-sm text-slate-400">
                    {selectedImg ? 'Nhấn "Phân tích lô" để bắt đầu.' : 'Chưa chọn ảnh.'}
                  </p>
                )}
              </div>
            </div>
          </main>

          {/* RIGHT – summary + CTA */}
          <aside className="col-span-12 lg:col-span-3">
            <SummaryPanel images={images} selectedImg={selectedImg} onGoAHP={handleGoAHP} />
          </aside>
        </div>

        {/* How It Works */}
        <HowItWorksStrip />

        {/* Footer */}
        <p className="pb-2 text-center text-[11px] text-slate-400">
          Hệ thống DetectSteel AI © 2023 &mdash; Phát triển bởi Đội ngũ R&amp;D · Giải pháp kiểm định chất lượng thép thông minh.
        </p>
      </div>
    </div>
  )
}
