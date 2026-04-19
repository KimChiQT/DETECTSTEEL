import React, { useState } from 'react';

const SteelDefectDashboard = () => {
  // Giả lập dữ liệu nhận diện từ AI
  const [results, setResults] = useState([
    {
      id: 1,
      imageUrl: 'https://via.placeholder.com/400x300',
      defects: [
        { id: 'D01', type: 'Vết nứt', x: 20, y: 30, w: 100, h: 50, confidence: 0.95 },
        { id: 'D02', type: 'Rỗ bề mặt', x: 150, y: 120, w: 40, h: 40, confidence: 0.88 }
      ],
      processSpeed: '1.2s'
    },
    {
      id: 2,
      imageUrl: 'https://via.placeholder.com/400x300',
      defects: [
        { id: 'D03', type: 'Trầy xước', x: 80, y: 50, w: 120, h: 20, confidence: 0.92 }
      ],
      processSpeed: '0.9s'
    }
  ]);

  return (
    <div className="p-8 bg-base-200 min-h-screen font-sans">
      {/* Header - Chữ to & rõ ràng theo yêu cầu */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Hệ Thống Kiểm Tra Bề Mặt Thép</h1>
        <p className="text-xl opacity-70">Phân tích đa ảnh & Thống kê chi tiết chi phí sửa chữa</p>
      </header>

      {/* Grid hiển thị nhiều ảnh (2-3 ảnh/lần) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {results.map((res) => (
          <div key={res.id} className="card bg-base-100 shadow-xl overflow-hidden border border-base-300">
            <figure className="relative">
              {/* Ảnh thu nhỏ lại để cân đối */}
              <img src={res.imageUrl} alt="Steel Surface" className="w-full h-64 object-cover" />
              
              {/* Khoanh vùng lỗi: Chỉ dùng border, không tô màu vùng lỗi */}
              {res.defects.map((defect) => (
                <div
                  key={defect.id}
                  className="absolute border-2 border-error tooltip tooltip-open tooltip-error"
                  data-tip={`${defect.type} (${(defect.confidence * 100).toFixed(0)}%)`}
                  style={{
                    left: `${defect.x}px`,
                    top: `${defect.y}px`,
                    width: `${defect.w}px`,
                    height: `${defect.h}px`,
                  }}
                />
              ))}
            </figure>
            
            <div className="card-body p-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Ảnh ID: #{res.id}</span>
                <span className="badge badge-outline">Tốc độ xử lý: {res.processSpeed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Thống kê & Chi phí */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Bảng thống kê lỗi */}
        <div className="xl:col-span-2 card bg-base-100 shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
             Bảng Thống Kê Chi Tiết
          </h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-lg">
              <thead>
                <tr className="text-xl">
                  <th>ID Lỗi</th>
                  <th>Loại Lỗi</th>
                  <th>Độ tin cậy</th>
                  <th>Vị trí (x,y)</th>
                </tr>
              </thead>
              <tbody>
                {results.flatMap(r => r.defects).map((d) => (
                  <tr key={d.id}>
                    <td className="font-mono font-bold text-primary">{d.id}</td>
                    <td>{d.type}</td>
                    <td>
                      <progress className="progress progress-success w-20 mr-2" value={d.confidence * 100} max="100"></progress>
                      {(d.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="text-sm opacity-60">{d.x}, {d.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Báo cáo & Chi phí */}
        <div className="card bg-primary text-primary-content shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Dự Toán Sửa Chữa</h2>
          <div className="stats stats-vertical shadow bg-primary-focus text-primary-content w-full">
            <div className="stat">
              <div className="stat-title text-primary-content opacity-70">Tổng số lỗi</div>
              <div className="stat-value">03</div>
            </div>
            <div className="stat">
              <div className="stat-title text-primary-content opacity-70">Tỷ lệ lỗi trung bình</div>
              <div className="stat-value">12.5%</div>
            </div>
            <div className="stat border-t border-primary-content/20">
              <div className="stat-title text-primary-content opacity-70 text-sm">
                Chi phí = tỉ lệ lỗi x %
              </div>
              <div className="stat-value text-secondary text-3xl mt-2">1.250.000đ</div>
              <div className="stat-desc text-primary-content italic mt-2">* Công thức đã được xác thực</div>
            </div>
          </div>
          <button className="btn btn-secondary mt-6 no-animation">Xuất Báo Cáo PDF</button>
        </div>

      </div>
    </div>
  );
};

export default SteelDefectDashboard;
