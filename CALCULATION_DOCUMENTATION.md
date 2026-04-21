# Tài Liệu Tính Toán Công Thức - Hệ Thống Phát Hiện Lỗi Thép

## Tổng Quan
Hệ thống sử dụng các công thức tính toán để ước tính chi phí sửa chữa và thời gian cho các loại lỗi bề mặt thép, cũng như quyết định sửa chữa hay thay thế dựa trên phương pháp AHP (Analytic Hierarchy Process).

## 1. Dữ Liệu Cơ Sở Các Loại Lỗi

| Loại Lỗi | Tên Tiếng Việt | Chi Phí Cơ Sở (VND) | Thời Gian Sửa Chữa | Mức Độ Nghiêm Trọng |
|----------|----------------|---------------------|-------------------|-------------------|
| rolled_in_scale | Vảy cán | 35,000 | ~5-10 phút | Không nghiêm trọng |
| patches | Đốm bề mặt | 45,000 | ~5-15 phút | Không nghiêm trọng |
| crazing | Vết rạn bề mặt | 120,000 | ~15-30 phút | Nghiêm trọng |
| pitted_surface | Vết lõm sâu | 140,000 | ~20-40 phút | Nghiêm trọng |
| inclusion | Lẫn tạp chất | 90,000 | ~30-60 phút | Nghiêm trọng |
| scratches | Minor Scratch | 10,000 | ~3-10 phút | Không nghiêm trọng |

### Chi Tiết Phân Tích Chi Phí Cơ Sở

#### 1. **Rolled-in Scale (Vảy cán)** - 35,000 VND
- **Thời gian:** 5-10 phút
- **Chi phí bao gồm:**
  - Lao động: 20,000 VND (sanding/polishing)
  - Vật liệu: 10,000 VND (abrasive paper, cleaning agents)
  - Overhead: 5,000 VND (equipment usage)
- **Đặc điểm:** Lỗi bề mặt nhẹ, dễ xử lý bằng phương pháp cơ học

#### 2. **Patches (Đốm bề mặt)** - 45,000 VND
- **Thời gian:** 5-15 phút
- **Chi phí bao gồm:**
  - Lao động: 25,000 VND (surface preparation)
  - Vật liệu: 15,000 VND (filler, primer)
  - Overhead: 5,000 VND
- **Đặc điểm:** Vùng bề mặt không đồng nhất, cần xử lý cục bộ

#### 3. **Crazing (Vết rạn bề mặt)** - 120,000 VND
- **Thời gian:** 15-30 phút
- **Chi phí bao gồm:**
  - Lao động: 70,000 VND (precision grinding)
  - Vật liệu: 35,000 VND (special fillers, sealants)
  - Overhead: 15,000 VND (specialized equipment)
- **Đặc điểm:** Vết nứt mạng nhện, nghiêm trọng, ảnh hưởng cấu trúc

#### 4. **Pitted Surface (Vết lõm sâu)** - 140,000 VND
- **Thời gian:** 20-40 phút
- **Chi phí bao gồm:**
  - Lao động: 80,000 VND (deep grinding/filling)
  - Vật liệu: 40,000 VND (epoxy fillers, reinforcement)
  - Overhead: 20,000 VND (heavy equipment)
- **Đặc điểm:** Lõm sâu, có thể ảnh hưởng đến độ bền cơ học

#### 5. **Inclusion (Lẫn tạp chất)** - 90,000 VND
- **Thời gian:** 30-60 phút
- **Chi phí bao gồm:**
  - Lao động: 50,000 VND (careful removal)
  - Vật liệu: 25,000 VND (welding materials, fillers)
  - Overhead: 15,000 VND (precision tools)
- **Đặc điểm:** Tạp chất lạ nhúng trong kim loại, khó xử lý

#### 6. **Scratches (Minor Scratch)** - 10,000 VND
- **Thời gian:** 3-10 phút
- **Chi phí bao gồm:**
  - Lao động: 5,000 VND (light polishing)
  - Vật liệu: 3,000 VND (fine abrasive)
  - Overhead: 2,000 VND
- **Đặc điểm:** Trầy xước nhẹ, dễ sửa chữa nhất

### Yếu Tố Ảnh Hưởng Đến Chi Phí và Thời Gian

#### Hệ Số Điều Chỉnh Chi Phí
```
estimated_cost = base_cost × (0.8 + confidence × 0.6 + area_ratio × 1.2)
```

**Giải thích các hệ số:**
- **0.8 (hệ số cơ sở):** Chi phí tối thiểu cho mọi lỗi
- **confidence × 0.6:** Điều chỉnh theo độ tin cậy phát hiện
  - Confidence cao (0.9-1.0): +54,000 VND tối đa
  - Confidence trung bình (0.5-0.7): +21,000-33,000 VND
- **area_ratio × 1.2:** Điều chỉnh theo diện tích lỗi
  - Diện tích lớn (0.8-1.0): +96,000 VND tối đa
  - Diện tích nhỏ (0.1-0.3): +12,000-36,000 VND

#### Ví Dụ Tính Toán Chi Phí

**Ví dụ 1: Pitted Surface với confidence = 0.85, area_ratio = 0.15**
```
estimated_cost = 140,000 × (0.8 + 0.85 × 0.6 + 0.15 × 1.2)
                = 140,000 × (0.8 + 0.51 + 0.18)
                = 140,000 × 1.49
                = 208,600 VND
```

**Ví dụ 2: Scratches với confidence = 0.95, area_ratio = 0.05**
```
estimated_cost = 10,000 × (0.8 + 0.95 × 0.6 + 0.05 × 1.2)
               = 10,000 × (0.8 + 0.57 + 0.06)
               = 10,000 × 1.43
               = 14,300 VND
```

### Phân Tích Thời Gian Sửa Chữa

#### Thời Gian Theo Loại Lỗi
- **3-10 phút:** Scratches (đơn giản nhất)
- **5-10 phút:** Rolled-in scale (bề mặt nhẹ)
- **5-15 phút:** Patches (xử lý cục bộ)
- **15-30 phút:** Crazing (precision work)
- **20-40 phút:** Pitted surface (deep repair)
- **30-60 phút:** Inclusion (complex removal)

#### Yếu Tố Ảnh Hưởng Thời Gian
1. **Độ phức tạp kỹ thuật:** Lỗi nghiêm trọng cần kỹ năng cao hơn
2. **Kích thước và vị trí:** Lỗi lớn hoặc ở vị trí khó tiếp cận
3. **Thiết bị cần thiết:** Một số lỗi cần máy móc chuyên dụng
4. **Kinh nghiệm thợ:** Thợ có kinh nghiệm làm nhanh hơn

### Bảng So Sánh Chi Phí Theo Mức Độ

| Mức Độ | Loại Lỗi | Chi Phí Trung Bình | Thời Gian Trung Bình | Số Lượng Lỗi Thường Gặp |
|--------|----------|-------------------|---------------------|-------------------------|
| Nhẹ | Scratches, Rolled-in scale | 10,000 - 35,000 VND | 3-10 phút | 60-70% |
| Trung bình | Patches, Inclusion | 45,000 - 90,000 VND | 5-60 phút | 20-30% |
| Nghiêm trọng | Crazing, Pitted surface | 120,000 - 140,000 VND | 15-40 phút | 5-10% |

### Lưu Ý Quan Trọng Về Chi Phí

1. **Chi phí là ước tính:** Dựa trên giá cả trung bình tại Việt Nam 2024
2. **Không bao gồm:** Vận chuyển, thuế, bảo hành
3. **Có thể thay đổi:** Theo vị trí địa lý, mức lương thợ, giá vật liệu
4. **Chi phí gián tiếp:** Bao gồm 10-20% overhead cho thiết bị và quản lý

### Lưu Ý Quan Trọng Về Thời Gian

1. **Thời gian ước tính:** Dựa trên thợ có kinh nghiệm 3-5 năm
2. **Yếu tố ảnh hưởng:** Điều kiện làm việc, công cụ sẵn có
3. **Thời gian setup:** Không bao gồm thời gian chuẩn bị
4. **Hiệu suất:** Có thể tăng 20-30% với công nghệ mới

## 2. Công Thức Tính Chi Phí Ước Tính

### Chi Phí Cho Mỗi Lỗi
```
estimated_cost = base_cost_vnd × (0.8 + confidence × 0.6 + area_ratio × 1.2)
```

**Trong đó:**
- `base_cost_vnd`: Chi phí cơ sở cho loại lỗi (từ bảng trên)
- `confidence`: Độ tin cậy của mô hình YOLO (0-1)
- `area_ratio`: Tỷ lệ diện tích lỗi so với tổng diện tích ảnh (0-1)

### Chi Phí Tổng Cộng
```
total_estimated_cost = Σ(estimated_cost cho tất cả các lỗi trong ảnh)
```

## 3. Công Thức Tính Độ Tin Cậy Trung Bình
```
avg_conf = (Σ(area_ratios) / số_lượng_lỗi) × 100
```

**Trong đó:**
- `area_ratios`: Danh sách các tỷ lệ diện tích của từng lỗi

## 4. Công Thức Đánh Giá Rủi Ro và Quyết Định Sửa Chữa/Thay Thế

### Tính Rủi Ro Cơ Bản
```
risk = (avg_conf / 100) × (fault_count / (fault_count + 1))
```

### Điều Chỉnh Rủi Ro Theo Lỗi Nghiêm Trọng
```
if fault_count > 0:
    risk += 0.1 × (major_count / fault_count)
    risk = max(0.0, min(1.0, risk))
```

**Trong đó:**
- `fault_count`: Tổng số lỗi phát hiện
- `major_count`: Số lỗi nghiêm trọng (major = True)

### Tính Điểm Số Quyết Định
```
repair_score = max(0.0, min(1.0, 1.0 - risk))
replace_score = max(0.0, min(1.0, risk))
decision = 'repair' if repair_score >= replace_score else 'replace'
```

## 5. Công Thức AHP (Analytic Hierarchy Process) Tùy Chỉnh

### Chuẩn Hóa Trọng Số
```
w_cost = cost_weight / 9.0
w_time = time_weight / 9.0
w_area = area_weight / 9.0
w_sum = w_cost + w_time + w_area
```

### Tính Các Yếu Tố Rủi Ro
```
conf_risk = avg_conf_frac  # avg_conf / 100
fault_risk = fault_count / (fault_count + 3.0)
major_risk = major_count / fault_count  (nếu fault_count > 0, ngược lại 0)
```

### Tính Rủi Ro Có Trọng Số
```
risk = (w_cost × conf_risk + w_time × fault_risk + w_area × major_risk) / w_sum
risk = max(0.0, min(1.0, risk))
```

### Tính Điểm Số Cuối Cùng
```
repair_score = max(0.0, min(1.0, 1.0 - risk))
replace_score = max(0.0, min(1.0, risk))
decision = "repair" if repair_score >= replace_score else "replace"
```

## 6. Thông Số Kỹ Thuật

### Mô Hình YOLO
- Sử dụng YOLOv8 cho phát hiện lỗi
- File mô hình: `best.pt`
- Độ phân giải xử lý: 640x640 pixels

### Ngưỡng Phát Hiện
- Confidence threshold: Tự động từ mô hình YOLO
- Area ratio: Tính toán dựa trên bounding box

### Định Dạng Dữ Liệu Xuất
- Bounding box: Tọa độ tương đối (%) theo format {x, y, w, h}
- Độ tin cậy: Tỷ lệ diện tích lỗi (%)
- Chi phí: VND (đã làm tròn)
- Thời gian: Chuỗi mô tả khoảng thời gian

## 7. Tài Liệu Tham Khảo

1. **YOLO (You Only Look Once)**: Phương pháp phát hiện đối tượng real-time
2. **AHP (Analytic Hierarchy Process)**: Phương pháp ra quyết định đa tiêu chí của Thomas Saaty
3. **Steel Surface Defect Classification**: Các tiêu chuẩn phân loại lỗi bề mặt thép trong ngành luyện kim

## 8. Lưu Ý Quan Trọng

- Tất cả các giá trị chi phí và thời gian đều là **ước tính** dựa trên dữ liệu lịch sử
- Các công thức có thể được điều chỉnh dựa trên dữ liệu thực tế và kinh nghiệm chuyên môn
- Hệ thống sử dụng tiếng Việt cho giao diện người dùng và báo cáo

---

**Ngày tạo tài liệu:** 20/04/2026  
**Phiên bản:** 1.0  
**Tác giả:** Hệ thống DETECTSTEEL</content>
<parameter name="filePath">e:\code\DETECTSTEEL\CALCULATION_DOCUMENTATION.md