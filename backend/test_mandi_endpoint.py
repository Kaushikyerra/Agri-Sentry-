import requests
import json

base_url = "http://localhost:8000/mandi-prices"

def test_endpoint(params=None, desc=""):
    print(f"\n--- Testing {desc} ---")
    try:
        resp = requests.get(base_url, params=params)
        print(f"URL: {resp.url}")
        print(f"Status: {resp.status_code}")
        data = resp.json()
        print(f"Record Count: {len(data)}")
        if len(data) > 0:
            print("First Record Sample:", data[0])
        else:
            print("Response is empty list []")
    except Exception as e:
        print(f"Error: {e}")

# 1. Test no params (should return list of 100)
test_endpoint(None, "No Params")

# 2. Test with State (e.g. 'Assam' or one that exists)
# check inspect_data.py output earlier for valid states
test_endpoint({"state": "Kerala"}, "State=Kerala")

# 3. Test with non-existent state
test_endpoint({"state": "NonExistent"}, "State=NonExistent")
