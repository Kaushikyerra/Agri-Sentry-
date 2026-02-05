from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load env variables explicitly
load_dotenv()

app = FastAPI(title="AgriSentry Price Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Load model and encoders
try:
    model = joblib.load('price_model.pkl')
    encoders = joblib.load('encoders.pkl')
    print("Model and encoders loaded successfully.")
except Exception as e:
    print(f"Error loading model/encoders: {e}")
    model = None
    encoders = None

class PredictionRequest(BaseModel):
    state: str
    district: str
    market: str
    commodity: str
    variety: str
    grade: str = "Unspecified" # Default if not provided

@app.get("/")
def home():
    return {"message": "AgriSentry Price Prediction API is running."}

@app.post("/predict-price")
def predict_price(req: PredictionRequest):
    if not model or not encoders:
        raise HTTPException(status_code=500, detail="Model not loaded.")

    predictions = []
    
    # We predict for the next 7 days
    today = datetime.now()
    
    try:
        # 1. Encode string inputs
        def safe_encode(col, val):
            if val in encoders[col].classes_:
                return encoders[col].transform([val])[0]
            else:
                return 0
                
        state_enc = safe_encode('state', req.state)
        dist_enc = safe_encode('district', req.district)
        mkt_enc = safe_encode('market', req.market)
        comm_enc = safe_encode('commodity', req.commodity)
        var_enc = safe_encode('variety', req.variety)
        grade_enc = safe_encode('grade', req.grade)

        pass 
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Encoding error: {str(e)}")

    # DB Connection
    try:
        import psycopg2
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "SmartAgriDB"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS", "password"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            sslmode='prefer'
        )
        cur = conn.cursor()
        
        # Helper for fuzzy params
        def fuzzy(s):
            return f"%{s}%"

        # Try 1: Exact/Specific Match (Fuzzy on content, strict on hierarchy)
        rows = []
        cur.execute("""
            SELECT modal_price FROM market_prices 
            WHERE state ILIKE %s AND district ILIKE %s AND market ILIKE %s AND commodity ILIKE %s AND variety ILIKE %s
            ORDER BY arrival_date DESC LIMIT 7
        """, (req.state, req.district, fuzzy(req.market), fuzzy(req.commodity), fuzzy(req.variety)))
        rows = cur.fetchall()

        # Try 2: Same Market + Commodity (Ignore Variety, Fuzzy Commodity)
        if not rows:
            print(f"Level 1 failed for {req.commodity} in {req.market}. Trying Level 2 (Fuzzy Commodity)...")
            cur.execute("""
                SELECT modal_price FROM market_prices 
                WHERE state ILIKE %s AND district ILIKE %s AND market ILIKE %s AND commodity ILIKE %s
                ORDER BY arrival_date DESC LIMIT 7
            """, (req.state, req.district, fuzzy(req.market), fuzzy(req.commodity)))
            rows = cur.fetchall()

        # Try 3: Same District + Commodity (Ignore Market)
        if not rows:
            print(f"Level 2 failed. Trying Level 3 (District Average)...")
            cur.execute("""
                SELECT AVG(modal_price) FROM market_prices 
                WHERE state ILIKE %s AND district ILIKE %s AND commodity ILIKE %s
                GROUP BY arrival_date
                ORDER BY arrival_date DESC LIMIT 7
            """, (req.state, fuzzy(req.district), fuzzy(req.commodity)))
            rows = cur.fetchall()

        # Try 4: Same State + Commodity
        if not rows:
            print(f"Level 3 failed. Trying Level 4 (State Average)...")
            cur.execute("""
                SELECT AVG(modal_price) FROM market_prices 
                WHERE state ILIKE %s AND commodity ILIKE %s
                GROUP BY arrival_date
                ORDER BY arrival_date DESC LIMIT 7
            """, (req.state, fuzzy(req.commodity)))
            rows = cur.fetchall()

        # Try 5: Global Commodity Average (Last Resort)
        if not rows:
             print(f"Level 4 failed. Trying Level 5 (Global Average)...")
             cur.execute("""
                SELECT AVG(modal_price) FROM market_prices 
                WHERE commodity ILIKE %s
                GROUP BY arrival_date
                ORDER BY arrival_date DESC LIMIT 7
            """, (fuzzy(req.commodity),))
             rows = cur.fetchall()

        cur.close()
        conn.close()
        
        if not rows:
            print(f"All levels failed for {req.commodity}. No data found.")
            # Start of Logic Change: Raise error instead of fake prediction
            raise HTTPException(status_code=404, detail=f"No pricing data found for commodity '{req.commodity}' in market '{req.market}'. Please check the spelling or try a different combination.")
            # End of Logic Change

        # Flatten results (some are tuples of 1)
        prices = [float(r[0]) for r in rows if r[0] is not None]
        if not prices:
             raise HTTPException(status_code=404, detail="Found data records but prices were empty.")
             
        current_lag = prices[0]
        current_ma = sum(prices) / len(prices)
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"DB Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if 'prices' in locals() and prices:
        history_buffer = [p for p in prices]
    else:
        history_buffer = [current_lag] * 7

    feature_names = [
        'state_encoded', 'district_encoded', 'market_encoded', 
        'commodity_encoded', 'variety_encoded', 'grade_encoded',
        'moving_avg_7d', 'price_lag_1d', 'is_weekend'
    ]
    
    results = []

    for i in range(7):
        target_date = today + timedelta(days=i+1)
        is_weekend = 1 if target_date.weekday() >= 5 else 0
        
        # Create DataFrame regarding feature names to avoid warnings
        features_df = pd.DataFrame([[
            state_enc, dist_enc, mkt_enc, 
            comm_enc, var_enc, grade_enc,
            current_ma, current_lag, is_weekend
        ]], columns=feature_names)
        
        pred_price = model.predict(features_df)[0]
        results.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_price": round(pred_price, 2)
        })
        
        current_lag = pred_price
        history_buffer.insert(0, pred_price)
        history_buffer.pop()
        current_ma = sum(history_buffer) / len(history_buffer)

    return {
        "commodity": req.commodity,
        "market": req.market,
        "predictions": results
    }

@app.get("/mandi-prices")
def get_mandi_prices(state: str = None, district: str = None, limit: int = 100):
    try:
        import psycopg2
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "SmartAgriDB"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS", "password"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            sslmode='prefer'
        )
        from psycopg2.extras import RealDictCursor
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM market_prices WHERE 1=1"
        params = []
        
        if state:
            query += " AND state ILIKE %s"
            params.append(state)
        if district:
            query += " AND district ILIKE %s"
            params.append(district)
            
        query += " ORDER BY arrival_date DESC LIMIT %s"
        params.append(limit)
        
        cur.execute(query, tuple(params))
        results = cur.fetchall()
        
        cur.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
