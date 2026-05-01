"""
Multi-Criteria Decision Making (MCDM) Methods
Implements: AHP, TOPSIS, Entropy Weight Method
"""
import numpy as np
import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)


class MCDMCalculator:
    """
    Tổng hợp 3 phương pháp MCDM:
    1. AHP (Analytic Hierarchy Process) - dựa chuyên gia
    2. TOPSIS (Technique for Order Preference by Similarity) - so với tốt/xấu nhất
    3. Entropy - tự động từ dữ liệu
    """
    
    # ═══════════════════════════════════════════════════════════
    # 1. AHP METHOD (đã có sẵn, giữ nguyên)
    # ═══════════════════════════════════════════════════════════
    
    @staticmethod
    def ahp_method(
        cost: float,
        time: float,
        area: float,
        cost_weight: int = 3,
        time_weight: int = 3,
        area_weight: int = 3
    ) -> Dict:
        """
        AHP - Analytic Hierarchy Process
        
        Input:
            cost, time, area: giá trị tiêu chí (đã chuẩn hóa 0-1)
            cost_weight, time_weight, area_weight: trọng số Saaty (1-9)
        
        Output:
            {
                'method': 'AHP',
                'repair_score': float,
                'replace_score': float,
                'decision': 'repair' | 'replace',
                'weights': {'cost': w1, 'time': w2, 'area': w3}
            }
        """
        # Chuẩn hóa trọng số Saaty (1-9) → (0-1)
        w_cost = cost_weight / 9.0
        w_time = time_weight / 9.0
        w_area = area_weight / 9.0
        w_sum = w_cost + w_time + w_area or 1.0
        
        # Normalize
        w_cost /= w_sum
        w_time /= w_sum
        w_area /= w_sum
        
        # Tính risk (weighted sum)
        risk = w_cost * cost + w_time * time + w_area * area
        risk = max(0.0, min(1.0, risk))
        
        repair_score = round(1.0 - risk, 3)
        replace_score = round(risk, 3)
        decision = 'repair' if repair_score >= replace_score else 'replace'
        
        return {
            'method': 'AHP',
            'repair_score': repair_score,
            'replace_score': replace_score,
            'decision': decision,
            'weights': {
                'cost': round(w_cost, 3),
                'time': round(w_time, 3),
                'area': round(w_area, 3)
            }
        }
    
    # ═══════════════════════════════════════════════════════════
    # 2. TOPSIS METHOD
    # ═══════════════════════════════════════════════════════════
    
    @staticmethod
    def topsis_method(
        cost: float,
        time: float,
        area: float,
        weights: Dict[str, float] = None
    ) -> Dict:
        """
        TOPSIS - Technique for Order Preference by Similarity
        So sánh với phương án tốt nhất và xấu nhất
        
        Input:
            cost, time, area: giá trị tiêu chí (0-1)
            weights: {'cost': w1, 'time': w2, 'area': w3} (optional, mặc định đều nhau)
        
        Output:
            {
                'method': 'TOPSIS',
                'repair_score': float,
                'replace_score': float,
                'decision': 'repair' | 'replace',
                'distances': {'to_ideal': d+, 'to_anti_ideal': d-}
            }
        """
        # Mặc định trọng số đều nhau nếu không cung cấp
        if weights is None:
            weights = {'cost': 1/3, 'time': 1/3, 'area': 1/3}
        
        w_cost = weights.get('cost', 1/3)
        w_time = weights.get('time', 1/3)
        w_area = weights.get('area', 1/3)
        
        # Chuẩn hóa trọng số
        w_sum = w_cost + w_time + w_area
        w_cost /= w_sum
        w_time /= w_sum
        w_area /= w_sum
        
        # 2 phương án: Repair (thấp tốt) vs Replace (cao tốt)
        # Repair: cost↓, time↓, area↓ → tốt
        # Replace: cost↑, time↑, area↑ → xấu (cần thay)
        
        # Ma trận quyết định (2 phương án x 3 tiêu chí)
        # Phương án 1: Repair (giá trị thấp = tốt)
        # Phương án 2: Replace (giá trị cao = xấu)
        repair_alt = np.array([cost, time, area])
        replace_alt = np.array([1.0 - cost, 1.0 - time, 1.0 - area])  # đảo ngược
        
        # Chuẩn hóa vector (Euclidean normalization)
        matrix = np.array([repair_alt, replace_alt])
        norm = np.sqrt(np.sum(matrix**2, axis=0))
        norm[norm == 0] = 1  # tránh chia 0
        normalized = matrix / norm
        
        # Nhân với trọng số
        weights_vec = np.array([w_cost, w_time, w_area])
        weighted = normalized * weights_vec
        
        # Xác định ideal (A+) và anti-ideal (A-)
        # Với tiêu chí "thấp tốt" (cost, time, area):
        ideal = np.min(weighted, axis=0)        # A+ = min (tốt nhất)
        anti_ideal = np.max(weighted, axis=0)   # A- = max (xấu nhất)
        
        # Tính khoảng cách Euclidean
        d_plus_repair = np.sqrt(np.sum((weighted[0] - ideal)**2))
        d_minus_repair = np.sqrt(np.sum((weighted[0] - anti_ideal)**2))
        
        d_plus_replace = np.sqrt(np.sum((weighted[1] - ideal)**2))
        d_minus_replace = np.sqrt(np.sum((weighted[1] - anti_ideal)**2))
        
        # Tính closeness coefficient (càng gần ideal càng tốt)
        cc_repair = d_minus_repair / (d_plus_repair + d_minus_repair + 1e-10)
        cc_replace = d_minus_replace / (d_plus_replace + d_minus_replace + 1e-10)
        
        # Chuẩn hóa về 0-1
        total = cc_repair + cc_replace
        repair_score = round(cc_repair / total, 3) if total > 0 else 0.5
        replace_score = round(cc_replace / total, 3) if total > 0 else 0.5
        
        decision = 'repair' if repair_score >= replace_score else 'replace'
        
        return {
            'method': 'TOPSIS',
            'repair_score': repair_score,
            'replace_score': replace_score,
            'decision': decision,
            'distances': {
                'repair_to_ideal': round(d_plus_repair, 3),
                'repair_to_anti_ideal': round(d_minus_repair, 3),
                'replace_to_ideal': round(d_plus_replace, 3),
                'replace_to_anti_ideal': round(d_minus_replace, 3)
            }
        }
    
    # ═══════════════════════════════════════════════════════════
    # 3. ENTROPY WEIGHT METHOD
    # ═══════════════════════════════════════════════════════════
    
    @staticmethod
    def entropy_weights(data_matrix: np.ndarray) -> np.ndarray:
        """
        Tính trọng số Entropy từ ma trận dữ liệu
        
        Input:
            data_matrix: (n_samples, n_criteria) - dữ liệu lịch sử
        
        Output:
            weights: (n_criteria,) - trọng số tự động
        
        Nguyên lý:
            - Tiêu chí biến động nhiều → entropy thấp → trọng số cao
            - Tiêu chí ít biến động → entropy cao → trọng số thấp
        """
        n_samples, n_criteria = data_matrix.shape
        
        # Chuẩn hóa về [0, 1]
        min_vals = data_matrix.min(axis=0)
        max_vals = data_matrix.max(axis=0)
        range_vals = max_vals - min_vals
        range_vals[range_vals == 0] = 1  # tránh chia 0
        normalized = (data_matrix - min_vals) / range_vals
        
        # Tính xác suất p_ij
        col_sums = normalized.sum(axis=0)
        col_sums[col_sums == 0] = 1
        p_matrix = normalized / col_sums
        
        # Tính entropy e_j
        p_matrix[p_matrix == 0] = 1e-10  # tránh log(0)
        entropy = -np.sum(p_matrix * np.log(p_matrix), axis=0) / np.log(n_samples)
        
        # Tính diversity (độ phân tán)
        diversity = 1 - entropy
        
        # Tính trọng số
        weights = diversity / diversity.sum()
        
        return weights
    
    @staticmethod
    def entropy_method(
        cost: float,
        time: float,
        area: float,
        historical_data: List[Dict] = None
    ) -> Dict:
        """
        Entropy Weight Method - tự động tính trọng số từ dữ liệu
        
        Input:
            cost, time, area: giá trị hiện tại (0-1)
            historical_data: [{'cost': c, 'time': t, 'area': a}, ...] (optional)
        
        Output:
            {
                'method': 'Entropy',
                'repair_score': float,
                'replace_score': float,
                'decision': 'repair' | 'replace',
                'weights': {'cost': w1, 'time': w2, 'area': w3}
            }
        """
        # Nếu không có dữ liệu lịch sử, dùng trọng số mặc định
        if not historical_data or len(historical_data) < 3:
            logger.warning("Entropy: Insufficient historical data, using default weights")
            weights = np.array([1/3, 1/3, 1/3])
        else:
            # Tạo ma trận dữ liệu từ lịch sử
            data_matrix = np.array([
                [d.get('cost', 0), d.get('time', 0), d.get('area', 0)]
                for d in historical_data
            ])
            
            # Tính trọng số Entropy
            weights = MCDMCalculator.entropy_weights(data_matrix)
        
        w_cost, w_time, w_area = weights
        
        # Tính risk (weighted sum)
        risk = w_cost * cost + w_time * time + w_area * area
        risk = max(0.0, min(1.0, risk))
        
        repair_score = round(1.0 - risk, 3)
        replace_score = round(risk, 3)
        decision = 'repair' if repair_score >= replace_score else 'replace'
        
        return {
            'method': 'Entropy',
            'repair_score': repair_score,
            'replace_score': replace_score,
            'decision': decision,
            'weights': {
                'cost': round(w_cost, 3),
                'time': round(w_time, 3),
                'area': round(w_area, 3)
            }
        }
    
    # ═══════════════════════════════════════════════════════════
    # 4. AGGREGATION - TỔNG HỢP 3 PHƯƠNG PHÁP
    # ═══════════════════════════════════════════════════════════
    
    @staticmethod
    def aggregate_methods(
        ahp_result: Dict,
        topsis_result: Dict,
        entropy_result: Dict,
        method_weights: Dict[str, float] = None
    ) -> Dict:
        """
        Tổng hợp kết quả từ 3 phương pháp
        
        Input:
            ahp_result, topsis_result, entropy_result: kết quả từ 3 phương pháp
            method_weights: {'ahp': w1, 'topsis': w2, 'entropy': w3} (optional)
        
        Output:
            {
                'method': 'Aggregated',
                'repair_score': float (trung bình có trọng số),
                'replace_score': float,
                'decision': 'repair' | 'replace',
                'individual_results': {...},
                'method_weights': {...}
            }
        """
        # Mặc định: trọng số đều nhau cho 3 phương pháp
        if method_weights is None:
            method_weights = {'ahp': 1/3, 'topsis': 1/3, 'entropy': 1/3}
        
        w_ahp = method_weights.get('ahp', 1/3)
        w_topsis = method_weights.get('topsis', 1/3)
        w_entropy = method_weights.get('entropy', 1/3)
        
        # Chuẩn hóa
        w_sum = w_ahp + w_topsis + w_entropy
        w_ahp /= w_sum
        w_topsis /= w_sum
        w_entropy /= w_sum
        
        # Tổng hợp repair_score
        repair_score = (
            w_ahp * ahp_result['repair_score'] +
            w_topsis * topsis_result['repair_score'] +
            w_entropy * entropy_result['repair_score']
        )
        
        # Tổng hợp replace_score
        replace_score = (
            w_ahp * ahp_result['replace_score'] +
            w_topsis * topsis_result['replace_score'] +
            w_entropy * entropy_result['replace_score']
        )
        
        # Quyết định cuối cùng
        decision = 'repair' if repair_score >= replace_score else 'replace'
        
        # Đếm số phương pháp đồng ý
        votes = {
            'repair': sum([
                ahp_result['decision'] == 'repair',
                topsis_result['decision'] == 'repair',
                entropy_result['decision'] == 'repair'
            ]),
            'replace': sum([
                ahp_result['decision'] == 'replace',
                topsis_result['decision'] == 'replace',
                entropy_result['decision'] == 'replace'
            ])
        }
        
        return {
            'method': 'Aggregated',
            'repair_score': round(repair_score, 3),
            'replace_score': round(replace_score, 3),
            'decision': decision,
            'confidence': round(max(votes['repair'], votes['replace']) / 3.0, 2),
            'votes': votes,
            'individual_results': {
                'ahp': ahp_result,
                'topsis': topsis_result,
                'entropy': entropy_result
            },
            'method_weights': {
                'ahp': round(w_ahp, 3),
                'topsis': round(w_topsis, 3),
                'entropy': round(w_entropy, 3)
            }
        }
    
    # ═══════════════════════════════════════════════════════════
    # 5. MAIN FUNCTION - CHẠY TẤT CẢ
    # ═══════════════════════════════════════════════════════════
    
    @staticmethod
    def calculate_all(
        avg_confidence: float,
        fault_count: int,
        major_count: int,
        cost_weight: int = 3,
        time_weight: int = 3,
        area_weight: int = 3,
        historical_data: List[Dict] = None,
        method_weights: Dict[str, float] = None
    ) -> Dict:
        """
        Chạy cả 3 phương pháp và tổng hợp
        
        Input:
            avg_confidence: độ tin cậy trung bình (0-100%)
            fault_count: số lỗi
            major_count: số lỗi nghiêm trọng
            cost_weight, time_weight, area_weight: trọng số AHP (1-9)
            historical_data: dữ liệu lịch sử cho Entropy
            method_weights: trọng số cho 3 phương pháp
        
        Output:
            {
                'aggregated': {...},  # kết quả tổng hợp
                'ahp': {...},
                'topsis': {...},
                'entropy': {...}
            }
        """
        # Chuẩn hóa tiêu chí về [0, 1]
        conf_frac = avg_confidence / 100.0 if avg_confidence else 0.0
        
        # Cost risk (dựa vào confidence)
        cost_risk = conf_frac
        
        # Time risk (dựa vào số lỗi)
        time_risk = fault_count / (fault_count + 3.0)
        
        # Area risk (dựa vào tỷ lệ lỗi nghiêm trọng)
        area_risk = (major_count / fault_count) if fault_count > 0 else 0.0
        
        # 1. AHP
        ahp_result = MCDMCalculator.ahp_method(
            cost_risk, time_risk, area_risk,
            cost_weight, time_weight, area_weight
        )
        
        # 2. TOPSIS (dùng trọng số từ AHP)
        topsis_result = MCDMCalculator.topsis_method(
            cost_risk, time_risk, area_risk,
            weights=ahp_result['weights']
        )
        
        # 3. Entropy
        entropy_result = MCDMCalculator.entropy_method(
            cost_risk, time_risk, area_risk,
            historical_data=historical_data
        )
        
        # 4. Tổng hợp
        aggregated = MCDMCalculator.aggregate_methods(
            ahp_result, topsis_result, entropy_result,
            method_weights=method_weights
        )
        
        return {
            'aggregated': aggregated,
            'ahp': ahp_result,
            'topsis': topsis_result,
            'entropy': entropy_result
        }
