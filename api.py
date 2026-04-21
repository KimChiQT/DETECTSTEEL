from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import time
from typing import Dict
from PIL import Image, ImageDraw, ImageFont
import io
import os

app = FastAPI()

# Cho phép React gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO('best.pt')

# In-memory history store (simple dev storage)
HISTORIES = []

INFO_DICT: Dict[str, Dict] = {
    "rolled_in_scale": {"vi": "Vảy cán", "base_cost_vnd": 35000, "time": "~5-10 phút", "major": False},
    "patches": {"vi": "Đốm bề mặt", "base_cost_vnd": 45000, "time": "~5-15 phút", "major": False},
    "crazing": {"vi": "Vết rạn bề mặt", "base_cost_vnd": 120000, "time": "~15-30 phút", "major": True},
    "pitted_surface": {"vi": "Vết lõm sâu", "base_cost_vnd": 140000, "time": "~20-40 phút", "major": True},
    "inclusion": {"vi": "Lẫn tạp chất", "base_cost_vnd": 90000, "time": "~30-60 phút", "major": True},
    "scratches": {"vi": "Minor Scratch", "base_cost_vnd": 10000, "time": "~3-10 phút", "major": False},
}

# ── Font cho tiếng Việt (Pillow) ─────────────────────────────
def _load_font(size: int = 14):
    """Tìm font hỗ trợ Unicode trên hệ thống, fallback về default."""
    candidates = [
        # Windows
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_boxes_unicode(img_bgr: np.ndarray, boxes_data: list) -> np.ndarray:
    """
    Vẽ bounding box + label tiếng Việt lên ảnh BGR bằng Pillow.
    boxes_data: list of dict với keys: x1,y1,x2,y2, label, major
    Trả về ảnh BGR đã vẽ.
    """
    # BGR → RGB → PIL
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    draw = ImageDraw.Draw(pil_img)
    font = _load_font(10)

    for b in boxes_data:
        x1, y1, x2, y2 = b["x1"], b["y1"], b["x2"], b["y2"]
        label = b["label"]
        is_major = b["major"]

        # Màu: major=đỏ, minor=vàng-xanh
        box_color = (255, 60, 80) if is_major else (30, 220, 255)
        bg_color  = (255, 60, 80) if is_major else (30, 220, 255)

        # Vẽ khung
        draw.rectangle([x1, y1, x2, y2], outline=box_color, width=2)

        # Đo kích thước text
        try:
            bbox_text = font.getbbox(label)
            tw = bbox_text[2] - bbox_text[0]
            th = bbox_text[3] - bbox_text[1]
        except AttributeError:
            tw, th = 80, 14  # fallback

        pad = 3
        # Vị trí label: trên khung, nếu tràn thì đẩy xuống
        lx, ly = x1, y1 - th - pad * 2 - 2
        if ly < 0:
            ly = y1 + 2

        # Nền label
        draw.rectangle([lx, ly, lx + tw + pad * 2, ly + th + pad * 2], fill=bg_color)
        # Text trắng
        draw.text((lx + pad, ly + pad), label, fill=(255, 255, 255), font=font)

    # PIL RGB → BGR numpy
    result = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return result

@app.post("/analyze-batch")
async def analyze_batch(files: list[UploadFile] = File(...)):
    """
    Analyze multiple images in one request.
    Returns a list of per-image results plus a batch summary.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results_list = []
    batch_total_cost = 0
    batch_total_faults = 0
    batch_major_count = 0

    for file in files:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            results_list.append({"filename": file.filename, "error": "Invalid image"})
            continue

        H, W, _ = img_bgr.shape
        yolo_results = model(img_bgr)
        yolo_results[0].names[3] = 'pitted_surface'
        yolo_results[0].names[4] = 'rolled_in_scale'

        boxes = yolo_results[0].boxes
        detected_faults = []
        area_ratios = []
        total_estimated_cost = 0
        unique_faults = {}

        font_scale = 0.5
        font_thickness = 1
        line_thickness = 2
        boxes_draw_data = []

        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            raw_name = yolo_results[0].names[cls_id]
            fault_info = INFO_DICT.get(raw_name, {"vi": raw_name, "base_cost_vnd": 30000, "time": "N/A", "major": False})
            # % diện tích lỗi = vùng lỗi / diện tích ảnh * 100%
            area_ratio = max(0.0, min(1.0, ((x2 - x1) * (y2 - y1)) / float(max(1, W * H))))
            area_pct = round(area_ratio, 1)
            label_text = f"{fault_info['vi']}"
            area_ratios.append(area_ratio)
            estimated_cost = int(fault_info["base_cost_vnd"] * (0.8 + conf * 0.6 + area_ratio * 1.2))
            total_estimated_cost += estimated_cost
            detected_faults.append({
                "id": raw_name,
                "name": fault_info["vi"],
                "confidence": area_pct,
                "cost": estimated_cost,
                "time": fault_info["time"],
                "major": bool(fault_info["major"]),
                "bbox": {
                    "x": round(x1 / W * 100, 2),
                    "y": round(y1 / H * 100, 2),
                    "w": round((x2 - x1) / W * 100, 2),
                    "h": round((y2 - y1) / H * 100, 2),
                },
            })
            unique_faults[raw_name] = True
            boxes_draw_data.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2,
                                     "label": label_text, "major": bool(fault_info["major"])})

        avg_conf = (sum(area_ratios) / len(area_ratios) * 100) if area_ratios else 0.0

        # Vẽ bounding box + label tiếng Việt bằng Pillow
        img_bgr = draw_boxes_unicode(img_bgr, boxes_draw_data)

        _, buffer = cv2.imencode('.jpg', img_bgr)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        major_count = len([f for f in detected_faults if f["major"]])
        warning_count = major_count
        fc = len(boxes)
        conf_frac = avg_conf / 100.0
        risk = conf_frac * (fc / (fc + 1.0))
        if fc > 0:
            risk += 0.1 * (major_count / fc)
            risk = max(0.0, min(1.0, risk))
        repair_score = round(max(0.0, min(1.0, 1.0 - risk)), 3)
        replace_score = round(max(0.0, min(1.0, risk)), 3)
        decision = 'repair' if repair_score >= replace_score else 'replace'

        batch_total_cost += total_estimated_cost
        batch_total_faults += fc
        batch_major_count += major_count

        entry_id = int(time.time() * 1000)
        entry = {
            "id": entry_id,
            "filename": file.filename,
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S'),
            "image_base64": f"data:image/jpeg;base64,{img_base64}",
            "fault_count": fc,
            "avg_conf": round(avg_conf, 1),
            "faults": detected_faults,
            "warning_count": warning_count,
            "total_estimated_cost": total_estimated_cost,
            "repairScore": repair_score,
            "replaceScore": replace_score,
            "decision": decision,
        }
        HISTORIES.insert(0, entry)
        results_list.append(entry)

    return {
        "results": results_list,
        "batch_summary": {
            "total_images": len(files),
            "analyzed": len(results_list),
            "total_faults": batch_total_faults,
            "total_major": batch_major_count,
            "total_estimated_cost": batch_total_cost,
        }
    }


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    start_time = time.time()
    
    # Đọc ảnh từ React gửi lên
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return JSONResponse({"error": "Invalid image data or unsupported format"}, status_code=400)
    H, W, _ = img_bgr.shape
    
    # Chạy YOLO
    results = model(img_bgr)
    results[0].names[3] = 'pitted_surface'
    results[0].names[4] = 'rolled_in_scale'
    
    boxes = results[0].boxes
    detected_faults = []
    unique_faults = {}
    avg_conf = 0
    area_ratios = []
    total_estimated_cost = 0

    # Cấu hình chữ và khung
    line_thickness = 2
    boxes_draw_data = []
    
    for box in boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        raw_name = results[0].names[cls_id]
        
        fault_info = INFO_DICT.get(raw_name, {"vi": raw_name, "base_cost_vnd": 30000, "time": "N/A", "major": False})
        # % diện tích lỗi = vùng lỗi / diện tích ảnh * 100%
        area_ratio = max(0.0, min(1.0, ((x2 - x1) * (y2 - y1)) / float(max(1, W * H))))
        area_pct = round(area_ratio, 1)
        label_text = f"{fault_info['vi']} "
        
        area_ratios.append(area_ratio)
        estimated_cost = int(fault_info["base_cost_vnd"] * (0.8 + conf * 0.6 + area_ratio * 1.2))
        total_estimated_cost += estimated_cost

        detected_faults.append(
            {
                "id": raw_name,
                "name": fault_info["vi"],
                "confidence": area_pct,
                "cost": estimated_cost,
                "time": fault_info["time"],
                "major": bool(fault_info["major"]),
                "bbox": {
                    "x": round(x1 / W * 100, 2),
                    "y": round(y1 / H * 100, 2),
                    "w": round((x2 - x1) / W * 100, 2),
                    "h": round((y2 - y1) / H * 100, 2),
                },
            }
        )
        unique_faults[raw_name] = True
        boxes_draw_data.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2,
                                 "label": label_text, "major": bool(fault_info["major"])})

    if area_ratios:
        avg_conf = sum(area_ratios) / len(area_ratios) * 100

    # Vẽ bounding box + label tiếng Việt bằng Pillow
    img_bgr = draw_boxes_unicode(img_bgr, boxes_draw_data)

    # Mã hóa ảnh sang Base64 để gửi về React
    try:
        _, buffer = cv2.imencode('.jpg', img_bgr)
    except Exception as e:
        return JSONResponse({"error": f"Failed to encode processed image: {str(e)}"}, status_code=500)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    process_time = round(time.time() - start_time, 2)

    # Simple AHP-like scoring derived from detections
    # avg_conf is percentage (0-100). Convert to fraction.
    conf_frac = (avg_conf / 100.0) if avg_conf else 0.0
    fc = len(boxes)
    # risk increases with avg confidence and number of faults
    risk = conf_frac * (fc / (fc + 1.0))
    if fc > 0:
        major_count = len([f for f in detected_faults if f["major"]])
        risk += 0.1 * (major_count / fc)
        risk = max(0.0, min(1.0, risk))
    # repairScore biased towards repair for low risk, replace for high risk
    repair_score = round(max(0.0, min(1.0, 1.0 - risk)), 3)
    replace_score = round(max(0.0, min(1.0, 1.0 - repair_score)), 3)
    decision = 'repair' if repair_score >= replace_score else 'replace'

    # Create history entry and append to in-memory store
    entry_id = int(time.time() * 1000)
    entry = {
        "id": entry_id,
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S'),
        "image_base64": f"data:image/jpeg;base64,{img_base64}",
        "fault_count": len(boxes),
        "avg_conf": round(avg_conf, 1),
        "process_time": process_time,
        "faults": detected_faults,
        "warning_count": len([f for f in detected_faults if f["major"]]),
        "fault_types_count": len(unique_faults),
        "total_estimated_cost": total_estimated_cost,
        "repairScore": repair_score,
        "replaceScore": replace_score,
        "decision": decision,
    }
    HISTORIES.insert(0, entry)

    resp = {
        "id": entry_id,
        "image_base64": entry["image_base64"],
        "fault_count": entry["fault_count"],
        "avg_conf": entry["avg_conf"],
        "process_time": entry["process_time"],
        "faults": entry["faults"],
        "warning_count": entry["warning_count"],
        "fault_types_count": entry["fault_types_count"],
        "total_estimated_cost": entry["total_estimated_cost"],
        "repairScore": entry["repairScore"],
        "replaceScore": entry["replaceScore"],
        "decision": entry["decision"],
    }
    return resp


@app.post("/ahp")
async def compute_ahp(payload: dict):
    """
    Recompute AHP scores using user-supplied weights.
    Body: { "entry_id": int, "cost_weight": int, "time_weight": int, "area_weight": int }
    Returns updated repairScore, replaceScore, decision.
    """
    entry_id = payload.get("entry_id")
    cost_w = max(1, min(9, int(payload.get("cost_weight", 3))))
    time_w = max(1, min(9, int(payload.get("time_weight", 3))))
    area_w = max(1, min(9, int(payload.get("area_weight", 3))))

    # Find the history entry to get fault data
    entry = next((h for h in HISTORIES if h["id"] == entry_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found. Analyze an image first.")

    faults = entry.get("faults", [])
    fault_count = len(faults)
    major_count = len([f for f in faults if f.get("major")])
    avg_conf_frac = (entry.get("avg_conf", 0) / 100.0)

    # Weighted AHP-style scoring
    # Normalise weights to 0-1
    w_cost = cost_w / 9.0
    w_time = time_w / 9.0
    w_area = area_w / 9.0
    w_sum = w_cost + w_time + w_area or 1.0

    # Risk factors
    conf_risk = avg_conf_frac
    fault_risk = fault_count / (fault_count + 3.0)
    major_risk = (major_count / fault_count) if fault_count else 0.0

    # Weighted risk
    risk = (w_cost * conf_risk + w_time * fault_risk + w_area * major_risk) / w_sum
    risk = max(0.0, min(1.0, risk))

    repair_score = round(max(0.0, min(1.0, 1.0 - risk)), 3)
    replace_score = round(max(0.0, min(1.0, risk)), 3)
    decision = "repair" if repair_score >= replace_score else "replace"

    # Update stored entry
    entry["repairScore"] = repair_score
    entry["replaceScore"] = replace_score
    entry["decision"] = decision

    return {
        "entry_id": entry_id,
        "repairScore": repair_score,
        "replaceScore": replace_score,
        "decision": decision,
        "cost_weight": cost_w,
        "time_weight": time_w,
        "area_weight": area_w,
    }


@app.delete("/history/{item_id}")
def delete_history(item_id: str):
    """Delete a single history entry by id."""
    global HISTORIES
    before = len(HISTORIES)
    HISTORIES = [h for h in HISTORIES if str(h["id"]) != str(item_id)]
    if len(HISTORIES) == before:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"ok": True, "deleted_id": item_id}


@app.delete("/history")
def clear_history():
    """Delete all history entries."""
    global HISTORIES
    HISTORIES = []
    return {"ok": True}


@app.get("/history")
def list_history():
    """Return all history entries with full data."""
    return {"items": HISTORIES}


@app.get("/history/{item_id}")
def get_history(item_id: int):
    for h in HISTORIES:
        if h["id"] == item_id:
            return h
    raise HTTPException(status_code=404, detail="History item not found")