# Hướng Dẫn Chạy Hệ Thống MCDM

## 🚀 Bước 1: Cài Đặt Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
```

**Lưu ý:** Cần cài thêm `numpy` cho MCDM:
```bash
pip install numpy
```

### Frontend
```bash
cd frontend-thep
npm install
```

---

## 🔧 Bước 2: Chạy Backend

Từ thư mục gốc của project:

```bash
backend\venv\Scripts\uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

**Kiểm tra backend đang chạy:**
- Mở trình duyệt: http://127.0.0.1:8000/docs
- Bạn sẽ thấy Swagger UI với các endpoint:
  - `POST /analyze` - Phân tích ảnh đơn
  - `POST /analyze-batch` - Phân tích nhiều ảnh
  - `POST /ahp` - Tính toán lại với trọng số mới
  - `GET /history` - Xem lịch sử
  - `DELETE /history` - Xóa lịch sử

---

## 🎨 Bước 3: Chạy Frontend

Mở terminal mới, từ thư mục gốc:

```bash
cd frontend-thep
npm run dev
```

**Kiểm tra frontend đang chạy:**
- Mở trình duyệt: http://localhost:5173
- Bạn sẽ thấy giao diện DetectSteel

---

## 🧪 Bước 4: Test MCDM Integration

### Test 1: Kiểm tra module MCDM
```bash
python -c "import sys; sys.path.append('backend/app/utils'); from mcdm_methods import MCDMCalculator; print('✓ MCDM OK')"
```

### Test 2: Test API với MCDM
```bash
python test_mcdm_api.py
```

**Kết quả mong đợi:**
```
🧪 Testing /analyze endpoint with MCDM...
✓ /analyze successful
✓ MCDM data present
  📊 Aggregated Decision: repair
     Repair Score: 0.XXX
     Replace Score: 0.XXX
     Confidence: 0.XX
     Votes: {'repair': X, 'replace': X}
  ⚖️  AHP: repair (R:0.XXX, Rep:0.XXX)
     Weights: {'cost': 0.XXX, 'time': 0.XXX, 'area': 0.XXX}
  ⚖️  TOPSIS: repair (R:0.XXX, Rep:0.XXX)
  ⚖️  ENTROPY: repair (R:0.XXX, Rep:0.XXX)
     Weights: {'cost': 0.XXX, 'time': 0.XXX, 'area': 0.XXX}

✅ MCDM integration working correctly!
```

---

## 📊 Bước 5: Sử Dụng Hệ Thống

### 5.1. Phân Tích Ảnh Đơn

1. **Tải ảnh lên:**
   - Click "Chọn ảnh" hoặc kéo thả ảnh vào
   - Chọn 1 ảnh từ danh sách

2. **Phân tích:**
   - Click nút "🔍 Phân Tích Ảnh"
   - Đợi 2-5 giây

3. **Xem kết quả:**
   - **Ảnh đã vẽ bounding box** với label tiếng Việt
   - **Bảng chi tiết lỗi** với:
     - Loại lỗi
     - % Diện tích lỗi
     - Độ tin cậy YOLO
     - Thời gian giải quyết
     - Chi phí dự tính
   - **Kết quả MCDM** (3 phương pháp):
     - 🎯 **Kết quả tổng hợp** (Aggregated)
     - ⚖️ **AHP** (Chuyên gia)
     - 📐 **TOPSIS** (So sánh)
     - 🔬 **Entropy** (Tự động)

### 5.2. Điều Chỉnh Trọng Số AHP

1. **Kéo thanh trượt:**
   - Cost Weight (1-9): Mức độ quan trọng của chi phí
   - Time Weight (1-9): Mức độ quan trọng của thời gian
   - Area Weight (1-9): Mức độ quan trọng của diện tích lỗi

2. **Tính toán lại:**
   - Click nút "⚖️ Tính Toán AHP"
   - Kết quả sẽ cập nhật ngay lập tức

3. **Xem thay đổi:**
   - Repair Score và Replace Score thay đổi
   - Quyết định có thể thay đổi từ "Sửa" → "Bỏ" hoặc ngược lại
   - Cả 3 phương pháp MCDM đều được tính lại

### 5.3. Hiểu Kết Quả MCDM

#### 🎯 Kết Quả Tổng Hợp (Aggregated)
- **Decision:** Quyết định cuối cùng (SỬA CHỮA / LOẠI BỎ)
- **Repair Score:** Điểm số sửa chữa (0-1)
- **Replace Score:** Điểm số loại bỏ (0-1)
- **Biểu quyết:** Số phương pháp chọn Sửa vs Bỏ
- **Độ tin cậy:** % đồng thuận (3/3 = 100%)

**Ví dụ:**
```
✓ SỬA CHỮA
Repair Score: 0.652
Replace Score: 0.348
Biểu quyết: ✓ Sửa: 2/3 | ✗ Bỏ: 1/3
Độ tin cậy: 67%
```
→ **Giải thích:** 2/3 phương pháp chọn sửa, độ tin cậy 67%, nên sửa chữa

#### ⚖️ AHP (Chuyên gia)
- Dựa trên trọng số bạn đặt (Cost/Time/Area)
- Phản ánh **kinh nghiệm chuyên gia**
- Trọng số hiển thị bên dưới

**Ví dụ:**
```
AHP (Chuyên gia): SỬA
Repair Score: 0.620
Replace Score: 0.380
Trọng số: Cost: 0.333 | Time: 0.200 | Area: 0.467
```
→ **Giải thích:** Với trọng số hiện tại, AHP khuyên nên sửa

#### 📐 TOPSIS (So sánh)
- So sánh với phương án tốt nhất và xấu nhất
- Khách quan hơn AHP
- Sử dụng trọng số từ AHP

**Ví dụ:**
```
TOPSIS (So sánh): BỎ
Repair Score: 0.420
Replace Score: 0.580
```
→ **Giải thích:** So với ideal, phương án "bỏ" gần hơn

#### 🔬 Entropy (Tự động)
- Tự động tính trọng số từ dữ liệu lịch sử
- Hoàn toàn khách quan
- Cần ≥3 mẫu để hoạt động tốt

**Ví dụ:**
```
Entropy (Tự động): SỬA
Repair Score: 0.680
Replace Score: 0.320
Trọng số: Cost: 0.250 | Time: 0.150 | Area: 0.600
```
→ **Giải thích:** Dữ liệu lịch sử cho thấy Area biến động nhiều nhất (trọng số 0.6)

---

## 🎯 Bước 6: Các Trường Hợp Sử Dụng

### Trường Hợp 1: Thép Sạch (Không Lỗi)
**Input:** Ảnh thép không có lỗi

**Kết quả:**
```
Fault Count: 0
Decision: REPAIR (vì không có lỗi)
Repair Score: 1.000
Replace Score: 0.000
```

### Trường Hợp 2: Lỗi Nhẹ (1-2 lỗi minor)
**Input:** Ảnh có 1-2 lỗi nhẹ (scratches, rolled_in_scale)

**Kết quả:**
```
Fault Count: 2
Major Count: 0
Decision: REPAIR
Repair Score: 0.7-0.8
Replace Score: 0.2-0.3
Votes: Repair: 3/3 (100%)
```

### Trường Hợp 3: Lỗi Nghiêm Trọng (≥3 lỗi major)
**Input:** Ảnh có nhiều lỗi nghiêm trọng (crazing, pitted_surface)

**Kết quả:**
```
Fault Count: 5
Major Count: 3
Decision: REPLACE
Repair Score: 0.2-0.4
Replace Score: 0.6-0.8
Votes: Replace: 2-3/3 (67-100%)
```

### Trường Hợp 4: Không Đồng Thuận
**Input:** Ảnh có lỗi trung bình

**Kết quả:**
```
Fault Count: 3
Major Count: 1
Decision: REPAIR (hoặc REPLACE)
Repair Score: 0.45-0.55
Replace Score: 0.45-0.55
Votes: Repair: 2/3, Replace: 1/3 (67%)
```
→ **Lưu ý:** Khi không đồng thuận, nên xem xét thêm yếu tố khác

---

## 🔍 Bước 7: Troubleshooting

### Lỗi 1: Module 'mcdm_methods' not found
**Nguyên nhân:** Python không tìm thấy module

**Giải pháp:**
```bash
# Kiểm tra file tồn tại
ls backend/app/utils/mcdm_methods.py

# Chạy từ thư mục gốc
cd /path/to/DETECTSTEEL
backend\venv\Scripts\uvicorn api:app --reload
```

### Lỗi 2: Frontend không hiển thị MCDM
**Nguyên nhân:** Backend chưa trả về dữ liệu MCDM

**Giải pháp:**
1. Kiểm tra console browser (F12)
2. Xem response từ `/analyze`:
```javascript
console.log(data.mcdm)  // Phải có dữ liệu
```
3. Restart backend

### Lỗi 3: Entropy weights không chính xác
**Nguyên nhân:** Chưa đủ dữ liệu lịch sử (cần ≥3 mẫu)

**Giải pháp:**
- Phân tích ít nhất 3 ảnh trước
- Entropy sẽ dùng trọng số mặc định (1/3, 1/3, 1/3) nếu không đủ dữ liệu

### Lỗi 4: CORS error
**Nguyên nhân:** Frontend không được phép gọi backend

**Giải pháp:**
- Kiểm tra `api.py` có `CORSMiddleware` với `allow_origins=["*"]`
- Restart backend

---

## 📝 Bước 8: Ghi Chú Quan Trọng

### Về Dữ Liệu Lịch Sử
- Hệ thống lưu **100 mẫu gần nhất** trong bộ nhớ
- Khi restart backend, dữ liệu sẽ mất
- Để lưu vĩnh viễn, cần kết nối database

### Về Trọng Số
- **AHP weights (1-9):** Bạn điều chỉnh thủ công
- **Method weights:** Mặc định `{ahp: 0.4, topsis: 0.3, entropy: 0.3}`
- Có thể thay đổi trong `api.py` dòng ~180

### Về Hiệu Suất
- **Phân tích 1 ảnh:** ~2-5 giây
- **MCDM calculation:** ~0.01-0.05 giây (rất nhanh)
- **Entropy:** Chậm hơn nếu có nhiều dữ liệu lịch sử (>100 mẫu)

---

## 🎓 Bước 9: Tài Liệu Tham Khảo

- **MCDM Theory:** Xem `MCDM_DOCUMENTATION.md`
- **API Documentation:** http://127.0.0.1:8000/docs
- **Calculation Details:** Xem `CALCULATION_DOCUMENTATION.md`

---

## ✅ Checklist Hoàn Thành

- [ ] Backend chạy thành công (port 8000)
- [ ] Frontend chạy thành công (port 5173)
- [ ] Test MCDM module pass
- [ ] Test API với `test_mcdm_api.py` pass
- [ ] Phân tích ảnh thành công
- [ ] Hiển thị kết quả 3 phương pháp MCDM
- [ ] Điều chỉnh trọng số AHP hoạt động
- [ ] Kết quả tổng hợp hiển thị đúng

---

**Chúc bạn sử dụng hệ thống thành công! 🎉**

Nếu có vấn đề, hãy kiểm tra:
1. Console backend (terminal chạy uvicorn)
2. Console frontend (F12 trong browser)
3. Network tab (F12 → Network) để xem request/response
