"""
Test script for backend API
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"
TEST_IMAGE = Path("../test_image.png")  # Adjust to your test image

def test_health():
    """Test health endpoint"""
    print("\n[TEST] Health Check")
    response = requests.get(f"http://localhost:8000/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_analyze():
    """Test single image analysis"""
    print("\n[TEST] Analyze Single Image")
    if not TEST_IMAGE.exists():
        print(f"❌ Test image not found: {TEST_IMAGE}")
        return
    
    with open(TEST_IMAGE, "rb") as f:
        files = {"file": f}
        response = requests.post(f"{BASE_URL}/analyze", files=files)
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(json.dumps({
        "id": data.get("id"),
        "fault_count": data.get("fault_count"),
        "total_cost": data.get("total_estimated_cost"),
        "decision": data.get("decision"),
        "repair_score": data.get("repair_score"),
    }, indent=2))
    
    return data.get("id")

def test_ahp(analysis_id):
    """Test AHP calculation"""
    print("\n[TEST] AHP Calculation")
    payload = {
        "entry_id": analysis_id,
        "cost_weight": 5,
        "time_weight": 7,
        "area_weight": 3,
    }
    response = requests.post(f"{BASE_URL}/ahp/calculate", json=payload)
    
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_history():
    """Test history retrieval"""
    print("\n[TEST] Get History")
    response = requests.get(f"{BASE_URL}/history", params={"limit": 5})
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total records: {data['total']}")
    print(f"Items returned: {len(data['items'])}")
    if data['items']:
        print(f"Latest: {data['items'][0]['filename']}")

if __name__ == "__main__":
    print("=" * 50)
    print("DetectSteel Backend API Tests")
    print("=" * 50)
    
    test_health()
    
    analysis_id = test_analyze()
    if analysis_id:
        test_ahp(analysis_id)
    
    test_history()
    
    print("\n" + "=" * 50)
    print("✅ Tests completed!")
    print("=" * 50)
