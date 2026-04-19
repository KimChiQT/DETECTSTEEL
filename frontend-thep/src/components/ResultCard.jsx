import React from 'react'

export default function ResultCard({ repairScore, replaceScore, decision }){
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h4 className="font-semibold mb-2">Lời khuyên</h4>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-slate-500">Score sửa</div>
          <div className="text-2xl font-bold text-emerald-600">{(repairScore*100).toFixed(3)}</div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-500">Score bỏ</div>
          <div className="text-2xl font-bold text-rose-600">{(replaceScore*100).toFixed(3)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className={`mt-1 text-2xl font-black ${decision==='repair'? 'text-emerald-700':'text-rose-700'}`}>
          {decision==='repair'? 'NÊN SỬA CHỮA' : 'NÊN LOẠI BỎ'}
        </div>
        <div className="text-sm text-slate-500">
          Score Sửa: {repairScore.toFixed(3)} - Score Bỏ: {replaceScore.toFixed(3)}
        </div>
      </div>
    </div>
  )
}
