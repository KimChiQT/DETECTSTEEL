# Hướng Dẫn Test MCDM Frontend

## 🧪 Kiểm Tra Giao Diện MCDM

### Bước 1: Mở Trình Duyệt
```
URL: http://localhost:5173
```

### Bước 2: Tải Ảnh Lên
1. Click "Chọn ảnh" hoặc kéo thả ảnh
2. Chọn 1 ảnh thép có lỗi (ví dụ: `test_real.jpg`)
3. Click vào ảnh để chọn

### Bước 3: Phân Tích
1. Click nút **"🔍 Phân Tích Ảnh"**
2. Đợi 2-5 giây
3. Xem kết quả

### Bước 4: Kiểm Tra MCDM Panel

#### ✅ Checklist Hiển Thị

##### Header
- [ ] Tiêu đề "METHODOLOGY COMPARISON & AGGREGATION" hiển thị
- [ ] Font chữ đậm, uppercase, căn giữa

##### Layout 2 Cột
- [ ] Cột trái: PHƯƠNG PHÁP ENTROPY (nền xanh dương)
- [ ] Cột phải: PHƯƠNG PHÁP AHP (nền tím)
- [ ] Responsive: trên mobile chuyển thành 1 cột

##### Entropy Section (Trái)
- [ ] Tiêu đề "PHƯƠNG PHÁP ENTROPY (KHÁCH QUAN)"
- [ ] Badge quyết định (SỬA/BỎ) ở góc phải
- [ ] Text mô tả: "TỰ ĐỘNG XÁC ĐỊNH TRỌNG SỐ..."
- [ ] **Bar Chart** hiển thị 4 tiêu chí:
  - Cost (màu xanh dương)
  - Time (màu tím)
  - Flaw Area (màu vàng)
  - Defect Shape (màu xám)
- [ ] Trục X: 0-50
- [ ] Trục Y: tên tiêu chí
- [ ] Góc nhìn dữ liệu: "Tiêu chí Cost biến động lớn nhất..."

##### AHP Section (Phải)
- [ ] Tiêu đề "PHƯƠNG PHÁP AHP (CHỦ QUAN)"
- [ ] Badge quyết định (SỬA/BỎ) ở góc phải
- [ ] Text mô tả: "DỰA TRÊN KINH NGHIỆM CHUYÊN GIA..."
- [ ] **Radar Chart** hiển thị 3 tiêu chí:
  - Area
  - Time
  - Cost
- [ ] Màu tím (#8b5cf6)
- [ ] Grid rõ ràng
- [ ] Góc nhìn chuyên gia: "Tiêu chí Costs: Ưu tiên chất lượng..."

##### TOPSIS Section
- [ ] Tiêu đề "XẾP HẠNG TOPSIS & ĐIỂM SỐ C*"
- [ ] Hiển thị C* = 0.XX
- [ ] **Bar Chart** hiển thị 3 phương án:
  - Sửa chữa (màu xanh lá)
  - Hủy bỏ (màu đỏ)
  - Chờ xử lý (màu xám)
- [ ] Trục X: tên phương án
- [ ] Trục Y: 0-1
- [ ] Text: "Xếp hạng tối ưu: Gần D⁺ nhất; Xa D⁻ nhất."

##### Aggregation Section
- [ ] Tiêu đề "TỔNG HỢP QUYẾT ĐỊNH & GẦN TRỌNG SỐ"
- [ ] Công thức: "TỔNG ĐIỂM (C*) = 0.40(AHP) + 0.30(Entropy) + 0.30(TOPSIS)"
- [ ] Hiển thị trọng số: "AHP 40%, Entropy 30%, TOPSIS 30%"
- [ ] Text giải thích: "Trọng số dựa trên bối cảnh doanh nghiệp..."

##### Final Decision Section
- [ ] Nền màu:
  - Xanh lá nếu quyết định SỬA CHỮA
  - Đỏ nếu quyết định LOẠI BỎ
- [ ] Tiêu đề: "KẾT LUẬN CUỐI CÙNG & ĐÁNH GIÁ ĐỘ NGHIÊM TRỌNG"
- [ ] Quyết định lớn: "🎯 KHUYẾN NGHỊ: NÊN SỬA CHỮA (C* = 0.XX)"
- [ ] Icon tròn lớn:
  - ✓ nếu sửa chữa
  - ✗ nếu loại bỏ
- [ ] Giải thích chi tiết (paragraph)
- [ ] Biểu quyết:
  - ✓ Sửa: X/3
  - ✗ Bỏ: X/3
  - Độ tin cậy: XX%

---

## 🎨 Kiểm Tra Visual

### Colors
```
Entropy:
- Background: bg-blue-50 (#eff6ff)
- Border: border-blue-200 (#bfdbfe)
- Text: text-blue-900 (#1e3a8a)

AHP:
- Background: bg-purple-50 (#faf5ff)
- Border: border-purple-200 (#e9d5ff)
- Text: text-purple-900 (#581c87)

TOPSIS:
- Background: bg-emerald-50 (#ecfdf5)
- Border: border-emerald-200 (#a7f3d0)
- Text: text-emerald-900 (#064e3b)

Aggregation:
- Background: gradient from-indigo-100 to-white
- Border: border-indigo-300 (#a5b4fc)
- Text: text-indigo-900 (#312e81)

Decision (Repair):
- Background: bg-emerald-50
- Border: border-emerald-400 (#34d399)
- Text: text-emerald-700 (#047857)

Decision (Replace):
- Background: bg-rose-50
- Border: border-rose-400 (#fb7185)
- Text: text-rose-700 (#be123c)
```

### Typography
```
Header: text-lg font-black uppercase tracking-wide
Section: text-sm font-black uppercase
Body: text-xs
Decision: text-2xl font-black
```

### Spacing
```
Padding: p-4 (16px)
Gap: gap-4 (16px)
Margin: mb-3 (12px)
Border: border-2 (2px)
Rounded: rounded-lg (8px)
```

---

## 🔍 Kiểm Tra Chức Năng

### Test Case 1: Ảnh Có Lỗi Nhẹ
**Input:** Ảnh có 1-2 lỗi minor (scratches)

**Expected:**
- Entropy: SỬA
- AHP: SỬA
- TOPSIS: SỬA
- Aggregated: SỬA CHỮA
- Votes: 3/3 (100%)
- C* > 0.5

### Test Case 2: Ảnh Có Lỗi Nghiêm Trọng
**Input:** Ảnh có nhiều lỗi major (crazing, pitted_surface)

**Expected:**
- Entropy: BỎ
- AHP: BỎ
- TOPSIS: BỎ
- Aggregated: LOẠI BỎ
- Votes: 3/3 (100%)
- C* < 0.5

### Test Case 3: Ảnh Không Đồng Thuận
**Input:** Ảnh có lỗi trung bình

**Expected:**
- Entropy: SỬA
- AHP: BỎ
- TOPSIS: SỬA
- Aggregated: SỬA CHỮA (hoặc LOẠI BỎ)
- Votes: 2/3 (67%)
- C* ≈ 0.5

### Test Case 4: Điều Chỉnh Trọng Số AHP
**Steps:**
1. Phân tích ảnh
2. Kéo thanh Cost Weight lên 9
3. Kéo thanh Area Weight xuống 1
4. Click "⚖️ Tính Toán AHP"

**Expected:**
- AHP radar chart thay đổi (Cost lớn hơn)
- Quyết định có thể thay đổi
- MCDM panel cập nhật ngay lập tức

---

## 📱 Kiểm Tra Responsive

### Desktop (≥1024px)
- [ ] 2 cột (Entropy | AHP)
- [ ] Charts full width
- [ ] Text dễ đọc

### Tablet (768px - 1023px)
- [ ] 2 cột maintained
- [ ] Charts scale down
- [ ] Still readable

### Mobile (<768px)
- [ ] 1 cột (stacked)
- [ ] Entropy trên cùng
- [ ] AHP ở giữa
- [ ] TOPSIS dưới
- [ ] Charts responsive
- [ ] Touch-friendly

---

## 🐛 Common Issues & Solutions

### Issue 1: Charts không hiển thị
**Cause:** Recharts chưa được cài đặt

**Solution:**
```bash
cd frontend-thep
npm install recharts
```

### Issue 2: Data undefined
**Cause:** Backend chưa trả về MCDM data

**Solution:**
- Kiểm tra backend đang chạy
- Kiểm tra console: `console.log(data.mcdm)`
- Restart backend

### Issue 3: Colors không đúng
**Cause:** Tailwind CSS chưa compile

**Solution:**
```bash
# Restart frontend
npm run dev
```

### Issue 4: Layout bị vỡ
**Cause:** Browser cache

**Solution:**
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- Clear cache

---

## 🎯 Expected Results

### Screenshot Checklist
Chụp màn hình và kiểm tra:

1. **Full Page**
   - [ ] Header
   - [ ] Image uploader (left)
   - [ ] Detection viewer (center)
   - [ ] MCDM panel (right)

2. **MCDM Panel Close-up**
   - [ ] Entropy bar chart
   - [ ] AHP radar chart
   - [ ] TOPSIS bar chart
   - [ ] Aggregation section
   - [ ] Final decision

3. **Mobile View**
   - [ ] Stacked layout
   - [ ] Charts readable
   - [ ] Buttons accessible

---

## ✅ Final Checklist

### Visual
- [ ] All charts render
- [ ] Colors correct
- [ ] Typography consistent
- [ ] Spacing uniform
- [ ] Borders visible

### Functional
- [ ] Data displays correctly
- [ ] Charts update on AHP change
- [ ] Voting shows correct numbers
- [ ] Confidence % accurate
- [ ] Decision matches data

### Responsive
- [ ] Desktop layout works
- [ ] Tablet layout works
- [ ] Mobile layout works
- [ ] Charts scale properly

### Performance
- [ ] Page loads <2s
- [ ] Charts render <100ms
- [ ] No console errors
- [ ] Smooth animations

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

✅ PASSED
- [ ] Visual design matches reference
- [ ] All charts display correctly
- [ ] Data accuracy verified
- [ ] Responsive on all devices
- [ ] No console errors

❌ FAILED
- [ ] Issue 1: ___________
- [ ] Issue 2: ___________

📝 NOTES:
___________________________________________
___________________________________________
```

---

**Happy Testing! 🎉**

Nếu gặp vấn đề, kiểm tra:
1. Backend đang chạy (port 8000)
2. Frontend đang chạy (port 5173)
3. Console browser (F12)
4. Network tab (F12 → Network)
