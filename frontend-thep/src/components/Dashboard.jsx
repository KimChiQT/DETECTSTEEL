import React, { useMemo, useState } from 'react'
import ImageUploader from './ImageUploader'
import DetectionViewer from './DetectionViewer'
import AHPPanel from './AHPPanel'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')

/* ─────────────────────────────────────────────────────────── */
/* Defect table                                                */
/* ─────────────────────────────────────────────────────────── */
const DefectTable = ({ faults = [] }) => {
  if (faults.length === 0)
    return <p className="py-6 text-center text-sm text-slate-400">Chưa có kết quả phân tích.</p>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th className="py-2 text-left">Loại lỗi</th>
          <th className="py-2 text-center">Độ tin cậy</th>
          <th className="py-2 text-right">Chi phí dự tính (VND)</th>
        </tr>
      </thead>
      <tbody>
        {faults.map((f, idx) => (
          <tr key={`${f.id}-${idx}`} className="border-b border-slate-100 last:border-0">
            <td className="py-2 font-medium text-slate-700">{f.label}</td>
            <td className="py-2 text-center text-slate-600">{(Number(f.confidence) * 100).toFixed(1)}%</td>
            <td className="py-2 text-right font-semibold text-slate-800">{fmt(f.cost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Status card                                                 */
/* ─────────────────────────────────────────────────────────── */
const StatusCard = ({ summary }) => {
  const hasWarning = summary.warning_count > 0
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        TÌNH TRẠNG HIỆN TẠI
      </p>

      {hasWarning ? (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
            !
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {summary.warning_count} vùng bất thường (AI cảnh báo)
            </p>
            <p className="text-xs text-slate-500">{summary.warning_count} vùng có lỗi</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
            ✓
          </span>
          <p className="text-sm font-semibold text-slate-800">Không phát hiện lỗi</p>
        </div>
      )}

      {/* Extra stats from API */}
      {summary.fault_count > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Tổng lỗi</p>
            <p className="text-base font-black text-slate-800">{summary.fault_count}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Độ tin cậy TB</p>
            <p className="text-base font-black text-slate-800">{summary.avg_conf?.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Xử lý</p>
            <p className="text-base font-black text-slate-800">{summary.process_time}s</p>
          </div>
        </div>
      )}

      {summary.total_estimated_cost > 0 && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[10px] text-slate-400">Tổng chi phí ước tính</p>
          <p className="text-sm font-bold text-[#1E3A8A]">{fmt(summary.total_estimated_cost)} VND</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Result / Advice card                                        */
/* ─────────────────────────────────────────────────────────── */
const ResultCard = ({ repairScore, replaceScore, decision }) => {
  if (!decision) return null
  const isRepair = decision === 'repair'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs font-semibold text-slate-500">Lời khuyên:</p>
      <p
        className={`text-xl font-black tracking-tight ${
          isRepair ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {isRepair ? 'NÊN SỬA CHỮA' : 'NÊN LOẠI BỎ'}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Score Sửa: {repairScore.toFixed(3)} — Score Bỏ: {replaceScore.toFixed(3)}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* How It Works strip                                          */
/* ─────────────────────────────────────────────────────────── */
const HowItWorksStrip = () => {
  const steps = [
    { icon: '📷', title: 'Tải lên Lô Ảnh Thép', desc: 'Tải lên lô ảnh thép, hỗ trợ nhiều ảnh cùng lúc.' },
    { icon: '🤖', title: 'AI Phân Tích Lỗi', desc: 'AI phát hiện và phân loại lỗi bề mặt thép tự động.' },
    { icon: '💡', title: 'Nhận Lời', desc: 'Đưa ra gợi ý AHP dựa trên kết quả phân tích.' },
    { icon: '📄', title: 'Tạo và Tải Báo Cáo', desc: 'Tạo và xuất kết quả chi tiết dạng PDF chuyên nghiệp.' },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-slate-800">Quy trình làm việc (How It Works)</h3>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex min-w-[100px] flex-1 flex-col items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl shadow-sm">
                {s.icon}
              </div>
              <p className="text-xs font-semibold text-slate-800">{s.title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="mt-5 hidden text-slate-300 md:block">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Feature chips                                               */
/* ─────────────────────────────────────────────────────────── */
const FeaturesStrip = () => {
  const items = [
    { icon: '🤖', label: 'ĐỌC KẾT QUẢ LÔ' },
    { icon: '⚖️', label: 'GỢI Ý SỬA / BỎ' },
    { icon: '📄', label: 'Xuất báo cáo PDF' },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-slate-800">Các tính năng chính</h3>
      <div className="flex flex-wrap gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex min-w-[90px] flex-1 flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center shadow-sm"
          >
            <span className="text-2xl">{it.icon}</span>
            <p className="text-[10px] font-semibold leading-tight text-slate-700">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
/* Dashboard                                                   */
/* ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [images, setImages] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // API state
  const [loading, setLoading] = useState(false)
  const [computing, setComputing] = useState(false)
  const [apiError, setApiError] = useState('')

  // Results from /analyze
  const [defects, setDefects] = useState([])
  const [summary, setSummary] = useState({
    warning_count: 0,
    fault_count: 0,
    avg_conf: 0,
    process_time: 0,
    total_estimated_cost: 0,
  })
  const [lastEntryId, setLastEntryId] = useState(null) // server-side entry id for AHP

  // AHP weights (user-controlled)
  const [costWeight, setCostWeight] = useState(3)
  const [timeWeight, setTimeWeight] = useState(3)
  const [areaWeight, setAreaWeight] = useState(3)

  // AHP result (from /analyze or /ahp)
  const [repairScore, setRepairScore] = useState(0)
  const [replaceScore, setReplaceScore] = useState(0)
  const [decision, setDecision] = useState(null)

  const selectedImage = useMemo(
    () => images.find((img) => img.id === selectedId),
    [images, selectedId]
  )

  /* ── Map API fault → internal shape ── */
  const mapFault = (f) => ({
    id: f.id,
    label: f.name || f.id,
    confidence: Number(f.confidence || 0),
    cost: Number(f.cost || 0),
    major: Boolean(f.major),
    x: Number(f.bbox?.x || 0),
    y: Number(f.bbox?.y || 0),
    w: Number(f.bbox?.w || 0),
    h: Number(f.bbox?.h || 0),
  })

  /* ── Persist to localStorage (for History/Stats pages) ── */
  const persistHistory = (entry) => {
    try {
      const key = 'detectsteel_history'
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      list.unshift(entry)
      localStorage.setItem(key, JSON.stringify(list))
    } catch (e) {
      console.error('persistHistory:', e)
    }
  }

  /* ── POST /analyze ── */
  const handleAnalyze = async () => {
    if (!selectedImage || loading) return
    setApiError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedImage.file)

      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Lỗi phân tích')

      const mappedFaults = (data.faults || []).map(mapFault)

      // Update image with annotated base64 from API
      setImages((prev) =>
        prev.map((img) =>
          img.id === selectedImage.id ? { ...img, image_base64: data.image_base64 } : img
        )
      )

      setDefects(mappedFaults)
      setSummary({
        warning_count: data.warning_count ?? 0,
        fault_count: data.fault_count ?? mappedFaults.length,
        avg_conf: data.avg_conf ?? 0,
        process_time: data.process_time ?? 0,
        total_estimated_cost: data.total_estimated_cost ?? 0,
      })

      const nextRepair = Number(data.repairScore ?? 0)
      const nextReplace = Number(data.replaceScore ?? 0)
      const nextDecision = data.decision ?? null
      setRepairScore(nextRepair)
      setReplaceScore(nextReplace)
      setDecision(nextDecision)
      setLastEntryId(data.id ?? null)

      // Persist for History / Stats
      persistHistory({
        id: `${data.id ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ts: Date.now(),
        imageId: selectedImage.name,
        imageData: data.image_base64,
        defects: mappedFaults,
        fileCount: 1,
        repairScore: nextRepair,
        replaceScore: nextReplace,
        decision: nextDecision,
      })
    } catch (err) {
      setApiError(`Phân tích thất bại: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  /* ── POST /ahp ── */
  const handleComputeAHP = async () => {
    if (!lastEntryId) {
      setApiError('Hãy phân tích ảnh trước khi tính AHP.')
      return
    }
    setApiError('')
    setComputing(true)
    try {
      const res = await fetch(`${API_BASE}/ahp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: lastEntryId,
          cost_weight: costWeight,
          time_weight: timeWeight,
          area_weight: areaWeight,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Lỗi tính AHP')

      setRepairScore(Number(data.repairScore ?? 0))
      setReplaceScore(Number(data.replaceScore ?? 0))
      setDecision(data.decision ?? null)
    } catch (err) {
      setApiError(`Tính AHP thất bại: ${err.message}`)
    } finally {
      setComputing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* Global error banner */}
        {apiError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            {apiError}
            <button onClick={() => setApiError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Row 1: 3 columns ─────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Left – image manager */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-slate-800">Quản lý lô ảnh</h3>
              <ImageUploader
                images={images}
                setImages={setImages}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            </div>
          </aside>

          {/* Center – detection viewer + defect table */}
          <main className="col-span-12 lg:col-span-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <DetectionViewer image={selectedImage} defects={defects} loading={loading} />
              <div className="mt-4">
                <h4 className="mb-2 text-base font-bold text-slate-900">
                  Chi tiết lỗi phân tích lô:{' '}
                  <span className="text-[#1E3A8A]">
                    #{selectedImage?.name?.replace(/\.[^.]+$/, '').slice(-6) ?? '---'}
                  </span>
                </h4>
                <DefectTable faults={defects} />
              </div>
            </div>
          </main>

          {/* Right – status + AHP + result */}
          <aside className="col-span-12 space-y-3 lg:col-span-3">
            <StatusCard summary={summary} />

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <AHPPanel
                costWeight={costWeight}
                timeWeight={timeWeight}
                areaWeight={areaWeight}
                setCostWeight={setCostWeight}
                setTimeWeight={setTimeWeight}
                setAreaWeight={setAreaWeight}
                onCompute={handleComputeAHP}
                computing={computing}
                onAnalyze={handleAnalyze}
                loading={loading}
                canAnalyze={Boolean(selectedImage)}
              />
            </div>

            <ResultCard repairScore={repairScore} replaceScore={replaceScore} decision={decision} />
          </aside>
        </div>

        {/* ── Row 2: How It Works + Features ───────────────── */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <HowItWorksStrip />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <FeaturesStrip />
          </div>
        </div>

        {/* Footer */}
        <p className="pb-2 text-center text-[11px] text-slate-400">
          Hệ thống DetectSteel AI © 2023 &mdash; Phát triển bởi Đội ngũ R&amp;D · Giải pháp kiểm định chất lượng thép thông minh.
        </p>
      </div>
    </div>
  )
}
