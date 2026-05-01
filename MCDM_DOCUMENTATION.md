# Tài Liệu MCDM - 3 Phương Pháp Ra Quyết Định

## Tổng Quan

Hệ thống DetectSteel sử dụng **3 phương pháp MCDM (Multi-Criteria Decision Making)** để đưa ra quyết định sửa chữa hoặc loại bỏ thép dựa trên kết quả phát hiện lỗi từ YOLO:

1. **AHP** (Analytic Hierarchy Process) - Dựa trên chuyên gia
2. **TOPSIS** (Technique for Order Preference by Similarity) - So sánh với tốt/xấu nhất
3. **Entropy** - Tự động từ dữ liệu lịch sử

Sau đó, hệ thống **tổng hợp (aggregate)** kết quả từ cả 3 phương pháp để đưa ra quyết định cuối cùng.

---

## 1. Phương Pháp AHP (Analytic Hierarchy Process)

### Nguyên Lý
- Dựa trên **kinh nghiệm chuyên gia**
- Sử dụng **thang đo Saaty** (1-9) để so sánh mức độ quan trọng giữa các tiêu chí
- Phù hợp khi có **kiến thức chuyên môn** về lĩnh vực

### Cách Hoạt Động

#### Bước 1: Xác định trọng số (Saaty Scale 1-9)
```
cost_weight = 5  (Chi phí quan trọng hơn)
time_weight = 3  (Thời gian trung bình)
area_weight = 7  (Diện tích lỗi rất quan trọng)
```

#### Bước 2: Chuẩn hóa trọng số
```python
w_cost = cost_weight / 9.0  = 5/9 = 0.556
w_time = time_weight / 9.0  = 3/9 = 0.333
w_area = area_weight / 9.0  = 7/9 = 0.778

# Normalize
w_sum = 0.556 + 0.333 + 0.778 = 1.667
w_cost = 0.556 / 1.667 = 0.333
w_time = 0.333 / 1.667 = 0.200
w_area = 0.778 / 1.667 = 0.467
```

#### Bước 3: Tính risk (weighted sum)
```python
# Tiêu chí (đã chuẩn hóa 0-1)
cost_risk = avg_confidence / 100  # Độ tin cậy YOLO
time_risk = fault_count / (fault_count + 3)  # Số lỗi
area_risk = major_count / fault_count  # Tỷ lệ lỗi nghiêm trọng

# Weighted risk
risk = w_cost * cost_risk + w_time * time_risk + w_area * area_risk
```

#### Bước 4: Quyết định
```python
repair_score = 1.0 - risk
replace_score = risk
decision = 'repair' if repair_score >= replace_score else 'replace'
```

### Ví Dụ Thực Tế

**Input:**
- `avg_confidence = 75%` → `cost_risk = 0.75`
- `fault_count = 5` → `time_risk = 5/(5+3) = 0.625`
- `major_count = 2` → `area_risk = 2/5 = 0.4`
- Trọng số: `cost=5, time=3, area=7`

**Tính toán:**
```
w_cost = 0.333, w_time = 0.200, w_area = 0.467

risk = 0.333*0.75 + 0.200*0.625 + 0.467*0.4
     = 0.250 + 0.125 + 0.187
     = 0.562

repair_score = 1 - 0.562 = 0.438
replace_score = 0.562

→ Decision: REPLACE (vì replace_score > repair_score)
```

---

## 2. Phương Pháp TOPSIS

### Nguyên Lý
- So sánh phương án với **phương án tốt nhất (ideal)** và **xấu nhất (anti-ideal)**
- Chọn phương án **gần ideal nhất** và **xa anti-ideal nhất**
- Khách quan hơn AHP vì dựa trên khoảng cách toán học

### Cách Hoạt Động

#### Bước 1: Tạo ma trận quyết định
```
Phương án    Cost    Time    Area
Repair       0.75    0.625   0.4
Replace      0.25    0.375   0.6  (đảo ngược)
```

#### Bước 2: Chuẩn hóa (Euclidean normalization)
```python
norm_cost = sqrt(0.75² + 0.25²) = 0.791
norm_time = sqrt(0.625² + 0.375²) = 0.729
norm_area = sqrt(0.4² + 0.6²) = 0.721

# Normalized matrix
Repair:  [0.75/0.791, 0.625/0.729, 0.4/0.721] = [0.948, 0.857, 0.555]
Replace: [0.25/0.791, 0.375/0.729, 0.6/0.721] = [0.316, 0.514, 0.832]
```

#### Bước 3: Nhân với trọng số
```python
weights = [0.333, 0.200, 0.467]  # từ AHP

Repair:  [0.948*0.333, 0.857*0.200, 0.555*0.467] = [0.316, 0.171, 0.259]
Replace: [0.316*0.333, 0.514*0.200, 0.832*0.467] = [0.105, 0.103, 0.388]
```

#### Bước 4: Xác định ideal và anti-ideal
```python
# Với tiêu chí "thấp tốt" (cost, time, area)
ideal = [min(0.316, 0.105), min(0.171, 0.103), min(0.259, 0.388)]
      = [0.105, 0.103, 0.259]

anti_ideal = [max(0.316, 0.105), max(0.171, 0.103), max(0.259, 0.388)]
           = [0.316, 0.171, 0.388]
```

#### Bước 5: Tính khoảng cách Euclidean
```python
# Repair
d+ = sqrt((0.316-0.105)² + (0.171-0.103)² + (0.259-0.259)²) = 0.215
d- = sqrt((0.316-0.316)² + (0.171-0.171)² + (0.259-0.388)²) = 0.129

# Replace
d+ = sqrt((0.105-0.105)² + (0.103-0.103)² + (0.388-0.259)²) = 0.129
d- = sqrt((0.105-0.316)² + (0.103-0.171)² + (0.388-0.388)²) = 0.221
```

#### Bước 6: Tính closeness coefficient
```python
cc_repair = d- / (d+ + d-) = 0.129 / (0.215 + 0.129) = 0.375
cc_replace = d- / (d+ + d-) = 0.221 / (0.129 + 0.221) = 0.631

# Normalize
total = 0.375 + 0.631 = 1.006
repair_score = 0.375 / 1.006 = 0.373
replace_score = 0.631 / 1.006 = 0.627

→ Decision: REPLACE
```

---

## 3. Phương Pháp Entropy

### Nguyên Lý
- **Tự động tính trọng số** từ dữ liệu lịch sử
- Tiêu chí **biến động nhiều** → entropy thấp → **trọng số cao**
- Tiêu chí **ít biến động** → entropy cao → **trọng số thấp**
- Khách quan hoàn toàn, không cần chuyên gia

### Cách Hoạt Động

#### Bước 1: Thu thập dữ liệu lịch sử
```python
# Ví dụ 5 lần phân tích trước
historical_data = [
    {'cost': 0.65, 'time': 0.5, 'area': 0.3},
    {'cost': 0.80, 'time': 0.6, 'area': 0.4},
    {'cost': 0.45, 'time': 0.55, 'area': 0.35},
    {'cost': 0.90, 'time': 0.58, 'area': 0.8},
    {'cost': 0.70, 'time': 0.52, 'area': 0.25},
]
```

#### Bước 2: Chuẩn hóa dữ liệu
```python
# Cost: min=0.45, max=0.90, range=0.45
# Time: min=0.5, max=0.6, range=0.1
# Area: min=0.25, max=0.8, range=0.55

normalized = [
    [(0.65-0.45)/0.45, (0.5-0.5)/0.1, (0.3-0.25)/0.55],
    [(0.80-0.45)/0.45, (0.6-0.5)/0.1, (0.4-0.25)/0.55],
    ...
]
```

#### Bước 3: Tính xác suất p_ij
```python
# Tổng mỗi cột
col_sums = [sum of each column]

# Xác suất
p_matrix = normalized / col_sums
```

#### Bước 4: Tính entropy e_j
```python
n = 5  # số mẫu
entropy_j = -sum(p_ij * log(p_ij)) / log(n)

# Ví dụ kết quả
entropy = [0.85, 0.95, 0.70]  # Cost biến động nhiều → entropy thấp
```

#### Bước 5: Tính diversity (độ phân tán)
```python
diversity = 1 - entropy = [0.15, 0.05, 0.30]
```

#### Bước 6: Tính trọng số
```python
weights = diversity / sum(diversity)
        = [0.15, 0.05, 0.30] / 0.50
        = [0.30, 0.10, 0.60]

# Area có trọng số cao nhất vì biến động nhiều nhất
```

#### Bước 7: Tính risk và quyết định (giống AHP)
```python
risk = 0.30*0.75 + 0.10*0.625 + 0.60*0.4
     = 0.225 + 0.0625 + 0.24
     = 0.5275

repair_score = 1 - 0.5275 = 0.473
replace_score = 0.5275

→ Decision: REPLACE
```

---

## 4. Tổng Hợp (Aggregation)

### Nguyên Lý
- Kết hợp kết quả từ **cả 3 phương pháp**
- Sử dụng **trọng số phương pháp** để cân bằng
- Đưa ra quyết định **đồng thuận** hoặc **đa số**

### Cách Hoạt Động

#### Bước 1: Thu thập kết quả từ 3 phương pháp
```python
ahp_result = {
    'repair_score': 0.438,
    'replace_score': 0.562,
    'decision': 'replace'
}

topsis_result = {
    'repair_score': 0.373,
    'replace_score': 0.627,
    'decision': 'replace'
}

entropy_result = {
    'repair_score': 0.473,
    'replace_score': 0.527,
    'decision': 'replace'
}
```

#### Bước 2: Xác định trọng số phương pháp
```python
method_weights = {
    'ahp': 0.4,      # AHP quan trọng hơn (có chuyên gia)
    'topsis': 0.3,   # TOPSIS trung bình
    'entropy': 0.3   # Entropy trung bình
}
```

#### Bước 3: Tính trung bình có trọng số
```python
repair_score = 0.4*0.438 + 0.3*0.373 + 0.3*0.473
             = 0.175 + 0.112 + 0.142
             = 0.429

replace_score = 0.4*0.562 + 0.3*0.627 + 0.3*0.527
              = 0.225 + 0.188 + 0.158
              = 0.571

→ Decision: REPLACE
```

#### Bước 4: Đếm số phiếu (voting)
```python
votes = {
    'repair': 0,    # Không phương pháp nào chọn repair
    'replace': 3    # Cả 3 phương pháp đều chọn replace
}

confidence = 3/3 = 1.0 = 100%  # Độ tin cậy cao
```

### Kết Quả Cuối Cùng
```json
{
  "method": "Aggregated",
  "repair_score": 0.429,
  "replace_score": 0.571,
  "decision": "replace",
  "confidence": 1.0,
  "votes": {
    "repair": 0,
    "replace": 3
  }
}
```

---

## 5. So Sánh 3 Phương Pháp

| Tiêu Chí | AHP | TOPSIS | Entropy |
|----------|-----|--------|---------|
| **Nguồn trọng số** | Chuyên gia | Chuyên gia (hoặc AHP) | Tự động từ dữ liệu |
| **Độ khách quan** | Thấp (chủ quan) | Trung bình | Cao (khách quan) |
| **Cần dữ liệu lịch sử** | Không | Không | Có (≥3 mẫu) |
| **Độ phức tạp** | Thấp | Trung bình | Cao |
| **Phù hợp khi** | Có chuyên gia | Cần so sánh rõ ràng | Có nhiều dữ liệu |
| **Ưu điểm** | Đơn giản, dễ hiểu | Toán học chặt chẽ | Không thiên vị |
| **Nhược điểm** | Chủ quan | Phụ thuộc trọng số | Cần dữ liệu đủ |

---

## 6. Khi Nào Dùng Phương Pháp Nào?

### Dùng AHP khi:
- ✅ Có chuyên gia trong lĩnh vực
- ✅ Cần quyết định nhanh
- ✅ Ít dữ liệu lịch sử
- ✅ Muốn kiểm soát trọng số

### Dùng TOPSIS khi:
- ✅ Cần so sánh rõ ràng giữa các phương án
- ✅ Muốn kết quả khách quan hơn AHP
- ✅ Có nhiều tiêu chí cần cân nhắc

### Dùng Entropy khi:
- ✅ Có nhiều dữ liệu lịch sử (≥10 mẫu)
- ✅ Muốn loại bỏ thiên vị chủ quan
- ✅ Dữ liệu có độ biến động rõ ràng

### Dùng Aggregation khi:
- ✅ Muốn kết quả **đáng tin cậy nhất**
- ✅ Có đủ tài nguyên tính toán
- ✅ Quyết định quan trọng, cần thận trọng

---

## 7. Cấu Hình Trong Hệ Thống

### Backend (api.py)

```python
# Trọng số AHP mặc định
cost_weight = 3  # 1-9
time_weight = 3
area_weight = 3

# Trọng số phương pháp (aggregation)
method_weights = {
    'ahp': 0.4,      # AHP quan trọng hơn
    'topsis': 0.3,
    'entropy': 0.3
}

# Gọi tất cả 3 phương pháp
mcdm_results = MCDMCalculator.calculate_all(
    avg_confidence=75,
    fault_count=5,
    major_count=2,
    cost_weight=cost_weight,
    time_weight=time_weight,
    area_weight=area_weight,
    historical_data=HISTORICAL_MCDM_DATA,
    method_weights=method_weights
)
```

### Frontend (Dashboard.jsx)

```jsx
// Hiển thị kết quả tổng hợp
<MCDMResultsPanel mcdmData={mcdmResults} />

// Kết quả bao gồm:
// - aggregated: Kết quả tổng hợp
// - ahp: Kết quả AHP
// - topsis: Kết quả TOPSIS
// - entropy: Kết quả Entropy
```

---

## 8. Ví Dụ Thực Tế Đầy Đủ

### Input
```python
avg_confidence = 75%
fault_count = 5
major_count = 2
cost_weight = 5
time_weight = 3
area_weight = 7
```

### Output
```json
{
  "aggregated": {
    "method": "Aggregated",
    "repair_score": 0.429,
    "replace_score": 0.571,
    "decision": "replace",
    "confidence": 1.0,
    "votes": {"repair": 0, "replace": 3}
  },
  "ahp": {
    "method": "AHP",
    "repair_score": 0.438,
    "replace_score": 0.562,
    "decision": "replace",
    "weights": {"cost": 0.333, "time": 0.200, "area": 0.467}
  },
  "topsis": {
    "method": "TOPSIS",
    "repair_score": 0.373,
    "replace_score": 0.627,
    "decision": "replace"
  },
  "entropy": {
    "method": "Entropy",
    "repair_score": 0.473,
    "replace_score": 0.527,
    "decision": "replace",
    "weights": {"cost": 0.30, "time": 0.10, "area": 0.60}
  }
}
```

### Giải Thích
- **Cả 3 phương pháp đều chọn REPLACE** → Độ tin cậy 100%
- **Replace score > 0.5** → Nên loại bỏ thép này
- **Entropy cho Area trọng số cao nhất (0.60)** → Diện tích lỗi biến động nhiều trong lịch sử
- **AHP cho Area trọng số 0.467** → Chuyên gia cũng đánh giá Area quan trọng

---

## 9. Tài Liệu Tham Khảo

1. **AHP**: Saaty, T.L. (1980). "The Analytic Hierarchy Process"
2. **TOPSIS**: Hwang, C.L. & Yoon, K. (1981). "Multiple Attribute Decision Making"
3. **Entropy**: Shannon, C.E. (1948). "A Mathematical Theory of Communication"
4. **MCDM**: Triantaphyllou, E. (2000). "Multi-Criteria Decision Making Methods"

---

**Ngày tạo:** 01/05/2026  
**Phiên bản:** 1.0  
**Tác giả:** Hệ thống DetectSteel
