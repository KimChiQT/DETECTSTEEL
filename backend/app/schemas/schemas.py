"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ─── Defect schemas ───
class DefectResponse(BaseModel):
    """Response schema cho từng lỗi"""
    id: str
    fault_type: str
    name_vi: str
    confidence: float = Field(..., description="% diện tích lỗi")
    cost: float
    time: str
    is_major: bool
    bbox: dict = Field(..., description="Bounding box {x, y, w, h}")
    
    class Config:
        from_attributes = True

# ─── Analysis schemas ───
class AnalysisResponse(BaseModel):
    """Response schema cho phân tích 1 ảnh"""
    id: int
    filename: Optional[str] = None
    image_base64: str
    fault_count: int
    warning_count: int = 0
    avg_confidence: float
    total_estimated_cost: float
    process_time: float
    faults: List[DefectResponse] = []
    
    # AHP scores
    repair_score: float
    replace_score: float
    decision: str  # "repair" or "replace"
    
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnalysisListResponse(BaseModel):
    """Response schema cho danh sách phân tích"""
    items: List[AnalysisResponse]
    total: int
    
    class Config:
        from_attributes = True

# ─── Batch Analysis schemas ───
class BatchSummary(BaseModel):
    """Summary cho batch analysis"""
    total_images: int
    analyzed_count: int
    total_faults: int
    total_major: int
    total_estimated_cost: float

class BatchAnalysisResponse(BaseModel):
    """Response schema cho batch analysis"""
    results: List[AnalysisResponse]
    batch_summary: BatchSummary
    
    class Config:
        from_attributes = True

# ─── AHP schemas ───
class AHPRequest(BaseModel):
    """Request schema cho AHP calculation"""
    entry_id: int = Field(..., description="Analysis record ID")
    cost_weight: int = Field(default=3, ge=1, le=9, description="Saaty scale 1-9")
    time_weight: int = Field(default=3, ge=1, le=9)
    area_weight: int = Field(default=3, ge=1, le=9)
    
    class Config:
        json_schema_extra = {
            "example": {
                "entry_id": 1,
                "cost_weight": 5,
                "time_weight": 7,
                "area_weight": 3,
            }
        }

class AHPResponse(BaseModel):
    """Response schema cho AHP calculation"""
    entry_id: int
    repair_score: float
    replace_score: float
    decision: str
    cost_weight: int
    time_weight: int
    area_weight: int
    
    class Config:
        from_attributes = True

# ─── Error schemas ───
class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    status_code: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Invalid image",
                "detail": "File must be PNG, JPG, or BMP",
                "status_code": 400
            }
        }
