"""
YOLO model detection utilities
"""
from ultralytics import YOLO
from app.core.config import get_settings
import logging
import numpy as np
import cv2
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)
settings = get_settings()

# Thông tin các loại lỗi
DEFECT_INFO = {
    "rolled_in_scale": {"vi": "Vảy cán", "base_cost": 35000, "time": "~5-10 phút", "major": False},
    "patches": {"vi": "Đốm bề mặt", "base_cost": 45000, "time": "~5-15 phút", "major": False},
    "crazing": {"vi": "Vết rạn bề mặt", "base_cost": 120000, "time": "~15-30 phút", "major": True},
    "pitted_surface": {"vi": "Vết lõm sâu", "base_cost": 140000, "time": "~20-40 phút", "major": True},
    "inclusion": {"vi": "Lẫn tạp chất", "base_cost": 90000, "time": "~30-60 phút", "major": True},
    "scratches": {"vi": "Minor Scratch", "base_cost": 10000, "time": "~3-10 phút", "major": False},
}

class YOLODetector:
    """Wrapper cho YOLO model"""
    
    def __init__(self, model_path: str = None):
        try:
            self.model_path = model_path or settings.MODEL_PATH
            logger.info(f"Loading YOLO model from {self.model_path}")
            # PyTorch 2.6+ requires explicit weights_only=False for YOLO models
            import torch
            _orig_load = torch.load
            torch.load = lambda *a, **kw: _orig_load(*a, **{**kw, "weights_only": False})
            self.model = YOLO(self.model_path)
            torch.load = _orig_load
            self.confidence_threshold = settings.CONFIDENCE_THRESHOLD
            logger.info("YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
    
    def detect(self, image: np.ndarray) -> Tuple[List[Dict], float]:
        """
        Detect defects in image
        
        Args:
            image: numpy array (BGR format from cv2)
        
        Returns:
            (detected_faults, avg_confidence)
        """
        try:
            results = self.model(image, conf=self.confidence_threshold)
            
            # Fix class names
            results[0].names[3] = 'pitted_surface'
            results[0].names[4] = 'rolled_in_scale'
            
            boxes = results[0].boxes
            detected_faults = []
            area_ratios = []
            
            H, W = image.shape[:2]
            
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                fault_type = results[0].names[cls_id]
                
                # Tính area ratio
                area_ratio = max(0.0, min(1.0, ((x2 - x1) * (y2 - y1)) / max(1, W * H)))
                area_ratios.append(area_ratio)
                
                fault_info = DEFECT_INFO.get(fault_type, {
                    "vi": fault_type,
                    "base_cost": 30000,
                    "time": "N/A",
                    "major": False
                })
                
                # Tính chi phí
                estimated_cost = int(
                    fault_info["base_cost"] * (0.8 + conf * 0.6 + area_ratio * 1.2)
                )
                
                detected_faults.append({
                    "id": fault_type,
                    "name": fault_info["vi"],
                    "confidence": round(area_ratio * 100, 1),
                    "cost": estimated_cost,
                    "time": fault_info["time"],
                    "major": fault_info["major"],
                    "bbox": {
                        "x": round(x1 / W * 100, 2),
                        "y": round(y1 / H * 100, 2),
                        "w": round((x2 - x1) / W * 100, 2),
                        "h": round((y2 - y1) / H * 100, 2),
                    }
                })
            
            # Tính trung bình confidence
            avg_conf = (sum(area_ratios) / len(area_ratios) * 100) if area_ratios else 0.0
            
            return detected_faults, avg_conf
        
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            raise

# Global detector instance
_detector = None

def get_detector() -> YOLODetector:
    """Get or create YOLO detector instance"""
    global _detector
    if _detector is None:
        _detector = YOLODetector()
    return _detector
