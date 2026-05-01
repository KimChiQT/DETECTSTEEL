"""
AHP (Analytic Hierarchy Process) calculation utilities
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AHPCalculator:
    """AHP calculation engine"""
    
    @staticmethod
    def normalize_weights(cost_w: int, time_w: int, area_w: int) -> Dict[str, float]:
        """
        Normalize weights to 0-1 scale
        
        Args:
            cost_w: Cost weight (1-9 Saaty scale)
            time_w: Time weight (1-9 Saaty scale)
            area_w: Area weight (1-9 Saaty scale)
        
        Returns:
            {"w_cost", "w_time", "w_area", "w_sum"}
        """
        w_cost = cost_w / 9.0
        w_time = time_w / 9.0
        w_area = area_w / 9.0
        w_sum = w_cost + w_time + w_area or 1.0
        
        return {
            "w_cost": w_cost,
            "w_time": w_time,
            "w_area": w_area,
            "w_sum": w_sum,
        }
    
    @staticmethod
    def calculate_risk(
        avg_confidence: float,
        fault_count: int,
        major_count: int,
        w_cost: float,
        w_time: float,
        w_area: float,
        w_sum: float,
    ) -> float:
        """
        Calculate weighted risk using AHP
        
        Args:
            avg_confidence: Average confidence (0-100%)
            fault_count: Total number of faults detected
            major_count: Number of major faults
            w_cost, w_time, w_area, w_sum: Normalized weights
        
        Returns:
            Risk score (0.0-1.0)
        """
        # Convert confidence to fraction
        conf_frac = (avg_confidence / 100.0) if avg_confidence else 0.0
        
        # Risk factors
        conf_risk = conf_frac  # Related to COST
        fault_risk = fault_count / (fault_count + 3.0)  # Related to TIME
        major_risk = (major_count / fault_count) if fault_count > 0 else 0.0  # Related to AREA
        
        # Weighted risk
        weighted_risk = (
            w_cost * conf_risk +
            w_time * fault_risk +
            w_area * major_risk
        ) / w_sum
        
        # Clamp to [0, 1]
        risk = max(0.0, min(1.0, weighted_risk))
        
        logger.debug(
            f"AHP Risk: conf_risk={conf_risk:.3f}, fault_risk={fault_risk:.3f}, "
            f"major_risk={major_risk:.3f} => risk={risk:.3f}"
        )
        
        return risk
    
    @staticmethod
    def calculate_decision(risk: float) -> Dict[str, Any]:
        """
        Calculate repair/replace decision
        
        Args:
            risk: Risk score (0.0-1.0)
        
        Returns:
            {"repair_score", "replace_score", "decision"}
        """
        repair_score = round(max(0.0, min(1.0, 1.0 - risk)), 3)
        replace_score = round(max(0.0, min(1.0, risk)), 3)
        decision = "repair" if repair_score >= replace_score else "replace"
        
        return {
            "repair_score": repair_score,
            "replace_score": replace_score,
            "decision": decision,
        }
    
    @staticmethod
    def calculate_ahp(
        avg_confidence: float,
        fault_count: int,
        major_count: int,
        cost_weight: int = 3,
        time_weight: int = 3,
        area_weight: int = 3,
    ) -> Dict[str, Any]:
        """
        Full AHP calculation
        
        Args:
            avg_confidence: Average confidence (0-100%)
            fault_count: Total number of faults
            major_count: Number of major faults
            cost_weight: Cost weight (1-9)
            time_weight: Time weight (1-9)
            area_weight: Area weight (1-9)
        
        Returns:
            Complete AHP result
        """
        # Step 1: Normalize weights
        weights = AHPCalculator.normalize_weights(cost_weight, time_weight, area_weight)
        
        # Step 2: Calculate risk
        risk = AHPCalculator.calculate_risk(
            avg_confidence,
            fault_count,
            major_count,
            weights["w_cost"],
            weights["w_time"],
            weights["w_area"],
            weights["w_sum"],
        )
        
        # Step 3: Calculate decision
        decision = AHPCalculator.calculate_decision(risk)
        
        return {
            **weights,
            "risk": risk,
            **decision,
        }
