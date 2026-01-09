import requests
import json

url = "http://localhost:8000/predict-price"

# Same payload as before
payload = {
    "state": "Assam",
    "district": "Nagaon",
    "market": "Dhing APMC",
    "commodity": "Jute", 
    "variety": "TD-5",
    "grade": "FAQ"
}

try:
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
