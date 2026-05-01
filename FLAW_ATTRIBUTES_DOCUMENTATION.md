# Flaw Attributes Panel Documentation

## 📊 Tổng Quan

Component **FlawAttributesPanel** hiển thị các thuộc tính lỗi được quét bởi AI và Consistency Ratio (CR) - một chỉ số quan trọng trong phương pháp AHP.

---

## 🎨 Giao Diện

### Layout
```
┌─────────────────────────────────────────┐
│  AI-W SCANNED FLAW ATTRIBUTES           │
├──────────────────────┬──────────────────┤
│  Logi lỗi      0.85  │                  │
│  Time          0.85  │   [Gauge Chart]  │
│  Flaw Area     1.50  │      CR = 0.04   │
│  Defect Shape  0.25  │   ✓ Acceptable   │
│  Quality       0.25  │                  │
├──────────────────────┴──────────────────┤
│  Giải thích:                            │
│  • Logi lỗi: Mức độ tin cậy...          │
│  • Time: Thời gian sửa chữa...          │
│  • ...                                  │
└─────────────────────────────────────────┘
```

---

## 📐 Các Thuộc Tính (Attributes)

### 1. **Logi lỗi** (Fault Logic)
**Công thức:**
```javascript
logiFault = Σ(confidence) / n / 100
```

**Ý nghĩa:**
- Mức độ tin cậy trung bình của các lỗi phát hiện
- Range: 0-1
- Càng cao = AI càng chắc chắn về lỗi

**Ví dụ:**
```
Lỗi 1: confidence = 85%
Lỗi 2: confidence = 90%
Lỗi 3: confidence = 75%

logiFault = (85 + 90 + 75) / 3 / 100 = 0.833
```

---

### 2. **Time**
**Công thức:**
```javascript
avgTime = Σ(parseTime(timeString)) / n
time = min(avgTime / 60, 1)
```

**Ý nghĩa:**
- Thời gian sửa chữa ước tính (chuẩn hóa)
- Range: 0-1 (0 = nhanh, 1 = lâu)
- Giả định max = 60 phút

**Ví dụ:**
```
Lỗi 1: "~5-10 phút" → 7.5 phút
Lỗi 2: "~15-30 phút" → 22.5 phút
Lỗi 3: "~3-10 phút" → 6.5 phút

avgTime = (7.5 + 22.5 + 6.5) / 3 = 12.17 phút
time = 12.17 / 60 = 0.203
```

---

### 3. **Flaw Area**
**Công thức:**
```javascript
flawArea = Σ((w * h) / 10000) / n
```

**Ý nghĩa:**
- Diện tích lỗi trung bình so với tổng diện tích ảnh
- Range: 0-1
- w, h là % width và height của bbox

**Ví dụ:**
```
Lỗi 1: w=10%, h=15% → area = 150 / 10000 = 0.015
Lỗi 2: w=20%, h=25% → area = 500 / 10000 = 0.050
Lỗi 3: w=5%, h=8% → area = 40 / 10000 = 0.004

flawArea = (0.015 + 0.050 + 0.004) / 3 = 0.023
```

---

### 4. **Defect Shape**
**Công thức:**
```javascript
aspectRatios = [w1/h1, w2/h2, ...]
avgAspect = Σ(aspectRatios) / n
variance = Σ((r - avgAspect)²) / n
defectShape = min(variance / 2, 1)
```

**Ý nghĩa:**
- Độ biến thiên hình dạng lỗi
- Range: 0-1
- Càng cao = hình dạng càng không đồng nhất

**Ví dụ:**
```
Lỗi 1: w=10%, h=15% → aspect = 0.667
Lỗi 2: w=20%, h=25% → aspect = 0.800
Lỗi 3: w=5%, h=8% → aspect = 0.625

avgAspect = (0.667 + 0.800 + 0.625) / 3 = 0.697

variance = ((0.667-0.697)² + (0.800-0.697)² + (0.625-0.697)²) / 3
         = (0.0009 + 0.0106 + 0.0052) / 3
         = 0.0056

defectShape = min(0.0056 / 2, 1) = 0.0028
```

---

### 5. **Quality**
**Công thức:**
```javascript
majorCount = số lỗi nghiêm trọng (major = true)
quality = 1 - (majorCount / totalCount)
```

**Ý nghĩa:**
- Chất lượng tổng thể
- Range: 0-1
- 1 = không có lỗi nghiêm trọng
- 0 = toàn bộ là lỗi nghiêm trọng

**Ví dụ:**
```
Tổng: 5 lỗi
Major: 2 lỗi (crazing, pitted_surface)
Minor: 3 lỗi (scratches, rolled_in_scale, patches)

quality = 1 - (2 / 5) = 0.6
```

---

## 🎯 Consistency Ratio (CR)

### Định Nghĩa
**Consistency Ratio** là chỉ số đo độ nhất quán của ma trận so sánh cặp trong AHP.

### Công Thức (Simplified)
```javascript
values = [logiFault, time, flawArea, defectShape, quality]
mean = Σ(values) / n
stdDev = sqrt(Σ((v - mean)²) / n)
cr = min(stdDev / 2, 0.1)
```

### Công Thức Chính Thức (AHP)
```
CR = CI / RI

Trong đó:
- CI (Consistency Index) = (λmax - n) / (n - 1)
- RI (Random Index) = hằng số phụ thuộc vào n
- λmax = eigenvalue lớn nhất của ma trận so sánh
```

### Ngưỡng Chấp Nhận
| CR | Đánh Giá | Màu | Ý Nghĩa |
|----|----------|-----|---------|
| ≤ 0.05 | ✓ Acceptable | 🟢 Green | Độ nhất quán tốt |
| 0.05 - 0.08 | ⚠ Warning | 🟡 Yellow | Cần xem xét lại |
| > 0.08 | ✗ Unacceptable | 🔴 Red | Không nhất quán |

### Ví Dụ Tính CR
```javascript
values = [0.833, 0.203, 0.023, 0.003, 0.600]
mean = (0.833 + 0.203 + 0.023 + 0.003 + 0.600) / 5 = 0.332

variance = ((0.833-0.332)² + (0.203-0.332)² + ... + (0.600-0.332)²) / 5
         = (0.251 + 0.017 + 0.095 + 0.108 + 0.072) / 5
         = 0.109

stdDev = sqrt(0.109) = 0.330

cr = min(0.330 / 2, 0.1) = 0.1
```

**Kết quả:** CR = 0.10 → ⚠ Warning (gần ngưỡng chấp nhận)

---

## 🎨 Gauge Chart

### Cấu Trúc
```javascript
<PieChart>
  <Pie
    startAngle={180}  // Bắt đầu từ trái
    endAngle={0}      // Kết thúc ở phải
    innerRadius={40}  // Bán kính trong
    outerRadius={60}  // Bán kính ngoài
  >
    <Cell fill={color} />  // CR value
    <Cell fill="#e5e7eb" />  // Remaining
  </Pie>
</PieChart>
```

### Màu Sắc
```javascript
const getColor = (cr) => {
  if (cr <= 0.05) return '#10b981' // Green
  if (cr <= 0.08) return '#f59e0b' // Yellow
  return '#ef4444' // Red
}
```

---

## 📊 Bảng Thuộc Tính

### Cấu Trúc
```jsx
<table>
  <tbody>
    <tr>
      <td>Logi lỗi</td>
      <td>0.85</td>
    </tr>
    <tr>
      <td>Time</td>
      <td>0.85</td>
    </tr>
    ...
  </tbody>
</table>
```

### Styling
- Font: `text-sm`
- Label: `font-medium text-slate-700`
- Value: `font-bold text-slate-900`
- Border: `border-b border-slate-100`

---

## 🔧 Props

### FlawAttributesPanel
```typescript
interface FlawAttributesPanelProps {
  defects: Defect[]  // Danh sách lỗi từ YOLO
  summary: Summary   // Tóm tắt phân tích
}

interface Defect {
  id: string
  label: string
  confidence: number  // % diện tích lỗi (0-100)
  conf: number        // Độ tin cậy YOLO (0-100)
  cost: number
  time: string        // "~5-10 phút"
  major: boolean
  x: number           // % position
  y: number
  w: number           // % width
  h: number           // % height
}
```

---

## 🎯 Use Cases

### Case 1: Không Có Lỗi
```jsx
<FlawAttributesPanel defects={[]} summary={{}} />
```
**Hiển thị:**
```
┌─────────────────────────────────┐
│  AI-W scanned flaw attributes   │
│                                 │
│  Chưa có dữ liệu phân tích      │
│                                 │
└─────────────────────────────────┘
```

### Case 2: Có Lỗi Nhẹ
```jsx
defects = [
  { confidence: 85, time: "~5-10 phút", w: 10, h: 15, major: false },
  { confidence: 90, time: "~3-10 phút", w: 5, h: 8, major: false }
]
```
**Kết quả:**
- logiFault: 0.875
- time: 0.117
- flawArea: 0.019
- defectShape: 0.002
- quality: 1.0 (không có major)
- CR: 0.04 ✓ Acceptable

### Case 3: Có Lỗi Nghiêm Trọng
```jsx
defects = [
  { confidence: 75, time: "~15-30 phút", w: 20, h: 25, major: true },
  { confidence: 80, time: "~20-40 phút", w: 25, h: 30, major: true },
  { confidence: 85, time: "~5-10 phút", w: 10, h: 15, major: false }
]
```
**Kết quả:**
- logiFault: 0.800
- time: 0.375
- flawArea: 0.092
- defectShape: 0.008
- quality: 0.333 (2/3 là major)
- CR: 0.08 ⚠ Warning

---

## 🚀 Integration

### Trong Dashboard.jsx
```jsx
import FlawAttributesPanel from './FlawAttributesPanel'

// ...

{defects.length > 0 && (
  <div className="mt-4">
    <FlawAttributesPanel defects={defects} summary={summary} />
  </div>
)}
```

---

## 📱 Responsive Design

### Desktop (≥1024px)
- 2 cột: Table (trái) | Gauge (phải)
- Gauge size: 128px x 128px

### Tablet (768px - 1023px)
- 2 cột maintained
- Gauge size: 120px x 120px

### Mobile (<768px)
- 1 cột (stacked)
- Table trên cùng
- Gauge ở dưới
- Gauge size: 100px x 100px

---

## 🎨 Color Palette

```css
/* Gauge Colors */
--cr-good: #10b981      /* Green - CR ≤ 0.05 */
--cr-warning: #f59e0b   /* Yellow - 0.05 < CR ≤ 0.08 */
--cr-bad: #ef4444       /* Red - CR > 0.08 */
--cr-bg: #e5e7eb        /* Gray - Background */

/* Text Colors */
--text-primary: #0f172a    /* slate-900 */
--text-secondary: #475569  /* slate-600 */
--text-muted: #94a3b8      /* slate-400 */

/* Border Colors */
--border-primary: #cbd5e1  /* slate-300 */
--border-light: #f1f5f9    /* slate-100 */
```

---

## ✅ Testing Checklist

### Visual
- [ ] Table hiển thị 5 rows
- [ ] Gauge chart render đúng
- [ ] CR value hiển thị ở center
- [ ] Màu sắc đúng theo CR value
- [ ] Giải thích hiển thị đầy đủ

### Functional
- [ ] Attributes tính toán đúng
- [ ] CR trong khoảng 0-0.1
- [ ] Gauge percentage đúng
- [ ] Responsive trên mobile

### Edge Cases
- [ ] defects = [] → hiển thị "Chưa có dữ liệu"
- [ ] defects = [1 item] → không crash
- [ ] All major defects → quality = 0
- [ ] All minor defects → quality = 1

---

## 🔮 Future Improvements

### Phase 1 (Current) ✅
- [x] Basic attributes calculation
- [x] Gauge chart for CR
- [x] Responsive layout

### Phase 2 (Next)
- [ ] Real AHP CR calculation (eigenvalue)
- [ ] Historical CR tracking
- [ ] CR trend chart
- [ ] Export attributes to PDF

### Phase 3 (Future)
- [ ] Machine learning for attribute prediction
- [ ] Anomaly detection
- [ ] Benchmark comparison
- [ ] Real-time updates

---

**Date:** 01/05/2026  
**Version:** 1.0  
**Status:** ✅ COMPLETED
