import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')
const fmtDate = (ts) => {
  // handle both ISO string and unix ms
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts)
  return d.toLocaleString('vi-VN')
}
const fmtPct = (n) => ((Number(n) || 0) * 100).toFixed(1) + '%'

/* ── Normalize entry from API or localStorage ─────────────── */
function normalizeEntry(raw, idx) {
  const defects = Array.isArray(raw.defects) ? raw.defects : []
  // API stores faults under "faults", localStorage under "defects"
  const faults = Array.isArray(raw.faults) ? raw.faults : defects
  const normalized = faults.map((f) => ({
    id: f.id,
    label: f.label || f.name || f.id,
    name: f.name || f.label || f.id,
    confidence: Number(f.confidence || 0),
    cost: Number(f.cost || 0),
    major: Boolean(f.major),
  }))
  const majorCount = normalized.filter((d) => d.major).length
  const minorCount = Math.max(0, normalized.length - majorCount)
  // Extract MCDM scores
  const mcdm = raw.mcdm || null
  return {
    ...raw,
    lotCode: String(idx + 1).padStart(3, '0'),
    defects: normalized,
    totalFault: normalized.length,
    majorCount,
    minorCount,
    topDefect: normalized[0]?.label || '-',
    imageData: raw.imageData || raw.image_base64 || null,
    imageId: raw.imageId || raw.filename || null,
    ts: raw.ts || (raw.timestamp ? new Date(raw.timestamp).getTime() : Date.now()),
    repairScore: Number(raw.repairScore || 0),
    replaceScore: Number(raw.replaceScore || 0),
    decision: raw.decision || 'repair',
    // MCDM per-method scores
    ahpRepair:     Number(mcdm?.ahp?.repair_score     ?? raw.repairScore ?? 0),
    ahpReplace:    Number(mcdm?.ahp?.replace_score    ?? raw.replaceScore ?? 0),
    topsisRepair:  Number(mcdm?.topsis?.repair_score  ?? 0),
    topsisReplace: Number(mcdm?.topsis?.replace_score ?? 0),
    entropyRepair: Number(mcdm?.entropy?.repair_score ?? 0),
    entropyReplace:Number(mcdm?.entropy?.replace_score?? 0),
    ahpDecision:     mcdm?.ahp?.decision     ?? raw.decision ?? 'repair',
    topsisDecision:  mcdm?.topsis?.decision  ?? null,
    entropyDecision: mcdm?.entropy?.decision ?? null,
  }
}

/* ── Bỏ dấu tiếng Việt để dùng với font helvetica của jsPDF ── */
function removeDiacritics(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
}
const pdfText = (pdf, text, ...args) => pdf.text(removeDiacritics(text), ...args)

/* ── PDF generator ────────────────────────────────────────── */
async function downloadPDF(it) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const margin = 40
  let y = margin

  // Header
  pdf.setFillColor(30, 58, 138)
  pdf.rect(margin, y, W - margin * 2, 36, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdfText(pdf, 'DetectSteel — Báo cáo Phân tích', margin + 10, y + 24)
  y += 50

  // Meta
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdfText(pdf, `Thời gian: ${fmtDate(it.ts)}`, margin, y)
  pdfText(pdf, `Lô: ${it.imageId || it.id}`, margin + 260, y)
  y += 18

  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, W - margin, y)
  y += 14

  // Image
  if (it.imageData) {
    try {
      const format = it.imageData.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      pdf.addImage(it.imageData, format, margin, y, W - margin * 2, 200)
      y += 214
    } catch (_) { }
  }

  // Table header
  pdf.setFillColor(248, 250, 252)
  pdf.rect(margin, y, W - margin * 2, 20, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.rect(margin, y, W - margin * 2, 20, 'S')
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdfText(pdf, 'Loại lỗi', margin + 6, y + 13)
  pdfText(pdf, 'Độ tin cậy', margin + 240, y + 13)
  pdfText(pdf, 'Chi phí (VND)', W - margin - 6, y + 13, { align: 'right' })
  y += 20

  // Defect rows
  const defects = it.defects || []
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  if (!defects.length) {
    pdf.setTextColor(148, 163, 184)
    pdfText(pdf, 'Không phát hiện lỗi.', margin + 6, y + 13)
    y += 22
  } else {
    defects.forEach((d, i) => {
      pdf.setFillColor(...(i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]))
      pdf.rect(margin, y, W - margin * 2, 20, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 20, W - margin, y + 20)
      pdf.setTextColor(51, 65, 85)
      pdfText(pdf, String(d.label || d.name || '-'), margin + 6, y + 13)
      pdf.text(fmtPct(d.confidence), margin + 240, y + 13)
      pdf.text(fmt(d.cost), W - margin - 6, y + 13, { align: 'right' })
      y += 20
    })
  }

  // Total cost
  const totalCost = defects.reduce((s, d) => s + (Number(d.cost) || 0), 0)
  if (totalCost > 0) {
    pdf.setFillColor(241, 245, 249)
    pdf.rect(margin, y, W - margin * 2, 20, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdfText(pdf, 'Tổng chi phí:', margin + 6, y + 13)
    pdf.text(fmt(totalCost) + ' VND', W - margin - 6, y + 13, { align: 'right' })
    y += 26
  }

  y += 8
  pdf.setDrawColor(226, 232, 240)
  pdf.line(margin, y, W - margin, y)
  y += 14

  // ── MCDM result box (3 methods + aggregated) ──────────────
  const isRepair = it.decision === 'repair'
  const boxH = it.ahpDecision ? 110 : 56
  pdf.setFillColor(248, 250, 252)
  pdf.roundedRect(margin, y, W - margin * 2, boxH, 4, 4, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, W - margin * 2, boxH, 4, 4, 'S')

  // Title
  pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, 'KẾT QUẢ MCDM (AHP + TOPSIS + Entropy)', margin + 10, y + 14)

  // 3-method row headers
  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(71, 85, 105)
  pdfText(pdf, 'AHP (Chuyen gia)', margin + 10, y + 30)
  pdfText(pdf, 'TOPSIS (So sanh)', margin + 175, y + 30)
  pdfText(pdf, 'Entropy (Du lieu)', margin + 340, y + 30)

  // 3-method values
  pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
  const ahpD = it.ahpDecision || it.decision
  const topD = it.topsisDecision || null
  const entD = it.entropyDecision || null
  pdf.setTextColor(...(ahpD === 'repair' ? [5, 150, 105] : [220, 38, 38]))
  pdfText(pdf, ahpD === 'repair' ? 'SUA CHUA' : 'LOAI BO', margin + 10, y + 44)
  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, `Sua: ${Number(it.ahpRepair || it.repairScore || 0).toFixed(3)}  Bo: ${Number(it.ahpReplace || it.replaceScore || 0).toFixed(3)}`, margin + 10, y + 55)

  if (topD) {
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...(topD === 'repair' ? [5, 150, 105] : [220, 38, 38]))
    pdfText(pdf, topD === 'repair' ? 'SUA CHUA' : 'LOAI BO', margin + 175, y + 44)
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
    pdfText(pdf, `Sua: ${Number(it.topsisRepair || 0).toFixed(3)}  Bo: ${Number(it.topsisReplace || 0).toFixed(3)}`, margin + 175, y + 55)
  } else {
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184)
    pdfText(pdf, 'Chua co du lieu', margin + 175, y + 44)
  }

  if (entD) {
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...(entD === 'repair' ? [5, 150, 105] : [220, 38, 38]))
    pdfText(pdf, entD === 'repair' ? 'SUA CHUA' : 'LOAI BO', margin + 340, y + 44)
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
    pdfText(pdf, `Sua: ${Number(it.entropyRepair || 0).toFixed(3)}  Bo: ${Number(it.entropyReplace || 0).toFixed(3)}`, margin + 340, y + 55)
  } else {
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184)
    pdfText(pdf, 'Chua co du lieu', margin + 340, y + 44)
  }

  // Divider
  pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.4)
  pdf.line(margin + 6, y + 62, margin + W - margin * 2 - 6, y + 62)

  // Aggregated result
  pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, 'TONG HOP (C*) =', margin + 10, y + 76)
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...(isRepair ? [5, 150, 105] : [220, 38, 38]))
  pdfText(pdf, isRepair ? 'NEN SUA CHUA' : 'NEN LOAI BO', margin + 110, y + 76)
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, `C* = ${Number(it.repairScore || 0).toFixed(3)}  |  Score Bo: ${Number(it.replaceScore || 0).toFixed(3)}`, margin + 10, y + 90)

  y += boxH + 14

  // Footer
  pdf.setFontSize(8); pdf.setTextColor(148, 163, 184)
  pdfText(pdf, 'Hệ thống DetectSteel AI © 2025 — Phát triển bởi Đội ngũ R&D', W / 2, pdf.internal.pageSize.getHeight() - 20, { align: 'center' })
  pdf.save(`detectsteel-report-${it.id || Date.now()}.pdf`)
}

/* ── Detail modal ─────────────────────────────────────────── */
function DetailModal({ item, onClose, onDownloadPDF, downloading }) {
  const isRepair = item.decision === 'repair'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chi tiết phân tích</h3>
            <p className="text-xs text-slate-500">{item.imageId || item.id} · {fmtDate(item.ts)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onDownloadPDF} disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60">
              {downloading
                ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
              Tải PDF
            </button>
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Đóng</button>
          </div>
        </div>
        <div className="p-6">
          {item.imageData && (
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-black">
              <img src={item.imageData} alt="result" className="max-h-64 w-full object-contain" />
            </div>
          )}
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2 text-left">Loại lỗi</th>
                <th className="py-2 text-center">Độ tin cậy</th>
                <th className="py-2 text-right">Chi phí (VND)</th>
              </tr>
            </thead>
            <tbody>
              {!(item.defects?.length) && <tr><td colSpan={3} className="py-4 text-center text-slate-400">Không có lỗi</td></tr>}
              {item.defects?.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium text-slate-700">{d.label || d.name}</td>
                  <td className="py-2 text-center text-slate-600">{((d.confidence || 0) * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right font-semibold">{fmt(d.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Kết quả AHP</p>
            <p className={`text-lg font-black ${isRepair ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isRepair ? 'NÊN SỬA CHỮA' : 'NÊN LOẠI BỎ'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Score Sửa: {Number(item.repairScore || 0).toFixed(3)} — Score Bỏ: {Number(item.replaceScore || 0).toFixed(3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function History() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalItem, setModalItem] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [undo, setUndo] = useState(null)
  const [source, setSource] = useState('api') // 'api' | 'local'
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterDate, setFilterDate] = useState('')

  /* ── Load from API, fallback to localStorage ── */
  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/history`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const apiItems = (data.items || []).map(normalizeEntry)
      if (apiItems.length > 0) {
        setItems(apiItems)
        setSource('api')
      } else {
        // API empty → try localStorage
        loadFromLocal()
      }
    } catch {
      // API unreachable → fallback localStorage
      loadFromLocal()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem('detectsteel_history')
      const list = raw ? JSON.parse(raw) : []
      setItems(list.map(normalizeEntry))
      setSource('local')
    } catch (e) {
      console.error(e)
      setItems([])
      setSource('local')
    }
  }

  useEffect(() => { loadItems() }, [])

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mục này?')) return

    const removed = items.find((it) => it.id === id)

    if (source === 'api') {
      try {
        const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
      } catch (e) {
        console.error(e)
        // still remove from UI
      }
    } else {
      // localStorage
      try {
        const raw = localStorage.getItem('detectsteel_history')
        const list = raw ? JSON.parse(raw) : []
        localStorage.setItem('detectsteel_history', JSON.stringify(list.filter((it) => String(it.id) !== String(id))))
      } catch (e) { console.error(e) }
    }

    setItems((prev) => prev.filter((it) => String(it.id) !== String(id)))
    if (undo?.timer) clearTimeout(undo.timer)
    const timer = setTimeout(() => setUndo(null), 6000)
    setUndo({ item: removed, timer })
  }

  /* ── Undo (localStorage only — API doesn't support undo) ── */
  const handleUndo = () => {
    if (!undo) return
    setItems((prev) => [undo.item, ...prev])
    if (source === 'local') {
      try {
        const raw = localStorage.getItem('detectsteel_history')
        const list = raw ? JSON.parse(raw) : []
        list.unshift(undo.item)
        localStorage.setItem('detectsteel_history', JSON.stringify(list))
      } catch (e) { console.error(e) }
    }
    clearTimeout(undo.timer)
    setUndo(null)
  }

  const handleDownloadPDF = async (it) => {
    setDownloadingId(it.id)
    try { await downloadPDF(it) }
    catch (e) { alert('Không thể tạo PDF: ' + e.message) }
    finally { setDownloadingId(null) }
  }

  /* ── Download all filtered items as PDF ── */
  const handleDownloadAllPDF = async () => {
    if (filteredItems.length === 0) {
      alert('Không có dữ liệu để tải.')
      return
    }
    setDownloadingId('all')
    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const W = pdf.internal.pageSize.getWidth()
      const margin = 40
      let y = margin

      // Header
      pdf.setFillColor(30, 58, 138)
      pdf.rect(margin, y, W - margin * 2, 36, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdfText(pdf, 'DetectSteel — Báo cáo Tổng hợp Lịch sử Phân tích', margin + 10, y + 24)
      y += 50

      // Filter info
      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const filterText = `Bộ lọc: ${filterYear ? `Năm ${filterYear}` : 'Tất cả năm'}${filterMonth ? `, Tháng ${filterMonth}` : ''}${filterDate ? `, Ngày ${filterDate}` : ''} — Tổng: ${filteredItems.length} mục`
      pdfText(pdf, filterText, margin, y)
      y += 18

      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, W - margin, y)
      y += 14

      // Table header
      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin, y, W - margin * 2, 20, 'F')
      pdf.setDrawColor(226, 232, 240)
      pdf.rect(margin, y, W - margin * 2, 20, 'S')
      pdf.setTextColor(71, 85, 105)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdfText(pdf, 'ID Lô', margin + 6, y + 13)
      pdfText(pdf, 'Thời gian', margin + 80, y + 13)
      pdfText(pdf, 'Tổng lỗi', margin + 200, y + 13)
      pdfText(pdf, 'Lỗi lớn/nhỏ', margin + 280, y + 13)
      pdfText(pdf, 'Quyết định', margin + 360, y + 13)
      pdfText(pdf, 'Chi phí (VND)', W - margin - 6, y + 13, { align: 'right' })
      y += 20

      // Rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      filteredItems.forEach((it, idx) => {
        if (y > pdf.internal.pageSize.getHeight() - 100) {
          pdf.addPage()
          y = margin
        }
        pdf.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]))
        pdf.rect(margin, y, W - margin * 2, 20, 'F')
        pdf.setDrawColor(241, 245, 249)
        pdf.line(margin, y + 20, W - margin, y + 20)
        pdf.setTextColor(51, 65, 85)
        pdfText(pdf, `#${it.lotCode}`, margin + 6, y + 13)
        pdfText(pdf, fmtDate(it.ts), margin + 80, y + 13)
        pdf.text(String(it.totalFault), margin + 200, y + 13)
        pdf.text(`${it.majorCount}/${it.minorCount}`, margin + 280, y + 13)
        pdfText(pdf, it.decision === 'repair' ? 'Sửa chữa' : 'Loại bỏ', margin + 360, y + 13)
        const totalCost = (it.defects || []).reduce((s, d) => s + (Number(d.cost) || 0), 0)
        pdf.text(fmt(totalCost), W - margin - 6, y + 13, { align: 'right' })
        y += 20
      })

      // Summary
      const totalEntries = filteredItems.length
      const totalFaults = filteredItems.reduce((s, it) => s + (it.totalFault || 0), 0)
      const totalCost = filteredItems.reduce((s, it) => s + (it.defects || []).reduce((ss, d) => ss + (Number(d.cost) || 0), 0), 0)
      const repairCount = filteredItems.filter(it => it.decision === 'repair').length
      const replaceCount = filteredItems.filter(it => it.decision === 'replace').length

      y += 10
      pdf.setFillColor(241, 245, 249)
      pdf.rect(margin, y, W - margin * 2, 60, 'F')
      pdf.setDrawColor(226, 232, 240)
      pdf.rect(margin, y, W - margin * 2, 60, 'S')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.setFontSize(10)
      pdfText(pdf, 'TỔNG KẾT', margin + 10, y + 16)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdfText(pdf, `Tổng mục: ${totalEntries}`, margin + 10, y + 32)
      pdfText(pdf, `Tổng lỗi: ${totalFaults}`, margin + 10, y + 46)
      pdfText(pdf, `Sửa chữa: ${repairCount} | Loại bỏ: ${replaceCount}`, margin + 200, y + 32)
      pdfText(pdf, `Tổng chi phí: ${fmt(totalCost)} VND`, margin + 200, y + 46)
      y += 70

      // Footer
      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184)
      pdfText(pdf, 'Hệ thống DetectSteel AI © 2025 — Phát triển bởi Đội ngũ R&D', W / 2, pdf.internal.pageSize.getHeight() - 20, { align: 'center' })
      pdf.save(`detectsteel-history-${filterYear || 'all'}-${filterMonth || 'all'}-${Date.now()}.pdf`)
    } catch (e) {
      alert('Không thể tạo PDF: ' + e.message)
    } finally {
      setDownloadingId(null)
    }
  }

  /* ── parsed items already normalized in loadItems ── */
  const parsed = items

  /* ── Filter items by month/year ── */
  const filteredItems = parsed.filter((it) => {
    const date = new Date(it.ts)
    const itemMonth = (date.getMonth() + 1).toString()
    const itemYear = date.getFullYear().toString()
    const itemDate = date.toISOString().split('T')[0] // YYYY-MM-DD
    const matchMonth = !filterMonth || itemMonth === filterMonth
    const matchYear = !filterYear || itemYear === filterYear
    const matchDate = !filterDate || itemDate === filterDate
    return matchMonth && matchYear && matchDate
  })

  return (
    <section id="history-root" className="min-h-screen bg-[#F6F8FC] px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Lịch sử Phân tích</h2>
            {/* Source badge */}
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${source === 'api'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
              }`}>
              {source === 'api' ? '● API' : '● Local'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter by year */}
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:border-[#1E3A8A] focus:outline-none">
              <option value="">Tất cả năm</option>
              {[...new Set(parsed.map(it => new Date(it.ts).getFullYear()))].sort((a, b) => b - a).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {/* Filter by month */}
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:border-[#1E3A8A] focus:outline-none">
              <option value="">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            {/* Filter by date */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:border-[#1E3A8A] focus:outline-none"
            />
            {/* Download All */}
            <button onClick={handleDownloadAllPDF} disabled={downloadingId === 'all'}
              className="flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60">
              {downloadingId === 'all'
                ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
              Tải toàn bộ PDF
            </button>
            <button onClick={loadItems}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" /></svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h5 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              NHẬT KÝ PHÂN TÍCH CHI TIẾT
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {filteredItems.length} mục {filterYear && `Năm ${filterYear}`}{filterMonth && `, Tháng ${filterMonth}`}{filterDate && `, Ngày ${filterDate}`}{(filterYear || filterMonth || filterDate) ? '' : ''}
              </span>
            </h5>
          </div>

          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '800px' }}>
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 text-left">ID Lô</th>
                  <th className="px-4 py-2.5 text-left">Thời gian</th>
                  <th className="px-4 py-2.5 text-center">Tổng lỗi</th>
                  <th className="px-4 py-2.5 text-center">Lỗi lớn/nhỏ</th>
                  <th className="px-4 py-2.5 text-left">Loại lỗi chính</th>
                  <th className="px-4 py-2.5 text-center">AHP</th>
                  <th className="px-4 py-2.5 text-center">TOPSIS</th>
                  <th className="px-4 py-2.5 text-center">Entropy</th>
                  <th className="px-4 py-2.5 text-center">Tổng hợp C*</th>
                  <th className="px-4 py-2.5 text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && parsed.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-sm text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                          <rect x="9" y="3" width="6" height="4" rx="1" />
                          <path d="M9 12h6M9 16h4" />
                        </svg>
                        Chưa có lịch sử phân tích nào.
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filteredItems.map((it) => {
                  const isRepair = it.decision === 'repair'
                  const isDownloading = downloadingId === it.id
                  return (
                    <tr key={it.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                      {/* ID + thumbnail */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {it.imageData && (
                            <div className="h-9 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                              <img src={it.imageData} alt="" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">#{it.lotCode}</p>
                            {it.imageId && <p className="text-[10px] text-slate-400 truncate max-w-[80px]">{it.imageId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtDate(it.ts)}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-slate-800">{it.totalFault}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{it.majorCount} / {it.minorCount}</td>
                      <td className="px-4 py-2.5 text-slate-700">{it.topDefect}</td>
                      {/* AHP */}
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${it.ahpDecision === 'repair' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                          {it.ahpDecision === 'repair' ? 'SỬA' : 'BỎ'}
                        </span>
                        <p className="mt-0.5 text-[10px] text-slate-400">{it.ahpRepair.toFixed(2)}</p>
                      </td>
                      {/* TOPSIS */}
                      <td className="px-4 py-2.5 text-center">
                        {it.topsisDecision ? (
                          <>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${it.topsisDecision === 'repair' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {it.topsisDecision === 'repair' ? 'SỬA' : 'BỎ'}
                            </span>
                            <p className="mt-0.5 text-[10px] text-slate-400">{it.topsisRepair.toFixed(2)}</p>
                          </>
                        ) : <span className="text-[10px] text-slate-300">—</span>}
                      </td>
                      {/* Entropy */}
                      <td className="px-4 py-2.5 text-center">
                        {it.entropyDecision ? (
                          <>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${it.entropyDecision === 'repair' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                              {it.entropyDecision === 'repair' ? 'SỬA' : 'BỎ'}
                            </span>
                            <p className="mt-0.5 text-[10px] text-slate-400">{it.entropyRepair.toFixed(2)}</p>
                          </>
                        ) : <span className="text-[10px] text-slate-300">—</span>}
                      </td>
                      {/* Aggregated C* */}
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${it.decision === 'repair' ? 'bg-[#1E3A8A] text-white' : 'bg-rose-600 text-white'}`}>
                          {it.decision === 'repair' ? 'SỬA' : 'BỎ'}
                        </span>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-600">C*={it.repairScore.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Xem chi tiết */}
                          <button onClick={() => setModalItem(it)}
                            className="flex items-center gap-1 rounded-md bg-[#1E3A8A] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#172554]">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            Xem
                          </button>
                          {/* Tải PDF */}
                          <button onClick={() => handleDownloadPDF(it)} disabled={isDownloading}
                            className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-[#1E3A8A] hover:text-[#1E3A8A] disabled:opacity-60">
                            {isDownloading
                              ? <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                              : <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                            PDF
                          </button>
                          {/* Xóa */}
                          <button onClick={() => handleDelete(it.id)}
                            className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <p className="pb-2 text-center text-[11px] text-slate-400">
          Hệ thống DetectSteel AI © 2023 &mdash; Phát triển bởi Đội ngũ R&amp;D · Giải pháp kiểm định chất lượng thép thông minh.
        </p>
      </div>

      {/* Detail modal */}
      {modalItem && (
        <DetailModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onDownloadPDF={() => handleDownloadPDF(modalItem)}
          downloading={downloadingId === modalItem.id}
        />
      )}

      {/* Undo toast */}
      {undo && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-sm text-slate-700">Đã xóa mục</span>
          <button onClick={handleUndo}
            className="rounded-lg bg-[#1E3A8A] px-3 py-1 text-xs font-semibold text-white hover:bg-[#172554]">
            Hoàn tác
          </button>
        </div>
      )}
    </section>
  )
}
