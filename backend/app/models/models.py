"""
SQLAlchemy models for DetectSteel
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import json

class AnalysisRecord(Base):
    """Lưu trữ kết quả phân tích ảnh"""
    __tablename__ = "analysis_records"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    image_base64 = Column(Text)  # Base64 encoded image
    
    # Detection results
    fault_count = Column(Integer, default=0)
    avg_confidence = Column(Float, default=0.0)
    total_estimated_cost = Column(Float, default=0.0)
    
    # AHP scores
    repair_score = Column(Float, default=0.5)
    replace_score = Column(Float, default=0.5)
    decision = Column(String, default="repair")  # "repair" or "replace"
    
    # Processing
    process_time = Column(Float)  # seconds
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    faults = relationship("Defect", back_populates="analysis", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AnalysisRecord id={self.id} file={self.filename} cost={self.total_estimated_cost}>"

class Defect(Base):
    """Lưu trữ chi tiết từng lỗi phát hiện"""
    __tablename__ = "defects"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_records.id"), index=True)
    
    # Defect info
    fault_type = Column(String, index=True)  # e.g., "pitted_surface"
    name_vi = Column(String)  # e.g., "Vết lõm sâu"
    confidence = Column(Float)  # Area ratio %
    estimated_cost = Column(Float)
    is_major = Column(Boolean, default=False)
    
    # Bounding box
    bbox_x = Column(Float)  # % của ảnh
    bbox_y = Column(Float)
    bbox_w = Column(Float)
    bbox_h = Column(Float)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    analysis = relationship("AnalysisRecord", back_populates="faults")
    
    def __repr__(self):
        return f"<Defect type={self.fault_type} cost={self.estimated_cost}>"

class BatchAnalysis(Base):
    """Lưu trữ phân tích lô (nhiều ảnh)"""
    __tablename__ = "batch_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_name = Column(String, index=True)
    
    # Batch stats
    total_images = Column(Integer, default=0)
    analyzed_count = Column(Integer, default=0)
    total_faults = Column(Integer, default=0)
    total_major_faults = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    analysis_ids = Column(JSON, default=list)  # List of related AnalysisRecord IDs
    
    def __repr__(self):
        return f"<BatchAnalysis name={self.batch_name} images={self.total_images}>"

class AHPPreference(Base):
    """Lưu trữ preferences AHP của người dùng"""
    __tablename__ = "ahp_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)  # có thể là session ID hoặc user ID
    
    # AHP weights (Saaty scale 1-9)
    cost_weight = Column(Integer, default=3)
    time_weight = Column(Integer, default=3)
    area_weight = Column(Integer, default=3)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<AHPPreference user={self.user_id} cost={self.cost_weight}>"
