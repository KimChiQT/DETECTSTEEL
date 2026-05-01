import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

/**
 * Gauge Chart Component for Consistency Ratio
 */
const ConsistencyRatioGauge = ({ cr = 0.04 }) => {
  // Gauge data: 0-0.1 scale
  const percentage = Math.min(cr / 0.1, 1) * 100
  const data = [
    { name: 'CR', value: percentage },
    { name: 'Remaining', value: 100 - percentage }
  ]
  
  const COLORS = ['#10b981', '#e5e7eb']
  
  // Determine color based on CR value
  const getColor = (cr) => {
    if (cr <= 0.05) return '#10b981' // Green - Good
    if (cr <= 0.08) return '#f59e0b' // Yellow - Warning
    return '#ef4444' // Red - Bad
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={40}
              outerRadius={60}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={getColor(cr)} />
              <Cell fill={COLORS[1]} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* CR Value in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-emerald-600">{cr.toFixed(2)}</p>
          <p className="text-xs text-slate-500">CR = {cr.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <p className="text-sm font-bold text-slate-800">Consistency Ratio (CR)</p>
        <p className="text-xs text-slate-500">
          {cr <= 0.05 ? '✓ Acceptable' : cr <= 0.08 ? '⚠ Warning' : '✗ Unacceptable'}
        </p>
      </div>
    </div>
  )
}

/**
 * Flaw Attributes Table
 */
const FlawAttributesTable = ({ attributes }) => {
  const rows = [
    { label: 'Logi lỗi', value: attributes.logiFault || 0, unit: '' },
    { label: 'Time', value: attributes.time || 0, unit: '' },
    { label: 'Flaw Area', value: attributes.flawArea || 0, unit: '' },
    { label: 'Defect Shape', value: attributes.defectShape || 0, unit: '' },
    { label: 'Quality', value: attributes.quality || 0, unit: '' },
  ]

  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-4 text-left font-medium text-slate-700">
                {row.label}
              </td>
              <td className="py-2 text-right font-bold text-slate-900">
                {typeof row.value === 'number' ? row.value.toFixed(2) : row.value}
                {row.unit && <span className="ml-1 text-xs text-slate-500">{row.unit}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Main Flaw Attributes Panel Component
 */
export default function FlawAttributesPanel({ defects = [], summary = {} }) {
  // Calculate attributes from defects
  const calculateAttributes = () => {
    if (defects.length === 0) {
      return {
        logiFault: 0,
        time: 0,
        flawArea: 0,
        defectShape: 0,
        quality: 0,
        cr: 0.04 // Default CR
      }
    }

    // Logi lỗi: Average confidence
    const logiFault = defects.reduce((sum, d) => sum + (d.confidence || 0), 0) / defects.length / 100

    // Time: Average time (parse from string like "~5-10 phút")
    const parseTime = (str) => {
      const match = String(str || '').match(/~(\d+)-(\d+)/)
      if (match) return (Number(match[1]) + Number(match[2])) / 2
      return 0
    }
    const avgTime = defects.reduce((sum, d) => sum + parseTime(d.time), 0) / defects.length
    const time = Math.min(avgTime / 60, 1) // Normalize to 0-1 (assuming max 60 minutes)

    // Flaw Area: Average area ratio
    const flawArea = defects.reduce((sum, d) => sum + ((d.w * d.h) / 10000), 0) / defects.length

    // Defect Shape: Based on aspect ratio variance
    const aspectRatios = defects.map(d => d.w / (d.h || 1))
    const avgAspect = aspectRatios.reduce((a, b) => a + b, 0) / aspectRatios.length
    const variance = aspectRatios.reduce((sum, r) => sum + Math.pow(r - avgAspect, 2), 0) / aspectRatios.length
    const defectShape = Math.min(variance / 2, 1) // Normalize

    // Quality: Inverse of major defects ratio
    const majorCount = defects.filter(d => d.major).length
    const quality = 1 - (majorCount / defects.length)

    // CR: Consistency Ratio (simplified calculation)
    // In real AHP, CR = CI / RI, where CI = (λmax - n) / (n - 1)
    // For simplicity, we use a heuristic based on variance
    const values = [logiFault, time, flawArea, defectShape, quality]
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)
    const cr = Math.min(stdDev / 2, 0.1) // Normalize to 0-0.1

    return {
      logiFault,
      time,
      flawArea,
      defectShape,
      quality,
      cr
    }
  }

  const attributes = calculateAttributes()

  if (defects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-800">AI-W scanned flaw attributes</h3>
        <p className="py-6 text-center text-sm text-slate-400">
          Chưa có dữ liệu phân tích
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-slate-800">
        AI-W scanned flaw attributes
      </h3>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Attributes Table */}
        <div>
          <FlawAttributesTable attributes={attributes} />
        </div>

        {/* Right: Consistency Ratio Gauge */}
        <div className="flex items-center justify-center">
          <ConsistencyRatioGauge cr={attributes.cr} />
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold">Giải thích:</p>
        <ul className="ml-4 mt-1 list-disc space-y-1">
          <li><strong>Logi lỗi:</strong> Mức độ tin cậy trung bình của các lỗi phát hiện</li>
          <li><strong>Time:</strong> Thời gian sửa chữa ước tính (chuẩn hóa)</li>
          <li><strong>Flaw Area:</strong> Diện tích lỗi trung bình so với tổng diện tích</li>
          <li><strong>Defect Shape:</strong> Độ biến thiên hình dạng lỗi</li>
          <li><strong>Quality:</strong> Chất lượng tổng thể (1 - tỷ lệ lỗi nghiêm trọng)</li>
          <li><strong>CR &lt; 0.1:</strong> Độ nhất quán của đánh giá (càng thấp càng tốt)</li>
        </ul>
      </div>
    </div>
  )
}
