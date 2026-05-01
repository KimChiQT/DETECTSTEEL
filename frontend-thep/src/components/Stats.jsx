import React, { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import { jsPDF } from 'jspdf'

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6]
const DEFECT_COLORS = ['#1E3A8A', '#B4492D', '#3B82F6', '#EAB308', '#0EA5E9', '#7C3AED']
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function fmtDate(ts) {
  return new Date(ts).toLocaleString('vi-VN')
}

function parseHistoryItem(raw, idx) {
  const rawDefects = Array.isArray(raw.faults) ? raw.faults : (Array.isArray(raw.defects) ? raw.defects : [])
  const defects = rawDefects.map((f) => ({
    ...f,
    label: f.label || f.name || f.id || '-',
  }))
  const majorCount = defects.filter((d) => d.major).length
  const minorCount = Math.max(0, defects.length - majorCount)
  const topDefect = defects[0]?.label || '-'
  const mcdm = raw.mcdm || null
  return {
    id: raw.id || `${String(idx + 1).padStart(3, '0')}`,
    lotCode: String(idx + 1).padStart(3, '0'),
    imageId: raw.imageId || raw.filename || null,
    imageData: raw.imageData || raw.image_base64 || null,
    ts: raw.ts || (raw.timestamp ? new Date(raw.timestamp).getTime() : Date.now() - idx * 3600 * 1000),
    fileCount: raw.fileCount || 1,
    defects,
    totalFault: defects.length,
    majorCount,
    minorCount,
    topDefect,
    repairScore: Number(raw.repairScore || 0),
    replaceScore: Number(raw.replaceScore || 0),
    decision: raw.decision || 'repair',
    // MCDM per-method scores
    ahpRepair:      Number(mcdm?.ahp?.repair_score      ?? raw.repairScore ?? 0),
    ahpReplace:     Number(mcdm?.ahp?.replace_score     ?? raw.replaceScore ?? 0),
    topsisRepair:   Number(mcdm?.topsis?.repair_score   ?? 0),
    topsisReplace:  Number(mcdm?.topsis?.replace_score  ?? 0),
    entropyRepair:  Number(mcdm?.entropy?.repair_score  ?? 0),
    entropyReplace: Number(mcdm?.entropy?.replace_score ?? 0),
    ahpDecision:     mcdm?.ahp?.decision     ?? raw.decision ?? 'repair',
    topsisDecision:  mcdm?.topsis?.decision  ?? null,
    entropyDecision: mcdm?.entropy?.decision ?? null,
  }
}

/* ── KPI card ─────────────────────────────────────────────── */
function KpiCard({ kpis }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h5 className="mb-3 text-sm font-bold text-slate-800">Tổng quan Chỉ số</h5>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="pr-3">
          <p className="text-[11px] leading-snug text-slate-500">Tổng số Lô đã phân tích</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{kpis.analyzedLots}</p>
        </div>
        <div className="px-3">
          <p className="text-[11px] leading-snug text-slate-500">Tỷ lệ Lỗi trung bình (Lô)</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{kpis.avgRate.toFixed(1)}%</p>
        </div>
        <div className="pl-3">
          <p className="text-[11px] leading-snug text-slate-500">Tỷ lệ Sửa chữa vs. Loại bỏ</p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {kpis.repairPct.toFixed(0)}% / {kpis.replacePct.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Donut card ───────────────────────────────────────────── */
function DonutCard({ pieData }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h5 className="mb-3 text-sm font-bold text-slate-800">Phân loại Loại lỗi chính</h5>
      <div className="flex items-center justify-center" style={{ height: 220 }}>
        <Doughnut
          data={pieData}
          options={{
            cutout: '60%',
            plugins: {
              legend: {
                position: 'right',
                labels: { boxWidth: 10, font: { size: 11, weight: '600' }, padding: 10 },
              },
              tooltip: { bodyFont: { size: 11 } },
            },
          }}
        />
      </div>
    </div>
  )
}

/* ── Trend chart card ─────────────────────────────────────── */
function TrendCard({ trendData }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h5 className="text-sm font-bold text-slate-800">Xu hướng Số lỗi theo Thời gian</h5>
      <p className="mb-3 text-[11px] text-slate-500">Số lỗi phát hiện theo từng tháng</p>
      <div style={{ height: 280 }}>
        <Line
          data={trendData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { stepSize: 5, font: { size: 11 } },
                title: { display: true, text: 'Số lỗi/tuần', font: { size: 10 }, color: '#94a3b8' },
              },
            },
            plugins: {
              legend: {
                position: 'top',
                labels: { boxWidth: 24, font: { size: 11, weight: '600' }, padding: 12 },
              },
              tooltip: { titleFont: { size: 12, weight: '700' }, bodyFont: { size: 11 } },
            },
            elements: { point: { radius: 3 }, line: { borderWidth: 2.5 } },
          }}
        />
      </div>
    </div>
  )
}

/* ── Bỏ dấu tiếng Việt để dùng với font helvetica của jsPDF ── */
function removeDiacritics(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
}
const pdfText = (pdf, text, ...args) => pdf.text(removeDiacritics(text), ...args)

/* ── PDF generator — vẽ trực tiếp bằng jsPDF, không dùng html2canvas ── */
async function generateStatsPDF(items, year, months, selectedDay) {
  const fmtVND = (n) => Number(n || 0).toLocaleString('vi-VN')
  const fmtPct = (n) => ((Number(n) || 0) * 100).toFixed(1) + '%'

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()   // 595
  const margin = 40
  let y = margin

  // ── Header bar ──────────────────────────────────────────
  pdf.setFillColor(30, 58, 138)
  pdf.rect(margin, y, W - margin * 2, 36, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdfText(pdf, 'DetectSteel — Báo Cáo Tổng Hợp Nhật Ký Phân Tích', margin + 10, y + 24)
  y += 50

  // ── Meta info ───────────────────────────────────────────
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const monthStr = months.length === MONTH_OPTIONS.length ? 'Tất cả' : months.map(m => `Tháng ${m}`).join(', ')
  const dayStr = selectedDay ? `Ngày ${selectedDay}` : 'Tất cả ngày'
  pdfText(pdf, `Năm: ${year}`, margin, y)
  pdfText(pdf, `Tháng: ${monthStr}`, margin + 200, y)
  pdfText(pdf, `Ngày: ${dayStr}`, margin + 400, y)
  y += 18
  pdfText(pdf, `Tổng số lô: ${items.length}`, margin, y)
  y += 18

  // ── Divider ─────────────────────────────────────────────
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, W - margin, y)
  y += 14

  // ── Summary stats ───────────────────────────────────────
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  pdfText(pdf, 'Tóm Tắt Thống Kê', margin, y)
  y += 20

  const totalFaults = items.reduce((s, it) => s + it.totalFault, 0)
  const totalCost = items.reduce((s, it) => s + it.defects.reduce((c, d) => c + (Number(d.cost) || 0), 0), 0)
  const repairCount = items.filter(it => it.decision === 'repair').length
  const replaceCount = items.filter(it => it.decision === 'replace').length

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(51, 65, 85)
  pdfText(pdf, `Tổng số lỗi phát hiện: ${totalFaults}`, margin, y)
  y += 14
  pdfText(pdf, `Tổng chi phí ước tính: ${fmtVND(totalCost)} VND`, margin, y)
  y += 14
  pdfText(pdf, `Số lô khuyên sửa chữa: ${repairCount}`, margin, y)
  y += 14
  pdfText(pdf, `Số lô khuyên loại bỏ: ${replaceCount}`, margin, y)
  y += 24

  // ── Table header ────────────────────────────────────────
  pdf.setFillColor(248, 250, 252)
  pdf.rect(margin, y, W - margin * 2, 20, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.rect(margin, y, W - margin * 2, 20, 'S')

  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdfText(pdf, 'ID Lo', margin + 6, y + 13)
  pdfText(pdf, 'Thoi gian', margin + 70, y + 13)
  pdfText(pdf, 'Tong loi', margin + 180, y + 13)
  pdfText(pdf, 'Loi lon/nho', margin + 240, y + 13)
  pdfText(pdf, 'AHP', margin + 310, y + 13)
  pdfText(pdf, 'TOPSIS', margin + 365, y + 13)
  pdfText(pdf, 'Entropy', margin + 420, y + 13)
  pdfText(pdf, 'C* Tong hop', margin + 475, y + 13)
  y += 20

  // ── Table rows ──────────────────────────────────────────
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  items.forEach((it, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
    pdf.setFillColor(...rowBg)
    pdf.rect(margin, y, W - margin * 2, 18, 'F')
    pdf.setDrawColor(241, 245, 249)
    pdf.line(margin, y + 18, W - margin, y + 18)

    pdf.setTextColor(51, 65, 85)
    pdfText(pdf, `#${it.lotCode}`, margin + 6, y + 12)
    pdfText(pdf, new Date(it.ts).toLocaleString('vi-VN'), margin + 70, y + 12)
    pdfText(pdf, String(it.totalFault), margin + 180, y + 12)
    pdfText(pdf, `${it.majorCount}/${it.minorCount}`, margin + 240, y + 12)

    const ahpD = it.ahpDecision || it.decision
    pdf.setTextColor(...(ahpD === 'repair' ? [5, 150, 105] : [220, 38, 38]))
    pdfText(pdf, ahpD === 'repair' ? 'Sua' : 'Bo', margin + 310, y + 12)

    const topD = it.topsisDecision
    pdf.setTextColor(topD ? (topD === 'repair' ? 5 : 220) : 148, topD ? (topD === 'repair' ? 150 : 38) : 163, topD ? (topD === 'repair' ? 105 : 38) : 184)
    pdfText(pdf, topD ? (topD === 'repair' ? 'Sua' : 'Bo') : '-', margin + 365, y + 12)

    const entD = it.entropyDecision
    pdf.setTextColor(entD ? (entD === 'repair' ? 5 : 220) : 148, entD ? (entD === 'repair' ? 150 : 38) : 163, entD ? (entD === 'repair' ? 105 : 38) : 184)
    pdfText(pdf, entD ? (entD === 'repair' ? 'Sua' : 'Bo') : '-', margin + 420, y + 12)

    pdf.setTextColor(...(it.decision === 'repair' ? [30, 58, 138] : [220, 38, 38]))
    pdf.setFont('helvetica', 'bold')
    pdfText(pdf, `${it.decision === 'repair' ? 'SUA' : 'BO'} ${Number(it.repairScore || 0).toFixed(2)}`, margin + 475, y + 12)
    pdf.setFont('helvetica', 'normal')

    y += 18
    if (y > pdf.internal.pageSize.getHeight() - 60) {
      pdf.addPage()
      y = margin
    }
  })

  // ── Footer ──────────────────────────────────────────────
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(148, 163, 184)
  pdfText(pdf,
    'Hệ thống DetectSteel AI © 2025 — Phát triển bởi Đội ngũ R&D',
    W / 2,
    pdf.internal.pageSize.getHeight() - 20,
    { align: 'center' }
  )

  pdf.save(`detectsteel-stats-${year}-${months.join('-')}${selectedDay ? `-day${selectedDay}` : ''}.pdf`)
}

async function generateAndDownloadPDF(it) {
  const fmtVND = (n) => Number(n || 0).toLocaleString('vi-VN')
  const fmtPct = (n) => ((Number(n) || 0) * 100).toFixed(1) + '%'

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()   // 595
  const margin = 40
  let y = margin

  // ── Header bar ──────────────────────────────────────────
  pdf.setFillColor(30, 58, 138)
  pdf.rect(margin, y, W - margin * 2, 36, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdfText(pdf, 'DetectSteel — Báo cáo Phân tích', margin + 10, y + 24)
  y += 50

  // ── Meta info ───────────────────────────────────────────
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const dateStr = new Date(it.ts).toLocaleString('vi-VN')
  const lotStr = it.imageId || `Lô #${it.lotCode || it.id}`
  pdfText(pdf, `Thời gian: ${dateStr}`, margin, y)
  pdfText(pdf, `Lô: ${lotStr}`, margin + 260, y)
  y += 18

  // ── Divider ─────────────────────────────────────────────
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, W - margin, y)
  y += 14

  // ── Annotated image (if available) ──────────────────────
  if (it.imageData) {
    try {
      const imgW = W - margin * 2
      const imgH = 200
      const format = it.imageData.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      pdf.addImage(it.imageData, format, margin, y, imgW, imgH)
      y += imgH + 14
    } catch (e) {
      // skip image if it fails
    }
  }

  // ── Defect table header ──────────────────────────────────
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

  // ── Defect rows ─────────────────────────────────────────
  const defects = it.defects || []
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  if (defects.length === 0) {
    pdf.setTextColor(148, 163, 184)
    pdfText(pdf, 'Không phát hiện lỗi.', margin + 6, y + 13)
    y += 22
  } else {
    defects.forEach((d, i) => {
      const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      pdf.setFillColor(...rowBg)
      pdf.rect(margin, y, W - margin * 2, 20, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 20, W - margin, y + 20)

      pdf.setTextColor(51, 65, 85)
      pdfText(pdf, String(d.label || d.name || '-'), margin + 6, y + 13)
      pdf.text(fmtPct(d.confidence), margin + 240, y + 13)
      pdf.text(fmtVND(d.cost), W - margin - 6, y + 13, { align: 'right' })
      y += 20
    })
  }

  // ── Total cost ──────────────────────────────────────────
  const totalCost = defects.reduce((s, d) => s + (Number(d.cost) || 0), 0)
  if (totalCost > 0) {
    pdf.setFillColor(241, 245, 249)
    pdf.rect(margin, y, W - margin * 2, 20, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdfText(pdf, 'Tổng chi phí:', margin + 6, y + 13)
    pdf.text(fmtVND(totalCost) + ' VND', W - margin - 6, y + 13, { align: 'right' })
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

  pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, 'KET QUA MCDM (AHP + TOPSIS + Entropy)', margin + 10, y + 14)

  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(71, 85, 105)
  pdfText(pdf, 'AHP (Chuyen gia)', margin + 10, y + 30)
  pdfText(pdf, 'TOPSIS (So sanh)', margin + 175, y + 30)
  pdfText(pdf, 'Entropy (Du lieu)', margin + 340, y + 30)

  const ahpD = it.ahpDecision || it.decision
  const topD = it.topsisDecision || null
  const entD = it.entropyDecision || null

  pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
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

  pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.4)
  pdf.line(margin + 6, y + 62, margin + W - margin * 2 - 6, y + 62)

  pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, 'TONG HOP (C*) =', margin + 10, y + 76)
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...(isRepair ? [5, 150, 105] : [220, 38, 38]))
  pdfText(pdf, isRepair ? 'NEN SUA CHUA' : 'NEN LOAI BO', margin + 110, y + 76)
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139)
  pdfText(pdf, `C* = ${Number(it.repairScore || 0).toFixed(3)}  |  Score Bo: ${Number(it.replaceScore || 0).toFixed(3)}`, margin + 10, y + 90)

  y += boxH + 14

  // ── Footer ──────────────────────────────────────────────
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(148, 163, 184)
  pdfText(pdf,
    'Hệ thống DetectSteel AI © 2025 — Phát triển bởi Đội ngũ R&D',
    W / 2,
    pdf.internal.pageSize.getHeight() - 20,
    { align: 'center' }
  )

  pdf.save(`detectsteel-report-${it.id || Date.now()}.pdf`)
}

/* ── Detail modal ─────────────────────────────────────────── */
function DetailModal({ item, onClose, onDownloadPDF, downloading }) {
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')
  const isRepair = item.decision === 'repair'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chi tiết phân tích</h3>
            <p className="text-xs text-slate-500">{item.imageId || `Lô #${item.lotCode}`} · {new Date(item.ts).toLocaleString('vi-VN')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60"
            >
              {downloading ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              )}
              Tải PDF
            </button>
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Đóng</button>
          </div>
        </div>

        <div className="p-6">
          {/* Image */}
          {item.imageData && (
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-black">
              <img src={item.imageData} alt="result" className="max-h-64 w-full object-contain" />
            </div>
          )}

          {/* Defect table */}
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2 text-left">Loại lỗi</th>
                <th className="py-2 text-center">Độ tin cậy</th>
                <th className="py-2 text-right">Chi phí (VND)</th>
              </tr>
            </thead>
            <tbody>
              {(item.defects || []).length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400">Không có lỗi</td></tr>
              )}
              {(item.defects || []).map((d, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium text-slate-700">{d.label || d.name}</td>
                  <td className="py-2 text-center text-slate-600">{((d.confidence || 0) * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right font-semibold">{fmt(d.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* MCDM result */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">KẾT QUẢ MCDM</p>
            {/* 3 methods */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                { label: 'AHP', decision: item.ahpDecision || item.decision, repair: item.ahpRepair ?? item.repairScore, replace: item.ahpReplace ?? item.replaceScore },
                { label: 'TOPSIS', decision: item.topsisDecision, repair: item.topsisRepair, replace: item.topsisReplace },
                { label: 'Entropy', decision: item.entropyDecision, repair: item.entropyRepair, replace: item.entropyReplace },
              ].map(({ label, decision, repair, replace }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-2 text-center">
                  <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">{label}</p>
                  {decision ? (
                    <>
                      <p className={`text-xs font-black ${decision === 'repair' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {decision === 'repair' ? 'SỬA CHỮA' : 'LOẠI BỎ'}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {Number(repair || 0).toFixed(3)} / {Number(replace || 0).toFixed(3)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-300">Chưa có dữ liệu</p>
                  )}
                </div>
              ))}
            </div>
            {/* Aggregated */}
            <div className={`rounded-lg px-3 py-2 ${isRepair ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <p className="text-[10px] font-bold uppercase text-slate-500">Tổng hợp C*</p>
              <p className={`text-base font-black ${isRepair ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isRepair ? 'NÊN SỬA CHỮA' : 'NÊN LOẠI BỎ'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                C* = {Number(item.repairScore || 0).toFixed(3)} — Score Bỏ: {Number(item.replaceScore || 0).toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Log table ────────────────────────────────────────────── */
function LogTable({ rows, onViewPDF, onReanalyze, downloadingId }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h5 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          NHẬT KÝ LÔ PHÂN TÍCH CHI TIẾT
        </h5>
      </div>
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '230px' }}>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 text-left">ID Lô</th>
              <th className="px-4 py-2.5 text-left">Thời gian</th>
              <th className="px-4 py-2.5 text-center">Số tệp</th>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-sm text-slate-400">
                  Chưa có dữ liệu lịch sử để thống kê.
                </td>
              </tr>
            )}
            {rows.map((it) => {
              const isRepair = it.decision === 'repair'
              const isDownloading = downloadingId === it.id
              return (
                <tr key={it.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    #{it.lotCode}
                    {it.imageId && (
                      <div className="text-[10px] font-normal text-slate-400">{it.imageId}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{fmtDate(it.ts)}</td>
                  <td className="px-4 py-2.5 text-center">{it.fileCount}</td>
                  <td className="px-4 py-2.5 text-center font-semibold">{it.totalFault}</td>
                  <td className="px-4 py-2.5 text-center">{it.majorCount} / {it.minorCount}</td>
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
                      {/* Xem chi tiết PDF */}
                      <button
                        onClick={() => onViewPDF(it)}
                        disabled={isDownloading}
                        className="flex items-center gap-1 rounded-md bg-[#1E3A8A] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                        ) : (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        )}
                        Xem chi tiết PDF
                      </button>
                      {/* Phân tích lại */}
                      <button
                        onClick={() => onReanalyze(it)}
                        className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" /></svg>
                        Phân tích lại
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
  )
}

/* ── How It Works strip ───────────────────────────────────── */
function HowItWorksStrip() {
  const steps = [
    {
      icon: '📷',
      title: 'Tải lên Lô Ảnh Thép',
      desc: 'Tải lên lô ảnh thép, hỗ trợ nhiều ảnh cùng lúc.',
    },
    {
      icon: '🤖',
      title: 'AI Phân Tích Lỗi',
      desc: 'AI phát hiện và phân loại lỗi bề mặt thép tự động.',
    },
    {
      icon: '💡',
      title: 'Phân tích Lịch sử Chuyên sâu',
      desc: 'Đưa ra gợi ý Sửa chữa hay Loại bỏ dựa trên đa tiêu chí.',
    },
    {
      icon: '📄',
      title: 'Tạo Báo cáo Xu hướng PDF',
      desc: 'Tạo và xuất kết quả chi tiết dạng PDF chuyên nghiệp.',
    },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex min-w-[110px] flex-1 flex-col items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl shadow-sm">
                {s.icon}
              </div>
              <p className="text-xs font-semibold text-slate-800">{s.title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="mt-5 hidden text-slate-300 md:block text-lg">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Stats({ onReanalyze }) {
  const [items, setItems] = useState([])
  const [months, setMonths] = useState(MONTH_OPTIONS)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState(null) // null means all days
  const [modalItem, setModalItem] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [loading, setLoading] = useState(true)

  /* ── Load from API, fallback localStorage ── */
  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/history`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const apiItems = (data.items || []).map(parseHistoryItem)
      if (apiItems.length > 0) {
        setItems(apiItems)
      } else {
        loadFromLocal()
      }
    } catch {
      loadFromLocal()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem('detectsteel_history')
      const data = raw ? JSON.parse(raw) : []
      setItems(data.map(parseHistoryItem))
    } catch (e) {
      console.error(e)
      setItems([])
    }
  }

  useEffect(() => { loadItems() }, [])

  const filtered = useMemo(() => {
    if (items.length === 0) return []
    return items.filter((it) => {
      const date = new Date(it.ts)
      const matchesMonth = months.includes(date.getMonth() + 1)
      const matchesYear = date.getFullYear() === selectedYear
      const matchesDay = selectedDay === null || date.getDate() === selectedDay
      return matchesMonth && matchesYear && matchesDay
    })
  }, [items, months, selectedYear, selectedDay])

  const kpis = useMemo(() => {
    const analyzedLots = filtered.length
    const totalFault = filtered.reduce((acc, it) => acc + it.totalFault, 0)
    const totalSlots = Math.max(1, analyzedLots * 4)
    const avgRate = (totalFault / totalSlots) * 100
    const repairWins = filtered.filter((it) => it.decision === 'repair').length
    const replaceWins = filtered.filter((it) => it.decision === 'replace').length
    const allDecisions = Math.max(1, repairWins + replaceWins)
    return {
      analyzedLots,
      avgRate,
      repairPct: (repairWins / allDecisions) * 100,
      replacePct: (replaceWins / allDecisions) * 100,
    }
  }, [filtered])

  const trendData = useMemo(() => {
    const labels = MONTH_OPTIONS.map((m) => `Tháng ${m}`)
    const all = MONTH_OPTIONS.map((m) =>
      filtered
        .filter((it) => new Date(it.ts).getMonth() + 1 === m)
        .reduce((acc, it) => acc + it.totalFault, 0)
    )
    const scratches = MONTH_OPTIONS.map((m) =>
      filtered
        .filter((it) => new Date(it.ts).getMonth() + 1 === m)
        .reduce(
          (acc, it) => acc + it.defects.filter((d) => /scratch|xước/i.test(d.label || '')).length,
          0
        )
    )
    const dents = MONTH_OPTIONS.map((m) =>
      filtered
        .filter((it) => new Date(it.ts).getMonth() + 1 === m)
        .reduce(
          (acc, it) => acc + it.defects.filter((d) => /dent|lõm|pitted/i.test(d.label || '')).length,
          0
        )
    )
    const pinholes = MONTH_OPTIONS.map((m) =>
      filtered
        .filter((it) => new Date(it.ts).getMonth() + 1 === m)
        .reduce(
          (acc, it) => acc + it.defects.filter((d) => /pinhole|lỗ/i.test(d.label || '')).length,
          0
        )
    )

    return {
      labels,
      datasets: [
        { label: 'Tổng số lỗi', data: all, borderColor: '#111827', backgroundColor: '#111827', tension: 0.35 },
        { label: 'Scratches', data: scratches, borderColor: '#B4492D', backgroundColor: '#B4492D', tension: 0.35 },
        { label: 'Dents', data: dents, borderColor: '#2563EB', backgroundColor: '#2563EB', tension: 0.35 },
        { label: 'Pinholes', data: pinholes, borderColor: '#EAB308', backgroundColor: '#EAB308', tension: 0.35 },
      ],
    }
  }, [filtered])

  const pieData = useMemo(() => {
    const map = new Map()
    filtered.forEach((it) => {
      it.defects.forEach((d) => {
        const key = d.label || 'Khác'
        map.set(key, (map.get(key) || 0) + 1)
      })
    })
    const labels = [...map.keys()]
    const values = [...map.values()]
    return {
      labels: labels.length ? labels : ['Chưa có dữ liệu'],
      datasets: [
        {
          data: values.length ? values : [1],
          backgroundColor: DEFECT_COLORS,
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    }
  }, [filtered])

  const toggleMonth = (m) =>
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))

  /* ── Xem chi tiết PDF: mở modal + tải PDF ── */
  const handleViewPDF = async (it) => {
    // Mở modal trước
    setModalItem(it)
  }

  /* ── Tải PDF từ modal hoặc trực tiếp ── */
  const handleDownloadPDF = async (it) => {
    setDownloadingId(it.id)
    try {
      await generateAndDownloadPDF(it)
    } catch (e) {
      console.error('PDF error:', e)
      alert('Không thể tạo PDF: ' + e.message)
    } finally {
      setDownloadingId(null)
    }
  }

  /* ── Phân tích lại: chuyển sang trang Batch ── */
  const handleReanalyze = (it) => {
    if (onReanalyze) onReanalyze(it)
  }

  /* ── Tải báo cáo tổng hợp ── */
  const handleDownloadStatsPDF = async () => {
    if (filtered.length === 0) return
    setDownloadingId('stats')
    try {
      await generateStatsPDF(filtered, selectedYear, months, selectedDay)
    } catch (e) {
      console.error('Stats PDF error:', e)
      alert('Không thể tạo báo cáo tổng hợp: ' + e.message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <section id="stats-root" className="min-h-screen bg-[#F6F8FC] px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-[1400px] space-y-4">

          {/* Page title */}
          <h2 className="text-xl font-extrabold text-slate-900">
            Hồ sơ Lịch sử và Đồ thị Phân tích (Analytics &amp; History)
          </h2>

          {/* Date range filter */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-semibold text-slate-500">Date range:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  Năm {year}
                </option>
              ))}
            </select>
            <select
              value={selectedDay || ''}
              onChange={(e) => setSelectedDay(e.target.value ? Number(e.target.value) : null)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
            >
              <option value="">Tất cả ngày</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Ngày {day}
                </option>
              ))}
            </select>
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => toggleMonth(m)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${months.includes(m)
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Tháng {m}
              </button>
            ))}
          </div>

          {/* Row 1: KPI + Donut | Trend chart */}
          <div className="grid grid-cols-12 gap-4">
            {/* Left column */}
            <div className="col-span-12 space-y-4 lg:col-span-4">
              <KpiCard kpis={kpis} />
              <DonutCard pieData={pieData} />
            </div>

            {/* Right column – trend */}
            <div className="col-span-12 lg:col-span-8">
              <TrendCard trendData={trendData} />
            </div>
          </div>

          {/* Row 2: Log table */}
          <LogTable
            rows={filtered}
            onViewPDF={handleViewPDF}
            onReanalyze={handleReanalyze}
            downloadingId={downloadingId}
          />

          {/* Row 3: Download summary report */}
          <div className="flex justify-center">
            <button
              onClick={handleDownloadStatsPDF}
              disabled={filtered.length === 0 || downloadingId === 'stats'}
              className="flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloadingId === 'stats' ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              Tải Báo Cáo Tổng Hợp Nhật Ký Lô Phân Tích Chi Tiết ({filtered.length} lô)
            </button>
          </div>

          {/* Row 4: How It Works */}
          <HowItWorksStrip />

          {/* Footer */}
          <p className="pb-2 text-center text-[11px] text-slate-400">
            Hệ thống DetectSteel AI © 2023 &mdash; Phát triển bởi Đội ngũ R&amp;D · Giải pháp kiểm định chất lượng thép thông minh.
          </p>
        </div>
      </section>

      {/* Detail modal */}
      {modalItem && (
        <DetailModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onDownloadPDF={() => handleDownloadPDF(modalItem)}
          downloading={downloadingId === modalItem.id}
        />
      )}
    </>
  )
}
