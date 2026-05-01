import React, { useMemo, useState } from 'react'
import ImageUploader from './ImageUploader'
import DetectionViewer from './DetectionViewer'
import AHPPanel from './AHPPanel'
import FlawAttributesPanel from './FlawAttributesPanel'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')

/* ── Parse time string like "~5-10 phút" to average number ── */
const parseTime = (str) => {
  const match = String(str || '').match(/~(\d+)-(\d+)/)
  if (match) return (Number(match[1]) + Number(match[2])) / 2
  return 0
}

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
          <th className="py-2 text-center">% Diện Tích Lỗi</th>
          <th className="py-2 text-center">Độ tin cậy</th>
          <th className="py-2 text-center">Thời gian giải quyết</th>
          <th className="py-2 text-right">Chi phí dự tính (VND)</th>
        </tr>
      </thead>
      <tbody>
        {faults.map((f, idx) => (
          <tr key={`${f.id}-${idx}`} className="border-b border-slate-100 last:border-0">
            <td className="py-2 font-medium text-slate-700">{f.label}</td>
            <td className="py-2 text-center text-slate-600">{Number(f.confidence).toFixed(1)}%</td>
            <td className="py-2 text-center">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                Number(f.conf) >= 80 ? 'bg-red-100 text-red-700' :
                Number(f.conf) >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {Number(f.conf).toFixed(1)}%
              </span>
            </td>
            <td className="py-2 text-center text-slate-600">{f.time}</td>
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
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3">
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Tổng lỗi</p>
            <p className="text-base font-black text-slate-800">{summary.fault_count}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Diện Tích Lỗi TB</p>
            <p className="text-base font-black text-slate-800">{summary.avg_conf?.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Thời gian giải quyết TB</p>
            <p className="text-base font-black text-slate-800">{summary.avg_time?.toFixed(1)} phút</p>
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
        className={`text-xl font-black tracking-tight ${isRepair ? 'text-emerald-700' : 'text-rose-700'
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
/* MCDM Results Panel - 3 Methods Display with Charts          */
/* ─────────────────────────────────────────────────────────── */
const MCDMResultsPanel = ({ mcdmData }) => {
  if (!mcdmData) return null

  const { aggregated, ahp, topsis, entropy } = mcdmData

  // Prepare data for AHP Radar Chart
  const ahpRadarData = ahp.weights ? [
    { criterion: 'Area', value: ahp.weights.area, fullMark: 1 },
    { criterion: 'Time', value: ahp.weights.time, fullMark: 1 },
    { criterion: 'Cost', value: ahp.weights.cost, fullMark: 1 },
  ] : []

  // Prepare data for TOPSIS Bar Chart
  const topsisBarData = [
    { name: 'Sửa chữa', value: topsis.repair_score, color: '#10b981' },
    { name: 'Hủy bỏ', value: topsis.replace_score, color: '#ef4444' },
    { name: 'Chờ xử lý', value: 0.05, color: '#94a3b8' },
  ]

  // Prepare data for Entropy Bar Chart
  const entropyBarData = entropy.weights ? [
    { name: 'Cost', value: entropy.weights.cost * 100, color: '#3b82f6' },
    { name: 'Time', value: entropy.weights.time * 100, color: '#8b5cf6' },
    { name: 'Flaw Area', value: entropy.weights.area * 100, color: '#f59e0b' },
    { name: 'Defect Shape', value: 10, color: '#6b7280' },
  ] : []

  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-5 shadow-lg">
      {/* Header */}
      <div className="mb-4 border-b-2 border-slate-200 pb-3">
        <h2 className="text-center text-lg font-black uppercase tracking-wide text-slate-800">
          METHODOLOGY COMPARISON & AGGREGATION
        </h2>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        
        {/* LEFT: Entropy Method */}
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-blue-900">
              PHƯƠNG PHÁP ENTROPY<br/>
              <span className="text-xs font-normal">(KHÁCH QUAN)</span>
            </h3>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${
              entropy.decision === 'repair' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {entropy.decision === 'repair' ? 'SỬA' : 'BỎ'}
            </span>
          </div>

          <p className="mb-3 text-xs text-slate-700">
            TỰ ĐỘNG XÁC ĐỊNH TRỌNG SỐ<br/>
            DỰA TRÊN DỮ LIỆU BẤT THỦ VÀ BIẾN ĐỘNG
          </p>

          {/* Entropy Bar Chart */}
          <div className="mb-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entropyBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 50]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {entropyBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded bg-white p-2 text-xs">
            <p className="font-semibold text-slate-700">Góc nhìn Dữ liệu:</p>
            <p className="text-slate-600">
              Tiêu chí Cost biến động lớn nhất → quan trọng nhất.
            </p>
          </div>
        </div>

        {/* RIGHT: AHP Method */}
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-purple-900">
              PHƯƠNG PHÁP AHP<br/>
              <span className="text-xs font-normal">(CHỦ QUAN)</span>
            </h3>
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${
              ahp.decision === 'repair' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {ahp.decision === 'repair' ? 'SỬA' : 'BỎ'}
            </span>
          </div>

          <p className="mb-3 text-xs text-slate-700">
            DỰA TRÊN KINH NGHIỆM CHUYÊN<br/>
            GIA VÀ ĐÁNH GIÁ DỰA TIÊU CHÍ
          </p>

          {/* AHP Radar Chart */}
          <div className="mb-3 flex h-40 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={ahpRadarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10, fill: '#475569' }} />
                <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 9 }} />
                <Radar name="AHP" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded bg-white p-2 text-xs">
            <p className="font-semibold text-slate-700">Góc nhìn Chuyên gia:</p>
            <p className="text-slate-600">
              Tiêu chí Costs: Ưu tiên chất lượng và tần dụng nguyên liệu.
            </p>
          </div>
        </div>
      </div>

      {/* TOPSIS Section */}
      <div className="mt-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-emerald-900">
            XẾP HẠNG TOPSIS & ĐIỂM SỐ C*
          </h3>
          <span className="rounded bg-white px-2 py-1 text-xs font-bold text-slate-700">
            C* = {topsis.repair_score.toFixed(2)}
          </span>
        </div>

        {/* TOPSIS Bar Chart */}
        <div className="mb-3 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topsisBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {topsisBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-slate-700">
          <span className="font-semibold">Xếp hạng tối ưu:</span> Gần D⁺ nhất; Xa D⁻ nhất.
        </p>
      </div>

      {/* Aggregation Section */}
      <div className="mt-4 rounded-lg border-2 border-indigo-300 bg-gradient-to-br from-indigo-100 to-white p-4">
        <h3 className="mb-3 text-center text-sm font-black uppercase text-indigo-900">
          TỔNG HỢP QUYẾT ĐỊNH & GẦN TRỌNG SỐ
        </h3>

        <div className="mb-3 text-center">
          <p className="text-xs text-slate-700">
            TỔNG ĐIỂM (C*) = {aggregated.method_weights?.ahp?.toFixed(2) || '0.40'}(AHP) + {aggregated.method_weights?.entropy?.toFixed(2) || '0.30'}(Entropy) + {aggregated.method_weights?.topsis?.toFixed(2) || '0.30'}(TOPSIS)
          </p>
          <p className="mt-1 text-lg font-black text-indigo-900">
            Gần trọng số: AHP {(aggregated.method_weights?.ahp * 100 || 40).toFixed(0)}%, Entropy {(aggregated.method_weights?.entropy * 100 || 30).toFixed(0)}%, TOPSIS {(aggregated.method_weights?.topsis * 100 || 30).toFixed(0)}%
          </p>
        </div>

        <div className="rounded-lg bg-white p-3 text-center">
          <p className="mb-1 text-xs text-slate-600">Trọng số dựa trên bối cảnh doanh nghiệp (coi trọng kinh nghiệm kĩ sư).</p>
        </div>
      </div>

      {/* Final Decision */}
      <div className={`mt-4 rounded-lg border-2 p-4 ${
        aggregated.decision === 'repair' 
          ? 'border-emerald-400 bg-emerald-50' 
          : 'border-rose-400 bg-rose-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-600">KẾT LUẬN CUỐI CÙNG & ĐÁNH GIÁ ĐỘ NGHIÊM TRỌNG</p>
            <h2 className={`mt-1 text-2xl font-black ${
              aggregated.decision === 'repair' ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              🎯 KHUYẾN NGHỊ: NÊN {aggregated.decision === 'repair' ? 'SỬA CHỮA' : 'LOẠI BỎ'} (C* = {aggregated.repair_score.toFixed(2)})
            </h2>
          </div>
          <div className="text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
              aggregated.decision === 'repair' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
              {aggregated.decision === 'repair' ? '✓' : '✗'}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded bg-white p-3 text-xs text-slate-700">
          <p className="font-semibold">
            Sau khi tích hợp trong số (AHP chuyên gia + Entropy dữ liệu), thuật toán TOPSIS đánh giá phương án Sửa chữa là gần điểm lý tưởng nhất. Do nghiệm kĩ thuật đã xác nhận trên vùng chịu lực chính, nhưng việc sửa chữa mang lại hiệu quả chi phí và thời gian tối ưu so với Hủy bỏ.
          </p>
        </div>

        {/* Voting */}
        {aggregated.votes && (
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <span className="font-semibold text-slate-700">Biểu quyết:</span>
            <span className="text-emerald-700">✓ Sửa: {aggregated.votes.repair}/3</span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-700">✗ Bỏ: {aggregated.votes.replace}/3</span>
            <span className="ml-auto rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
              Độ tin cậy: {(aggregated.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
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
    avg_time: 0,
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
  const [mcdmResults, setMcdmResults] = useState(null) // Store full MCDM data

  const selectedImage = useMemo(
    () => images.find((img) => img.id === selectedId),
    [images, selectedId]
  )

  /* ── Map API fault → internal shape ── */
  const mapFault = (f, idx) => ({
    id: `${f.id || 'fault'}-${idx}`,
    label: f.name || f.id,
    confidence: Number(f.confidence || 0),   // % diện tích lỗi
    conf: Number(f.conf || 0),               // độ tin cậy YOLO (%)
    cost: Number(f.cost || 0),
    time: f.time,
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
          img.id === selectedImage.id
            ? { ...img, image_base64: data.image_base64, url: data.image_base64 }
            : img
        )
      )

      setDefects(mappedFaults)
      setSummary({
        warning_count: data.warning_count ?? 0,
        fault_count: data.fault_count ?? mappedFaults.length,
        avg_conf: data.avg_conf ?? 0,
        avg_time: mappedFaults.length ? mappedFaults.map(f => parseTime(f.time)).reduce((a, b) => a + b, 0) / mappedFaults.length : 0,
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
      setMcdmResults(data.mcdm ?? null) // Store MCDM results

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
      setMcdmResults(data.mcdm ?? null) // Update MCDM results
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
          <main className="col-span-12 lg:col-span-5">
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

            {/* Flaw Attributes Panel */}
            {defects.length > 0 && (
              <div className="mt-4">
                <FlawAttributesPanel defects={defects} summary={summary} />
              </div>
            )}
          </main>

          {/* Right – status + AHP + result + MCDM */}
          <aside className="col-span-12 space-y-3 lg:col-span-4">
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
                canAHP={Boolean(lastEntryId)}
              />
            </div>

            <ResultCard repairScore={repairScore} replaceScore={replaceScore} decision={decision} />
            
            {/* MCDM Results Panel */}
            <MCDMResultsPanel mcdmData={mcdmResults} />
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
