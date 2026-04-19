import React, { useState, useEffect } from 'react';

const methods = ['Password', 'OTP', 'Biometric'];
const criteria = ['Security', 'Usability', 'Speed', 'Cost'];
const RI = {1:0.0,2:0.0,3:0.58,4:0.90,5:1.12,6:1.24,7:1.32,8:1.41,9:1.45};

function initMatrix(n){
  const m = Array.from({length:n},()=>Array(n).fill(1));
  // sensible defaults for comparisons (Security > Usability > Speed > Cost)
  if(n===4){
    m[0][1]=3; m[1][0]=1/3;
    m[0][2]=5; m[2][0]=1/5;
    m[0][3]=7; m[3][0]=1/7;
    m[1][2]=3; m[2][1]=1/3;
    m[1][3]=5; m[3][1]=1/5;
    m[2][3]=2; m[3][2]=1/2;
  }
  return m;
}

function computeWeights(mat){
  const n = mat.length;
  const colSums = Array(n).fill(0);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) colSums[j]+=mat[i][j];
  const norm = Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) norm[i][j]=mat[i][j]/colSums[j];
  const weights = Array(n).fill(0);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) weights[i]+=norm[i][j];
  for(let i=0;i<n;i++) weights[i]/=n;
  return weights;
}

function consistencyRatio(mat, weights){
  const n = mat.length;
  const wSum = Array(n).fill(0);
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++) wSum[i]+=mat[i][j]*weights[j];
  }
  let lambdaMax = 0;
  for(let i=0;i<n;i++) lambdaMax += wSum[i]/weights[i];
  lambdaMax /= n;
  const CI = (lambdaMax - n)/(n-1);
  const CR = CI / (RI[n] || 1);
  return {lambdaMax, CI, CR};
}

// sample rating matrix: rows=methods, cols=criteria (1-9 scale, higher is better)
const defaultRatings = [
  [7,6,6,6], // Password
  [6,7,8,6], // OTP
  [9,5,9,5], // Biometric
];

export default function AHPLogin(){
  const n = criteria.length;
  const [matrix, setMatrix] = useState(()=>initMatrix(n));
  const [weights, setWeights] = useState(Array(n).fill(1/n));
  const [cr, setCr] = useState(0);
  const [ratings, setRatings] = useState(defaultRatings);
  const [scores, setScores] = useState([]);
  const [recommended, setRecommended] = useState(methods[0]);
  const [method, setMethod] = useState(recommended);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(()=>{
    const w = computeWeights(matrix);
    setWeights(w);
    const {CR} = consistencyRatio(matrix,w);
    setCr(CR);
    // compute scores
    const sc = ratings.map(row => row.reduce((s,val,i)=>s+val*w[i],0));
    setScores(sc);
    const maxIdx = sc.indexOf(Math.max(...sc));
    setRecommended(methods[maxIdx]);
    if(!method) setMethod(methods[maxIdx]);
  },[matrix, ratings]);

  function updatePair(i,j,value){
    const v = parseFloat(value) || 1;
    const m = matrix.map(r=>r.slice());
    m[i][j]=v; m[j][i]=1/v;
    setMatrix(m);
  }

  function updateRating(methodIdx, critIdx, value){
    const v = Number(value) || 1;
    const r = ratings.map(r=>r.slice());
    r[methodIdx][critIdx]=v;
    setRatings(r);
  }

  function handleLogin(e){
    e.preventDefault();
    // This is a stub: integrate with your auth API
    alert(`Attempt login with method: ${method}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Đăng nhập (AHP hỗ trợ quyết định)</h2>

      <section className="mb-6">
        <h3 className="text-lg font-medium mb-2">Bước 1 — So sánh cặp tiêu chí (Pairwise)</h3>
        <p className="text-sm text-slate-600 mb-3">Điền các giá trị 1-9 (1: ngang hàng, 9: rất quan trọng hơn).</p>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="p-2"></th>
                {criteria.map((c,idx)=> <th key={c} className="p-2 text-left font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {criteria.map((c,i)=> (
                <tr key={c} className="align-top">
                  <td className="p-2 font-medium">{c}</td>
                  {criteria.map((_,j)=> (
                    <td key={j} className="p-2">
                      {i===j ? (
                        <div className="text-slate-500">1</div>
                      ) : (i<j ? (
                        <input type="number" step="0.1" min="0.111" max="9" value={matrix[i][j]} onChange={(e)=>updatePair(i,j,e.target.value)} className="border rounded px-2 py-1 w-24" />
                      ) : (
                        <div className="text-slate-400">{(matrix[i][j]).toFixed(3)}</div>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium">Kết quả AHP</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="p-3 border rounded">
            <div className="text-sm text-slate-700">Trọng số tiêu chí</div>
            <ul className="mt-2">
              {criteria.map((c,i)=> (
                <li key={c} className="flex justify-between py-1 border-b last:border-b-0">
                  <span>{c}</span>
                  <strong>{(weights[i]*100).toFixed(1)}%</strong>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-sm">Consistency Ratio (CR): <span className={`font-medium ${cr>0.1? 'text-red-600':'text-green-600'}`}>{cr.toFixed(3)}</span></div>
            {cr>0.1 && <div className="text-xs text-red-600 mt-1">CR cao — vui lòng kiểm tra lại các so sánh để có kết quả đáng tin cậy.</div>}
          </div>

          <div className="p-3 border rounded">
            <div className="text-sm text-slate-700">Score phương án</div>
            <ul className="mt-2">
              {methods.map((m,idx)=> (
                <li key={m} className="flex justify-between py-1 border-b last:border-b-0">
                  <span>{m}</span>
                  <strong>{scores[idx]?.toFixed(3) ?? '-'}</strong>
                </li>
              ))}
            </ul>
            <div className="mt-3">Khuyến nghị: <span className="font-semibold">{recommended}</span></div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium">Bước 2 — (Tùy chọn) hiệu chỉnh điểm phương án</h3>
        <p className="text-sm text-slate-600 mb-2">Bạn có thể sửa điểm từng phương án theo tiêu chí nếu muốn kết quả khác sát thực tế.</p>
        <div className="space-y-3">
          {methods.map((m,mi)=> (
            <div key={m} className="p-3 border rounded">
              <div className="font-medium mb-2">{m}</div>
              <div className="grid grid-cols-2 gap-2">
                {criteria.map((c,ci)=> (
                  <label key={c} className="text-sm">
                    <div className="text-xs text-slate-600">{c}</div>
                    <input type="range" min="1" max="9" value={ratings[mi][ci]} onChange={(e)=>updateRating(mi,ci,e.target.value)} />
                    <div className="text-sm">{ratings[mi][ci]}</div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium">Bước 3 — Đăng nhập với phương án được khuyến nghị</h3>
        <div className="p-4 border rounded">
          <div className="mb-3">Phương án khuyến nghị: <strong>{recommended}</strong></div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-24 text-sm">Chọn phương án</label>
              <select value={method} onChange={(e)=>setMethod(e.target.value)} className="border rounded px-2 py-1">
                {methods.map(m=> <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {method === 'Password' && (
              <>
                <div>
                  <label className="block text-sm">Tài khoản</label>
                  <input className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="block text-sm">Mật khẩu</label>
                  <input type="password" className="w-full border rounded px-2 py-1" />
                </div>
              </>
            )}

            {method === 'OTP' && (
              <>
                <div>
                  <label className="block text-sm">Số điện thoại hoặc email</label>
                  <input className="w-full border rounded px-2 py-1" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>setOtpSent(true)} className="btn btn-sm btn-primary">Gửi OTP</button>
                  {otpSent && <div className="text-sm text-green-600">OTP đã gửi (xử lý demo)</div>}
                </div>
                <div>
                  <label className="block text-sm">Nhập mã OTP</label>
                  <input className="w-full border rounded px-2 py-1" />
                </div>
              </>
            )}

            {method === 'Biometric' && (
              <div className="text-sm">Chọn 'Bắt đầu' để sử dụng sinh trắc học (demo). Thực tế cần tích hợp SDK hoặc API thiết bị.</div>
            )}

            <div className="pt-2">
              <button type="submit" className="btn btn-primary">Đăng nhập</button>
            </div>
          </form>
        </div>
      </section>

      <div className="text-xs text-slate-500">Ghi chú: AHP giúp xác định phương án đăng nhập phù hợp dựa trên tiêu chí; kiểm tra Consistency Ratio (CR) để đảm bảo các so sánh đáng tin cậy.</div>
    </div>
  );
}
