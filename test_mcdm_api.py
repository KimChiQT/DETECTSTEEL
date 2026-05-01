"""
Test MCDM integration in api.py
"""
import requests
import json

API_BASE = "http://127.0.0.1:8000"

def test_analyze_with_mcdm():
    """Test /analyze endpoint returns MCDM results"""
    print("🧪 Testing /analyze endpoint with MCDM...")
    
    # Use existing test image
    with open("test_image.png", "rb") as f:
        files = {"file": ("test_image.png", f, "image/png")}
        response = requests.post(f"{API_BASE}/analyze", files=files)
    
    if response.status_code == 200:
        data = response.json()
        print("✓ /analyze successful")
        
        # Check MCDM data
        if "mcdm" in data:
            print("✓ MCDM data present")
            mcdm = data["mcdm"]
            
            # Check aggregated result
            if "aggregated" in mcdm:
                agg = mcdm["aggregated"]
                print(f"  📊 Aggregated Decision: {agg['decision']}")
                print(f"     Repair Score: {agg['repair_score']}")
                print(f"     Replace Score: {agg['replace_score']}")
                print(f"     Confidence: {agg.get('confidence', 'N/A')}")
                print(f"     Votes: {agg.get('votes', 'N/A')}")
            
            # Check individual methods
            for method in ["ahp", "topsis", "entropy"]:
                if method in mcdm:
                    m = mcdm[method]
                    print(f"  ⚖️  {method.upper()}: {m['decision']} (R:{m['repair_score']}, Rep:{m['replace_score']})")
                    if "weights" in m:
                        print(f"     Weights: {m['weights']}")
            
            print("\n✅ MCDM integration working correctly!")
            return data["id"]
        else:
            print("❌ MCDM data missing from response")
            return None
    else:
        print(f"❌ /analyze failed: {response.status_code}")
        print(response.text)
        return None

def test_ahp_with_mcdm(entry_id):
    """Test /ahp endpoint returns MCDM results"""
    print(f"\n🧪 Testing /ahp endpoint with entry_id={entry_id}...")
    
    payload = {
        "entry_id": entry_id,
        "cost_weight": 5,
        "time_weight": 3,
        "area_weight": 7
    }
    
    response = requests.post(
        f"{API_BASE}/ahp",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✓ /ahp successful")
        
        if "mcdm" in data:
            print("✓ MCDM data present")
            mcdm = data["mcdm"]
            
            agg = mcdm.get("aggregated", {})
            print(f"  📊 New Decision: {agg.get('decision')}")
            print(f"     Repair Score: {agg.get('repair_score')}")
            print(f"     Replace Score: {agg.get('replace_score')}")
            
            print("\n✅ AHP recalculation with MCDM working!")
        else:
            print("❌ MCDM data missing from /ahp response")
    else:
        print(f"❌ /ahp failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("=" * 60)
    print("MCDM API Integration Test")
    print("=" * 60)
    
    # Test analyze
    entry_id = test_analyze_with_mcdm()
    
    # Test AHP recalculation if analyze succeeded
    if entry_id:
        test_ahp_with_mcdm(entry_id)
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)
