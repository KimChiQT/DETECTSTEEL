"""
AHP routes - Analytic Hierarchy Process calculation
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.models.models import AnalysisRecord
from app.schemas.schemas import AHPRequest, AHPResponse
from app.utils.ahp_calculator import AHPCalculator

router = APIRouter(prefix="/ahp", tags=["AHP"])
logger = logging.getLogger(__name__)

@router.post("/calculate", response_model=AHPResponse)
async def calculate_ahp(
    request: AHPRequest,
    db: Session = Depends(get_db)
):
    """
    Recalculate AHP scores with custom weights
    
    Saaty scale (1-9):
    - 1: Equally important
    - 3: Moderately more important
    - 5: Strongly more important
    - 7: Very strongly more important
    - 9: Extremely more important
    - 2,4,6,8: Intermediate values
    """
    try:
        # Get analysis record
        record = db.query(AnalysisRecord).filter(
            AnalysisRecord.id == request.entry_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Calculate AHP
        major_count = sum(1 for f in record.faults if f.is_major)
        
        ahp_result = AHPCalculator.calculate_ahp(
            avg_confidence=record.avg_confidence,
            fault_count=record.fault_count,
            major_count=major_count,
            cost_weight=request.cost_weight,
            time_weight=request.time_weight,
            area_weight=request.area_weight,
        )
        
        # Update record
        record.repair_score = ahp_result["repair_score"]
        record.replace_score = ahp_result["replace_score"]
        record.decision = ahp_result["decision"]
        db.commit()
        
        logger.info(
            f"AHP recalculated for id={record.id}: "
            f"decision={ahp_result['decision']} (weights: {request.cost_weight}/{request.time_weight}/{request.area_weight})"
        )
        
        return AHPResponse(
            entry_id=record.id,
            repair_score=ahp_result["repair_score"],
            replace_score=ahp_result["replace_score"],
            decision=ahp_result["decision"],
            cost_weight=request.cost_weight,
            time_weight=request.time_weight,
            area_weight=request.area_weight,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AHP calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
