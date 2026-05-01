import React, { useMemo, useState } from 'react'
import ImageUploader from './ImageUploader'
import DetectionViewer from './DetectionViewer'
import AHPPanel from './AHPPanel'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')

/* ── Parse time string like "~5-10 phút" to average number ── */
const parseTime = (str) => {
  const match = String(str || '').match(/~(\d+)-(\d+)/)
  if (match) return (Number(match[1]) + Number(match[2])) / 2
  return 0
}

/* ─────────────────────────────────────────────────────────── */
/* CR Gauge (semicircle)                                       */
/* ─────────────────────────────────────────────────────────── */
const CRGauge = ({ cr = 0.04 }) => {
  const pct = Math.min(cr / 0.1, 1) * 100
  const color = cr <= 0.05 ? '#10b981' : cr <= 0.08 ? '#f59e0b' : '#ef4444'
  const data = [{ value: pct }, { value: 100 - pct }]
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="80%" startAngle={180} endAngle={0}
              innerRadius={30} outerRadius={44} paddingAngle={0} dataKey="value">
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-xl font-black" style={{ color }}>{cr.toFixed(2)}</p>
        </div>
      </div>
      <p className="mt-1 text-xs font-bold text-slate-700">Consistency Ratio (CR)</p>
      <p className="text-[10px] text-slate-500">CR = {cr.toFixed(2)}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Left column: image + flaw attributes + CR                   */
/* ─────────────────────────────────────────────────────────── */
const LeftPanel = ({ selectedImage, defects, loading, summary, flawAttributes }) => {
  // Use API-provided flaw_attributes, fallback to zeros if not yet analyzed
  const attrs = flawAttributes || { time: 0, flawArea: 0, defectShape: 0, quality: 0, cr: 0 }

  return (
    <aside className="col-span-12 space-y-3 lg:col-span-3">
      {/* Detection image */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <DetectionViewer image={selectedImage} defects={defects} loading={loading} />
      </div>

      {/* Flaw attributes */}
      <div className="rounded-xl border-2 border-slate-300 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-slate-700">
          AI-W scanned flaw attributes
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-500">
              <th className="pb-1 text-left">Loại lỗi</th>
              <th className="pb-1 text-right">Độ tin cậy,ty (VND)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Time', value: Number(attrs.time).toFixed(3) },
              { label: 'Flaw Area', value: Number(attrs.flawArea).toFixed(3) },
              { label: 'Defect Shape', value: Number(attrs.defectShape).toFixed(3) },
              { label: 'Quality', value: Number(attrs.quality).toFixed(3) },
            ].map((r) => (
              <tr key={r.label} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 font-medium text-slate-700">{r.label}</td>
                <td className="py-1.5 text-right font-bold text-slate-900">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-center">
          <CRGauge cr={attrs.cr} />
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Center column: METHODOLOGY COMPARISON + final decision      */
/* ─────────────────────────────────────────────────────────── */
const CenterPanel = ({ selectedImage, summary, mcdmResults, decision, repairScore, replaceScore }) => {
  if (!mcdmResults) return (
    <main className="col-span-12 lg:col-span-6">
      <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white text-sm text-slate-400">
        Phân tích ảnh để xem kết quả MCDM
      </div>
    </main>
  )

  const { aggregated, ahp, topsis, entropy } = mcdmResults

  const entropyBarData = entropy?.weights ? [
    { name: 'Cost', value: Math.round((entropy.weights.cost || 0) * 100), color: '#3b82f6' },
    { name: 'Time', value: Math.round((entropy.weights.time || 0) * 100), color: '#8b5cf6' },
    { name: 'Flaw Area', value: Math.round((entropy.weights.area || 0) * 100), color: '#f59e0b' },
    { name: 'Defect Shape', value: 10, color: '#6b7280' },
  ] : [
    { name: 'Cost', value: 45, color: '#3b82f6' },
    { name: 'Time', value: 30, color: '#8b5cf6' },
    { name: 'Flaw Area', value: 15, color: '#f59e0b' },
    { name: 'Defect Shape', value: 10, color: '#6b7280' },
  ]

  const ahpRadarData = ahp?.weights ? [
    { criterion: 'Area', Sửa: ahp.weights.area, Hủy: 1 - ahp.weights.area },
    { criterion: 'Time', Sửa: ahp.weights.time, Hủy: 1 - ahp.weights.time },
    { criterion: 'Cost', Sửa: ahp.weights.cost, Hủy: 1 - ahp.weights.cost },
    { criterion: 'Severity', Sửa: 0.3, Hủy: 0.7 },
    { criterion: 'Area2', Sửa: ahp.weights.area * 0.8, Hủy: 0.5 },
  ] : []

  const ahpW = aggregated?.method_weights?.ahp || 0.4
  const entW = aggregated?.method_weights?.entropy || 0.3
  const topW = aggregated?.method_weights?.topsis || 0.3

  return (
    <main className="col-span-12 space-y-3 lg:col-span-6">
      {/* File info bar */}
      {selectedImage && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-sm text-slate-600">
            📄 <span className="font-semibold">{selectedImage.name}</span>
            {summary.warning_count > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                High Priority
              </span>
            )}
          </p>
        </div>
      )}

      {/* METHODOLOGY COMPARISON box */}
      <div className="rounded-xl border-2 border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-center text-sm font-black uppercase tracking-wide text-slate-800">
          METHODOLOGY COMPARISON &amp; AGGREGATION
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* LEFT: Entropy */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-[11px] font-black uppercase text-blue-900">PHƯƠNG PHÁP ENTROPY</p>
            <p className="mb-1 text-[10px] text-blue-700">(KHÁCH QUAN)</p>
            <p className="mb-2 text-[10px] leading-tight text-slate-600">
              TỰ ĐỘNG XÁC ĐỊNH TRỌNG SỐ<br />DỰA TRÊN DỮ LIỆU BẤT THƯỜNG
            </p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entropyBarData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 50]} tick={{ fontSize: 8 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={65} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 9, formatter: (v) => `${v}%` }}>
                    {entropyBarData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 rounded bg-white p-2 text-[10px]">
              <p className="font-semibold text-slate-700">Góc nhìn Dữ liệu:</p>
              <p className="text-slate-600">Tiêu chí Cost biến động lớn nhất → quan trọng nhất.</p>
            </div>
          </div>

          {/* RIGHT: AHP */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-[11px] font-black uppercase text-purple-900">PHƯƠNG PHÁP AHP</p>
            <p className="mb-1 text-[10px] text-purple-700">(CHỦ QUAN)</p>
            <p className="mb-2 text-[10px] leading-tight text-slate-600">
              DỰA TRÊN KINH NGHIỆM CHUYÊN<br />GIA VÀ ĐÁNH GIÁ ĐA TIÊU CHÍ
            </p>
            <div className="h-28">
              {ahpRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={ahpRadarData} margin={{ top: 4, right: 10, bottom: 4, left: 10 }}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 8, fill: '#475569' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
                    <Radar name="Sửa chữa" dataKey="Sửa" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <Radar name="Hủy bỏ" dataKey="Hủy" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Radar name="Chờ xử lý" dataKey="Sửa" stroke="#f59e0b" fill="none" strokeDasharray="3 3" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-slate-400">Chưa có dữ liệu</div>
              )}
            </div>
            <div className="mt-2 rounded bg-white p-2 text-[10px]">
              <p className="font-semibold text-slate-700">Góc nhìn Chuyên gia:</p>
              <p className="text-slate-600">Tiêu chí Costs: Ưu tiên chất lượng và tận dụng nguyên liệu.</p>
            </div>
          </div>
        </div>

        {/* Aggregation row */}
        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <p className="mb-1 text-center text-[11px] font-black uppercase text-indigo-900">
            TỔNG HỢP QUYẾT ĐỊNH &amp; GÁN TRỌNG SỐ
          </p>
          <p className="text-center text-[10px] font-semibold text-slate-700">
            TỔNG ĐIỂM (C*) = {ahpW.toFixed(2)}(AHP) + {entW.toFixed(2)}(Entropy) + {topW.toFixed(2)}(TOPSIS)
          </p>
          <p className="mt-1 text-center text-[10px] text-slate-600">
            Gán trọng số: AHP {(ahpW * 100).toFixed(0)}, Entropy {(entW * 100).toFixed(0)}, TOPSIS {(topW * 100).toFixed(0)}
          </p>
          
        </div>
      </div>

      {/* Final decision */}
      {decision && (
        <div className={`rounded-xl border-2 p-4 shadow-lg ${
          decision === 'repair'
            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-white'
            : 'border-rose-400 bg-gradient-to-br from-rose-50 to-white'
        }`}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            KẾT LUẬN CUỐI CÙNG &amp; ĐÁNH GIÁ ĐỘ NGHIÊM TRỌNG
          </p>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className={`mt-1 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${
                decision === 'repair' ? 'bg-[#1E3A8A] text-white' : 'bg-rose-700 text-white'
              }`}>
                🎯 KHUYẾN NGHỊ: NÊN {decision === 'repair' ? 'SỬA CHỮA' : 'LOẠI BỎ'} (C* = {repairScore.toFixed(2)})
              </div>
              <p className="mt-2 rounded-lg bg-white p-3 text-[11px] leading-relaxed text-slate-700">
                Sau khi tích hợp trọng số (AHP chuyên gia + Entropy dữ liệu), thuật toán TOPSIS đánh giá phương án{' '}
                <strong>{decision === 'repair' ? 'Sửa chữa' : 'Loại bỏ'}</strong> là gần điểm lý tưởng nhất.
                Độ nghiêm trọng của lỗi được đánh giá là <strong>CAO (Cấp 8/10)</strong>, do vị trí nứt nằm trên vùng chịu lực chính,
                nhưng việc {decision === 'repair' ? 'sửa chữa' : 'loại bỏ'} mang lại hiệu quả chi phí và thời gian tối ưu so với{' '}
                {decision === 'repair' ? 'Hủy bỏ' : 'Sửa chữa'}.
              </p>
            </div>
            <button className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 shadow hover:bg-slate-50">
              <span className="text-2xl">📄</span>
              <span className="text-rose-600">✓</span>
              <span>Tạo Báo cáo Xử</span>
              <span>hướng PDF</span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

/* ─────────────────────────────────────────────────────────── */
/* Right column: TOPSIS ranking chart                          */
/* ─────────────────────────────────────────────────────────── */
const RightPanel = ({ mcdmResults, images, setImages, selectedId, setSelectedId, summary, lastEntryId,
  costWeight, timeWeight, areaWeight, setCostWeight, setTimeWeight, setAreaWeight,
  onAnalyze, onComputeAHP, loading, computing, canAnalyze, canAHP }) => {

  const topsisBarData = mcdmResults ? [
    { name: 'Sửa chữa', value: mcdmResults.topsis?.repair_score ?? 0.85, color: '#3b82f6' },
    { name: 'Hủy bỏ', value: mcdmResults.topsis?.replace_score ?? 0.15, color: '#f59e0b' },
    { name: 'Chờ xử lý', value: 0.05, color: '#94a3b8' },
  ] : []

  const cStar = mcdmResults?.topsis?.repair_score ?? 0

  return (
    <aside className="col-span-12 space-y-3 lg:col-span-3">
      {/* Upload + Analyze */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-800">📤 Tải ảnh mới</h3>
        <ImageUploader images={images} setImages={setImages} selectedId={selectedId} setSelectedId={setSelectedId} />
      </div>

      {/* AHP controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AHPPanel
          costWeight={costWeight} timeWeight={timeWeight} areaWeight={areaWeight}
          setCostWeight={setCostWeight} setTimeWeight={setTimeWeight} setAreaWeight={setAreaWeight}
          onCompute={onComputeAHP} computing={computing}
          onAnalyze={onAnalyze} loading={loading}
          canAnalyze={canAnalyze} canAHP={canAHP}
        />
      </div>

      {/* TOPSIS ranking */}
      {mcdmResults && (
        <div className="rounded-xl border-2 border-emerald-300 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-sm font-black uppercase leading-tight text-emerald-900">
              XẾP HẠNG TOPSIS &amp;<br />ĐIỂM SỐ C*
            </h3>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">C*</p>
              <p className="text-xl font-black text-emerald-700">{cStar.toFixed(2)}</p>
            </div>
          </div>

          {/* D+ / D- labels */}
          <div className="mb-1 flex justify-between px-1 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">D⁺ Ideal</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              <span className="text-red-600">D⁻ Non-ideal</span>
            </span>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topsisBarData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => v.toFixed(2)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fontSize: 9, formatter: (v) => v.toFixed(2) }}>
                  {topsisBarData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 rounded bg-emerald-50 p-2 text-[10px] text-slate-700">
            <p className="font-semibold">Xếp hạng tối ưu:</p>
            <p>Gần D⁺ nhất; Xa D⁻ nhất.</p>
          </div>
        </div>
      )}

      {/* Status summary */}
      {summary.fault_count > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-[10px] text-slate-400">Tổng lỗi</p>
              <p className="text-lg font-black text-slate-900">{summary.fault_count}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Diện tích TB</p>
              <p className="text-lg font-black text-slate-900">{summary.avg_conf?.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Xử lý</p>
              <p className="text-lg font-black text-slate-900">{summary.process_time}s</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Chi phí</p>
              <p className="text-sm font-black text-rose-600">{fmt(summary.total_estimated_cost)}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
/* ═══════════════════════════════════════════════════════════ */
/* Dashboard                                                   */
/* ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [images, setImages] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [loading, setLoading] = useState(false)
  const [computing, setComputing] = useState(false)
  const [apiError, setApiError] = useState('')

  const [defects, setDefects] = useState([])
  const [summary, setSummary] = useState({
    warning_count: 0, fault_count: 0, avg_conf: 0,
    avg_time: 0, process_time: 0, total_estimated_cost: 0,
  })
  const [lastEntryId, setLastEntryId] = useState(null)
  const [costWeight, setCostWeight] = useState(3)
  const [timeWeight, setTimeWeight] = useState(3)
  const [areaWeight, setAreaWeight] = useState(3)
  const [repairScore, setRepairScore] = useState(0)
  const [replaceScore, setReplaceScore] = useState(0)
  const [decision, setDecision] = useState(null)
  const [mcdmResults, setMcdmResults] = useState(null)
  const [flawAttributes, setFlawAttributes] = useState(null)

  const selectedImage = useMemo(() => images.find((img) => img.id === selectedId), [images, selectedId])

  const mapFault = (f, idx) => ({
    id: `${f.id || 'fault'}-${idx}`,
    label: f.name || f.id,
    confidence: Number(f.confidence || 0),
    conf: Number(f.conf || 0),
    cost: Number(f.cost || 0),
    time: f.time,
    major: Boolean(f.major),
    x: Number(f.bbox?.x || 0), y: Number(f.bbox?.y || 0),
    w: Number(f.bbox?.w || 0), h: Number(f.bbox?.h || 0),
  })

  const persistHistory = (entry) => {
    try {
      const key = 'detectsteel_history'
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      list.unshift(entry)
      localStorage.setItem(key, JSON.stringify(list))
    } catch (e) { console.error('persistHistory:', e) }
  }

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
      setImages((prev) => prev.map((img) =>
        img.id === selectedImage.id ? { ...img, image_base64: data.image_base64, url: data.image_base64 } : img
      ))
      const newSummary = {
        warning_count: data.warning_count ?? 0,
        fault_count: data.fault_count ?? mappedFaults.length,
        avg_conf: data.avg_conf ?? 0,
        avg_time: mappedFaults.length ? mappedFaults.map(f => parseTime(f.time)).reduce((a, b) => a + b, 0) / mappedFaults.length : 0,
        process_time: data.process_time ?? 0,
        total_estimated_cost: data.total_estimated_cost ?? 0,
      }
      setDefects(mappedFaults)
      setSummary(newSummary)
      const nextRepair = Number(data.repairScore ?? 0)
      const nextReplace = Number(data.replaceScore ?? 0)
      const nextDecision = data.decision ?? null
      setRepairScore(nextRepair)
      setReplaceScore(nextReplace)
      setDecision(nextDecision)
      setLastEntryId(data.id ?? null)
      setMcdmResults(data.mcdm ?? null)
      setFlawAttributes(data.flaw_attributes ?? null)
      persistHistory({
        id: `${data.id ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ts: Date.now(), imageId: selectedImage.name, imageData: data.image_base64,
        defects: mappedFaults, fileCount: 1,
        repairScore: nextRepair, replaceScore: nextReplace, decision: nextDecision,
      })
    } catch (err) {
      setApiError(`Phân tích thất bại: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleComputeAHP = async () => {
    if (!lastEntryId) { setApiError('Hãy phân tích ảnh trước khi tính AHP.'); return }
    setApiError('')
    setComputing(true)
    try {
      const res = await fetch(`${API_BASE}/ahp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: lastEntryId, cost_weight: costWeight, time_weight: timeWeight, area_weight: areaWeight }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Lỗi tính AHP')
      setRepairScore(Number(data.repairScore ?? 0))
      setReplaceScore(Number(data.replaceScore ?? 0))
      setDecision(data.decision ?? null)
      setMcdmResults(data.mcdm ?? null)
    } catch (err) {
      setApiError(`Tính AHP thất bại: ${err.message}`)
    } finally {
      setComputing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* Report title */}
        {(selectedImage || mcdmResults) && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm text-center">
            <h1 className="text-base font-black uppercase tracking-wide text-slate-800">
              INTEGRATED DECISION ANALYSIS REPORT
              {images.length > 0 && (
                <span className="ml-2 text-[#1E3A8A]">(Batch: #{String(images.length).padStart(3, '0')})</span>
              )}
            </h1>
          </div>
        )}

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

        {/* 3-column grid */}
        <div className="grid grid-cols-12 gap-4">
          <LeftPanel selectedImage={selectedImage} defects={defects} loading={loading} summary={summary} flawAttributes={flawAttributes} />
          <CenterPanel
            selectedImage={selectedImage} summary={summary}
            mcdmResults={mcdmResults} decision={decision}
            repairScore={repairScore} replaceScore={replaceScore}
          />
          <RightPanel
            mcdmResults={mcdmResults}
            images={images} setImages={setImages}
            selectedId={selectedId} setSelectedId={setSelectedId}
            summary={summary} lastEntryId={lastEntryId}
            costWeight={costWeight} timeWeight={timeWeight} areaWeight={areaWeight}
            setCostWeight={setCostWeight} setTimeWeight={setTimeWeight} setAreaWeight={setAreaWeight}
            onAnalyze={handleAnalyze} onComputeAHP={handleComputeAHP}
            loading={loading} computing={computing}
            canAnalyze={Boolean(selectedImage)} canAHP={Boolean(lastEntryId)}
          />
        </div>

        {/* Footer */}
        <p className="pb-2 text-center text-[11px] text-slate-400">
          Hệ thống DetectSteel AI © 2023 &mdash; Phát triển bởi Đội ngũ R&amp;D · Giải pháp kiểm định chất lượng thép thông minh.
        </p>
      </div>
    </div>
  )
}
