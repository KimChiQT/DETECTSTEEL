"""
Analysis routes - single and batch image analysis
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import cv2
import numpy as np
import base64
import time
import logging

from app.core.database import get_db
from app.models.models import AnalysisRecord, Defect
from app.schemas.schemas import AnalysisResponse, BatchAnalysisResponse, BatchSummary, ErrorResponse
from app.utils.yolo_detector import get_detector
from app.utils.ahp_calculator import AHPCalculator

router = APIRouter(prefix="/analyze", tags=["Analysis"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=AnalysisResponse)
async def analyze_single_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze a single image for steel defects
    
    - Detects defects using YOLO model
    - Calculates cost and AHP scores
    - Stores result in database
    """
    start_time = time.time()
    
    try:
        # Validate file
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        H, W = img_bgr.shape[:2]
        
        # Detect defects
        detector = get_detector()
        detected_faults, avg_conf = detector.detect(img_bgr)
        
        # Calculate total cost
        total_cost = sum(f["cost"] for f in detected_faults)
        
        # Calculate basic AHP scores
        fault_count = len(detected_faults)
        major_count = sum(1 for f in detected_faults if f["major"])
        
        ahp_result = AHPCalculator.calculate_ahp(
            avg_conf, fault_count, major_count
        )
        
        process_time = round(time.time() - start_time, 2)
        
        # Save to database
        record = AnalysisRecord(
            filename=file.filename,
            fault_count=fault_count,
            avg_confidence=avg_conf,
            total_estimated_cost=total_cost,
            repair_score=ahp_result["repair_score"],
            replace_score=ahp_result["replace_score"],
            decision=ahp_result["decision"],
            process_time=process_time,
        )
        
        # Encode image
        _, buffer = cv2.imencode(".jpg", img_bgr)
        record.image_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode()
        
        # Save defects
        for fault in detected_faults:
            defect = Defect(
                fault_type=fault["id"],
                name_vi=fault["name"],
                confidence=fault["confidence"],
                estimated_cost=fault["cost"],
                is_major=fault["major"],
                bbox_x=fault["bbox"]["x"],
                bbox_y=fault["bbox"]["y"],
                bbox_w=fault["bbox"]["w"],
                bbox_h=fault["bbox"]["h"],
            )
            record.faults.append(defect)
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        logger.info(f"Analysis saved: id={record.id}, faults={fault_count}")
        
        return AnalysisResponse(
            id=record.id,
            filename=record.filename,
            image_base64=record.image_base64,
            fault_count=record.fault_count,
            warning_count=major_count,
            avg_confidence=record.avg_confidence,
            total_estimated_cost=record.total_estimated_cost,
            process_time=record.process_time,
            faults=[{
                "id": f["id"],
                "fault_type": f["id"],
                "name_vi": f["name"],
                "confidence": f["confidence"],
                "cost": f["cost"],
                "time": f["time"],
                "is_major": f["major"],
                "bbox": f["bbox"],
            } for f in detected_faults],
            repair_score=record.repair_score,
            replace_score=record.replace_score,
            decision=record.decision,
            created_at=record.created_at,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """Get analysis result by ID"""
    record = db.query(AnalysisRecord).filter(
        AnalysisRecord.id == analysis_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return record


def _process_single(file_bytes: bytes, filename: str, db: Session) -> dict:
    """Helper: run detection + save for one image, return AnalysisResponse-compatible dict."""
    start_time = time.time()

    nparr = np.frombuffer(file_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Invalid image format")

    detector = get_detector()
    detected_faults, avg_conf = detector.detect(img_bgr)

    total_cost = sum(f["cost"] for f in detected_faults)
    fault_count = len(detected_faults)
    major_count = sum(1 for f in detected_faults if f["major"])

    ahp_result = AHPCalculator.calculate_ahp(avg_conf, fault_count, major_count)
    process_time = round(time.time() - start_time, 2)

    record = AnalysisRecord(
        filename=filename,
        fault_count=fault_count,
        avg_confidence=avg_conf,
        total_estimated_cost=total_cost,
        repair_score=ahp_result["repair_score"],
        replace_score=ahp_result["replace_score"],
        decision=ahp_result["decision"],
        process_time=process_time,
    )

    _, buffer = cv2.imencode(".jpg", img_bgr)
    record.image_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

    for fault in detected_faults:
        defect = Defect(
            fault_type=fault["id"],
            name_vi=fault["name"],
            confidence=fault["confidence"],
            estimated_cost=fault["cost"],
            is_major=fault["major"],
            bbox_x=fault["bbox"]["x"],
            bbox_y=fault["bbox"]["y"],
            bbox_w=fault["bbox"]["w"],
            bbox_h=fault["bbox"]["h"],
        )
        record.faults.append(defect)

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "filename": record.filename,
        "image_base64": record.image_base64,
        "fault_count": record.fault_count,
        "warning_count": major_count,
        "avg_confidence": record.avg_confidence,
        "total_estimated_cost": record.total_estimated_cost,
        "process_time": record.process_time,
        "faults": [{
            "id": f["id"],
            "fault_type": f["id"],
            "name_vi": f["name"],
            "confidence": f["confidence"],
            "cost": f["cost"],
            "time": f["time"],
            "is_major": f["major"],
            "bbox": f["bbox"],
        } for f in detected_faults],
        "repair_score": record.repair_score,
        "replace_score": record.replace_score,
        "decision": record.decision,
        "created_at": record.created_at,
    }


@router.post("-batch")
async def analyze_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze multiple images in one request.
    Returns results list in the same order as uploaded files.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    total_faults = 0
    total_major = 0
    total_cost = 0.0

    for file in files:
        if not file.content_type.startswith("image/"):
            results.append({"error": f"{file.filename}: not an image"})
            continue
        try:
            contents = await file.read()
            result = _process_single(contents, file.filename, db)
            results.append(result)
            total_faults += result["fault_count"]
            total_major += result["warning_count"]
            total_cost += result["total_estimated_cost"]
            logger.info(f"Batch item processed: {file.filename}, faults={result['fault_count']}")
        except Exception as e:
            logger.error(f"Batch item error ({file.filename}): {e}")
            results.append({"error": str(e)})

    return {
        "results": results,
        "batch_summary": {
            "total_images": len(files),
            "analyzed_count": sum(1 for r in results if "error" not in r),
            "total_faults": total_faults,
            "total_major": total_major,
            "total_estimated_cost": total_cost,
        }
    }
