"""
History routes - manage analysis records
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from app.core.database import get_db
from app.models.models import AnalysisRecord
from app.schemas.schemas import AnalysisListResponse

router = APIRouter(prefix="/history", tags=["History"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=AnalysisListResponse)
async def list_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get analysis history with pagination"""
    try:
        # Get total count
        total = db.query(AnalysisRecord).count()
        
        # Get records (newest first)
        records = db.query(AnalysisRecord).order_by(
            desc(AnalysisRecord.created_at)
        ).offset(skip).limit(limit).all()
        
        logger.info(f"Retrieved {len(records)} history records (skip={skip}, limit={limit})")
        
        return AnalysisListResponse(items=records, total=total)
    
    except Exception as e:
        logger.error(f"History retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """Delete analysis record and related defects"""
    try:
        record = db.query(AnalysisRecord).filter(
            AnalysisRecord.id == analysis_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        db.delete(record)
        db.commit()
        
        logger.info(f"Deleted analysis id={analysis_id}")
        
        return {"ok": True, "deleted_id": analysis_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/")
async def clear_history(db: Session = Depends(get_db)):
    """Clear all history (dangerous!)"""
    try:
        count = db.query(AnalysisRecord).count()
        db.query(AnalysisRecord).delete()
        db.commit()
        
        logger.warning(f"Cleared {count} history records")
        
        return {"ok": True, "cleared_count": count}
    
    except Exception as e:
        logger.error(f"Clear error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
