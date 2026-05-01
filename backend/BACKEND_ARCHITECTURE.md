# Backend Architecture Guide

## Struktur Thư Mục

```
backend/
├── app/
│   ├── core/              # Cấu hình, database
│   │   ├── config.py      # Settings
│   │   ├── database.py    # SQLAlchemy setup
│   │   └── __init__.py
│   │
│   ├── models/            # SQLAlchemy ORM models
│   │   ├── models.py      # AnalysisRecord, Defect, BatchAnalysis
│   │   └── __init__.py
│   │
│   ├── schemas/           # Pydantic request/response schemas
│   │   ├── schemas.py     # AnalysisResponse, AHPRequest, etc.
│   │   └── __init__.py
│   │
│   ├── routes/            # API endpoints
│   │   ├── analysis.py    # POST /analyze
│   │   ├── ahp.py         # POST /ahp/calculate
│   │   ├── history.py     # GET /history
│   │   └── __init__.py
│   │
│   ├── utils/             # Utilities
│   │   ├── yolo_detector.py  # YOLO model wrapper
│   │   ├── ahp_calculator.py # AHP calculation engine
│   │   └── __init__.py
│   │
│   ├── main.py            # FastAPI app initialization
│   └── __init__.py
│
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables example
└── README.md             # Backend documentation
```

## Key Components

### 1. Database Layer (app/core/database.py)
- **Engine**: SQLite (sqlite:///detectsteel.db) hoặc PostgreSQL
- **Session Management**: Dependency injection via FastAPI
- **Models**: AnalysisRecord, Defect, BatchAnalysis, AHPPreference

### 2. YOLO Detection (app/utils/yolo_detector.py)
- **Model**: best.pt (YOLOv8)
- **Input**: Image (numpy array, BGR format)
- **Output**: List of defects with:
  - Bounding boxes (x, y, w, h in %)
  - Defect type (scratches, rolled_in_scale, crazing, etc.)
  - Confidence score (area ratio %)
  - Estimated cost (VND)

### 3. AHP Calculator (app/utils/ahp_calculator.py)
- **Input**: Defect data + weights (Saaty 1-9 scale)
  - cost_weight (importance of repair cost)
  - time_weight (importance of repair time)
  - area_weight (importance of defect area)
- **Process**:
  1. Normalize weights to 0-1
  2. Calculate risk from 3 factors
  3. Compute repair_score vs replace_score
  4. Make decision (repair or replace)
- **Output**: Decision + scores (0.0-1.0)

### 4. API Routes

#### Analysis Route (app/routes/analysis.py)
```
POST /api/v1/analyze
  Input: UploadFile (image)
  Output: {
    id, filename, image_base64,
    fault_count, avg_confidence,
    total_estimated_cost,
    faults: [...],
    repair_score, replace_score, decision,
    process_time, created_at
  }
```

#### AHP Route (app/routes/ahp.py)
```
POST /api/v1/ahp/calculate
  Input: {
    entry_id, cost_weight, time_weight, area_weight
  }
  Output: {
    entry_id, repair_score, replace_score,
    decision, cost_weight, time_weight, area_weight
  }
```

#### History Route (app/routes/history.py)
```
GET /api/v1/history?skip=0&limit=50
  Output: { items: [...], total: N }

GET /api/v1/history/{id}
DELETE /api/v1/history/{id}
DELETE /api/v1/history/
```

## Database Schema

### AnalysisRecord (Bảng chính)
- id (PK)
- filename (tên file ảnh)
- image_base64 (ảnh đã xử lý)
- fault_count (số lỗi)
- avg_confidence (độ tin cậy trung bình %)
- total_estimated_cost (chi phí tổng VND)
- repair_score, replace_score, decision (AHP results)
- process_time (thời gian xử lý)
- created_at (timestamp)

### Defect (Bảng chi tiết lỗi)
- id (PK)
- analysis_id (FK → AnalysisRecord)
- fault_type (scratches, crazing, etc.)
- name_vi (tên Việt)
- confidence (% diện tích lỗi)
- estimated_cost (VND)
- is_major (T/F)
- bbox_x, bbox_y, bbox_w, bbox_h (%)
- created_at (timestamp)

### BatchAnalysis (Bảng phân tích lô)
- id (PK)
- batch_name (tên lô)
- total_images, analyzed_count, total_faults, total_major_faults, total_cost
- analysis_ids (JSON list)
- created_at (timestamp)

## Flow Diagram

```
[1] Upload ảnh
     ↓
[2] Validate format (PNG, JPG, BMP)
     ↓
[3] Load YOLO model → Detect defects
     ↓
[4] For each defect:
     - Calculate area_ratio
     - Compute estimated_cost (formula with 0.8, 0.6, 1.2)
     - Store in database
     ↓
[5] Calculate AHP:
     - Normalize weights (Saaty 1-9)
     - Compute risk factors (conf, fault_count, major_count)
     - Decision: repair vs replace
     ↓
[6] Return response with all results
     ↓
[7] (Optional) User adjusts AHP weights → Recalculate decision
     ↓
[8] Store in history database
```

## Running the Backend

### 1. Setup virtual environment
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
# or
source venv/bin/activate      # Linux/Mac
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Create .env file
```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Run migrations (if using Alembic)
```bash
alembic upgrade head
```

### 5. Start server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Access API docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

## Environment Variables

```
DEBUG=False              # Enable debug mode
DATABASE_URL=...        # Database connection string
MODEL_PATH=best.pt      # Path to YOLO model
API_VERSION=v1          # API version
```

## Production Deployment

1. **Use PostgreSQL instead of SQLite**
   ```
   DATABASE_URL=postgresql://user:pass@host/detectsteel
   ```

2. **Use Gunicorn + Uvicorn**
   ```
   gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
   ```

3. **Setup Nginx reverse proxy**

4. **Enable HTTPS/SSL certificates**

5. **Setup logging to file**
   ```python
   logging.basicConfig(filename='detectsteel.log')
   ```
