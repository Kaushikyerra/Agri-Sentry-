from fastapi import FastAPI, HTTPException, Query, Header
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
import os
import uuid
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from typing import Optional, Dict, Any, AsyncGenerator
from mqtt_client import start_mqtt_client, stop_mqtt_client
from utils.geospatial import (
    validate_geojson, 
    geojson_to_coordinates, 
    calculate_polygon_area,
    reverse_geocode,
    calculate_field_center
)
from otp_service import (
    generate_otp,
    send_otp_sms,
    create_otp_record,
    verify_otp,
    increment_otp_attempts,
    normalize_phone_number
)
from tasks.scheduler import init_scheduler, start_scheduler, stop_scheduler, get_scheduler_status, add_job
from tasks.daily_logs import generate_daily_logs_for_all_users
from ai_log_generator import generate_daily_log
from apscheduler.triggers.cron import CronTrigger
from notification_service import (
    send_task_reminder,
    log_voice_call,
    update_call_acknowledgment,
)

# Load env variables explicitly
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

# Lazy initialization of Supabase client
_supabase_client: Client = None

def get_supabase_client() -> Client:
    """Get or initialize Supabase client on first use (lazy initialization)"""
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
        return None
    
    try:
        _supabase_client = create_client(url, key)
        print("Supabase client initialized successfully")
        return _supabase_client
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        return None

# Alias for backward compatibility
supabase = None

class SupabaseProxy:
    """Proxy object that lazily initializes Supabase client on first use"""
    def __getattr__(self, name):
        client = get_supabase_client()
        if client is None:
            raise RuntimeError("Supabase client not initialized. Check environment variables.")
        return getattr(client, name)

# Replace supabase with proxy for transparent lazy initialization
supabase = SupabaseProxy()


def _is_table_missing(e: Exception) -> bool:
    msg = str(e)
    return "42P01" in msg or ("relation" in msg and "does not exist" in msg)


def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        token = authorization.replace("Bearer ", "")
        user_response = client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    print("Starting up...")
    start_mqtt_client()
    init_scheduler()
    start_scheduler()
    
    add_job(
        generate_daily_logs_for_all_users,
        CronTrigger(hour=19, minute=0, timezone="Asia/Kolkata"),
        job_id="daily_logs_7pm"
    )
    
    print("✅ MQTT client and Background scheduler started")
    print("📅 Daily log generation scheduled for 7:00 PM IST")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    stop_mqtt_client()
    stop_scheduler()
    print("✅ MQTT client and Background scheduler stopped")


app = FastAPI(title="AgriSentry API", lifespan=lifespan)

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
    grade: str = "Unspecified"
    days: Optional[int] = 7


class DeviceRegistration(BaseModel):
    device_id: str = Field(..., description="Unique device identifier (MAC address or custom ID)")
    device_name: str = Field(..., description="Human-readable device name")
    field_id: Optional[str] = Field(None, description="UUID of associated field")
    firmware_version: Optional[str] = Field(None, description="Firmware version")
    coordinates: Optional[Dict[str, float]] = Field(None, description="Device GPS coordinates")


class DeviceCalibration(BaseModel):
    calibration_data: Dict[str, Any] = Field(..., description="Sensor calibration parameters")


class FieldCreate(BaseModel):
    name: str = Field(..., description="Field name")
    crop_type: str = Field(..., description="Crop being cultivated")
    planting_date: Optional[str] = Field(None, description="Planting date (ISO format)")
    expected_harvest_date: Optional[str] = Field(None, description="Expected harvest date (ISO format)")
    geojson_boundary: Dict = Field(..., description="GeoJSON polygon boundary")
    soil_type: Optional[str] = Field(None, description="Soil type (e.g., loamy, clay, sandy)")


class FieldUpdate(BaseModel):
    name: Optional[str] = None
    crop_type: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    geojson_boundary: Optional[Dict] = None
    soil_type: Optional[str] = None


class SendOTPRequest(BaseModel):
    phone_number: str = Field(..., description="Phone number with country code (e.g., +919876543210)")


class VerifyOTPRequest(BaseModel):
    phone_number: str = Field(..., description="Phone number with country code")
    otp_code: str = Field(..., description="6-digit OTP code")
    name: Optional[str] = Field(None, description="User's full name (for first-time signup)")
    primary_language: Optional[str] = Field("en", description="User's preferred language (hi, en, etc.)")
    primary_crop: Optional[str] = Field("wheat", description="User's primary crop type")

@app.get("/")
def home():
    return {"message": "AgriSentry Price Prediction API is running."}


@app.get("/health/scheduler")
def scheduler_health():
    return get_scheduler_status()


@app.post("/auth/send-otp")
def send_otp(request: SendOTPRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    try:
        normalized_phone = normalize_phone_number(request.phone_number)
        
        if not normalized_phone.startswith("+"):
            raise HTTPException(status_code=400, detail="Invalid phone number format. Use international format with country code.")
        
        otp = generate_otp()
        
        success, message = create_otp_record(supabase, normalized_phone, otp)
        
        if not success:
            raise HTTPException(status_code=429, detail=message)
        
        sms_sent = send_otp_sms(normalized_phone, otp)
        
        return {
            "success": True,
            "message": "OTP sent successfully" if sms_sent else "OTP generated (SMS service unavailable)",
            "phone_number": normalized_phone,
            "otp_for_testing": otp if not sms_sent else None
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/verify-otp")
def verify_otp_endpoint(request: VerifyOTPRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    try:
        success, message, normalized_phone = verify_otp(supabase, request.phone_number, request.otp_code)
        
        if not success:
            increment_otp_attempts(supabase, request.phone_number, request.otp_code)
            raise HTTPException(status_code=400, detail=message)
        
        # Check if user already exists
        profile_check = supabase.table("profiles").select("*").eq("phone_number", normalized_phone).execute()
        
        if profile_check.data:
            # User exists, just update verification status
            user_profile = profile_check.data[0]
            user_id = user_profile["id"]
            
            supabase.table("profiles").update({
                "phone_verified": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", user_id).execute()
        else:
            # New user - create auth user first, then profile
            if not request.name:
                raise HTTPException(status_code=400, detail="Name is required for new user signup")
            
            # Create a unique email for auth
            email = f"{normalized_phone.replace('+', '')}@krishiai.local"
            password = "temp_" + normalized_phone[-6:]
            
            user_id = None
            try:
                # Create auth user
                auth_response = supabase.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "phone_number": normalized_phone,
                        "name": request.name
                    }
                })
                
                user_id = auth_response.user.id
                print(f"Auth user created: {user_id}")
            except Exception as auth_error:
                # User might already exist, try to get them
                print(f"Auth creation error: {auth_error}")
                # Try to find existing user by email
                user_id = None
            
            # If we couldn't create auth user, generate a UUID for the profile
            if not user_id:
                import uuid
                user_id = str(uuid.uuid4())
                print(f"Generated UUID for profile: {user_id}")
            
            # Now create the profile with the user_id
            new_user_data = {
                "id": user_id,
                "phone_number": normalized_phone,
                "phone_verified": True,
                "name": request.name,
                "primary_language": request.primary_language or "en",
                "primary_crop": getattr(request, 'primary_crop', None) or 'wheat'
            }
            
            supabase.table("profiles").insert(new_user_data).execute()
            print(f"Profile created for user: {user_id}")
        
        return {
            "success": True,
            "message": "OTP verified successfully",
            "user_id": user_id,
            "phone_number": normalized_phone,
            "is_new_user": not bool(profile_check.data),
            "email": f"{normalized_phone.replace('+', '')}@krishiai.local",
            "password": "temp_" + normalized_phone[-6:],
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Verify OTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/resend-otp")
def resend_otp(request: SendOTPRequest):
    return send_otp(request)


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
            print("Level 2 failed. Trying Level 3 (District Average)...")
            cur.execute("""
                SELECT AVG(modal_price) FROM market_prices 
                WHERE state ILIKE %s AND district ILIKE %s AND commodity ILIKE %s
                GROUP BY arrival_date
                ORDER BY arrival_date DESC LIMIT 7
            """, (req.state, fuzzy(req.district), fuzzy(req.commodity)))
            rows = cur.fetchall()

        # Try 4: Same State + Commodity
        if not rows:
            print("Level 3 failed. Trying Level 4 (State Average)...")
            cur.execute("""
                SELECT AVG(modal_price) FROM market_prices 
                WHERE state ILIKE %s AND commodity ILIKE %s
                GROUP BY arrival_date
                ORDER BY arrival_date DESC LIMIT 7
            """, (req.state, fuzzy(req.commodity)))
            rows = cur.fetchall()

        # Try 5: Global Commodity Average (Last Resort)
        if not rows:
             print("Level 4 failed. Trying Level 5 (Global Average)...")
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

    forecast_days = min(getattr(req, 'days', 7) or 7, 30)

    for i in range(forecast_days):
        target_date = today + timedelta(days=i+1)
        is_weekend = 1 if target_date.weekday() >= 5 else 0
        
        features_df = pd.DataFrame([[
            state_enc, dist_enc, mkt_enc, 
            comm_enc, var_enc, grade_enc,
            current_ma, current_lag, is_weekend
        ]], columns=feature_names)
        
        pred_price = model.predict(features_df)[0]

        try:
            tree_preds = np.array([tree.predict(features_df)[0] for tree in model.estimators_])
            std_dev = float(np.std(tree_preds))
            confidence_interval = {
                "lower": round(max(0, pred_price - 1.96 * std_dev), 2),
                "upper": round(pred_price + 1.96 * std_dev, 2),
                "std_dev": round(std_dev, 2),
            }
        except Exception:
            confidence_interval = None

        results.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "predicted_price": round(pred_price, 2),
            "confidence_interval": confidence_interval,
        })
        
        current_lag = pred_price
        history_buffer.insert(0, pred_price)
        history_buffer.pop()
        current_ma = sum(history_buffer) / len(history_buffer)

    return {
        "commodity": req.commodity,
        "market": req.market,
        "predictions": results,
        "forecast_days": forecast_days,
    }


@app.get("/market-prices/trends")
def get_price_trends(
    commodity: str = Query(...),
    state: str = Query(...),
    district: str = Query(None),
    days: int = Query(30, ge=7, le=90),
):
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

        params = [f"%{commodity}%", state]
        query = """
            SELECT arrival_date, AVG(modal_price) as avg_price,
                   MIN(min_price) as min_price, MAX(max_price) as max_price
            FROM market_prices
            WHERE commodity ILIKE %s AND state ILIKE %s
        """
        if district:
            query += " AND district ILIKE %s"
            params.append(f"%{district}%")

        query += f"""
            AND arrival_date >= CURRENT_DATE - INTERVAL '{days} days'
            GROUP BY arrival_date
            ORDER BY arrival_date ASC
        """

        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        trend_data = [
            {
                "date": str(r["arrival_date"]),
                "avg_price": round(float(r["avg_price"]), 2) if r["avg_price"] else None,
                "min_price": round(float(r["min_price"]), 2) if r["min_price"] else None,
                "max_price": round(float(r["max_price"]), 2) if r["max_price"] else None,
            }
            for r in rows
        ]

        return {
            "commodity": commodity,
            "state": state,
            "district": district,
            "days": days,
            "data": trend_data,
            "count": len(trend_data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        print(f"Database error: {e}. Returning mock data for demo purposes.")
        # Return mock market prices data for demo
        mock_data = [
            {
                "id": 1,
                "state": "Maharashtra",
                "district": "Nashik",
                "market": "Nashik Market",
                "commodity": "Tomato",
                "variety": "Local",
                "grade": "A",
                "arrival_date": datetime.now().isoformat(),
                "min_price": 15.0,
                "max_price": 25.0,
                "modal_price": 20.0
            },
            {
                "id": 2,
                "state": "Karnataka",
                "district": "Belgaum",
                "market": "Belgaum Market",
                "commodity": "Onion",
                "variety": "Local",
                "grade": "A",
                "arrival_date": datetime.now().isoformat(),
                "min_price": 10.0,
                "max_price": 18.0,
                "modal_price": 14.0
            },
            {
                "id": 3,
                "state": "Punjab",
                "district": "Ludhiana",
                "market": "Ludhiana Market",
                "commodity": "Wheat",
                "variety": "Local",
                "grade": "A",
                "arrival_date": datetime.now().isoformat(),
                "min_price": 2000.0,
                "max_price": 2200.0,
                "modal_price": 2100.0
            }
        ]
        return mock_data[:limit]

@app.get("/sensors/readings")
def get_sensor_readings(
    field_id: Optional[str] = Query(None, description="Filter by field ID"),
    sensor_type: Optional[str] = Query(None, description="Filter by sensor type"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(100, description="Max number of records to return")
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    try:
        query = supabase.table("sensor_readings").select("*")
        
        if field_id:
            query = query.eq("field_id", field_id)
        
        if sensor_type:
            query = query.eq("sensor_type", sensor_type)
        
        if start_date:
            query = query.gte("timestamp", start_date)
        
        if end_date:
            query = query.lte("timestamp", end_date)
        
        query = query.order("timestamp", desc=True).limit(limit)
        
        response = query.execute()
        
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        if _is_table_missing(e):
            return {"data": [], "count": 0}
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sensors/latest")
def get_latest_sensor_readings(
    field_id: Optional[str] = Query(None, description="Filter by field ID")
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    try:
        query = supabase.table("sensor_readings").select("*")
        
        if field_id:
            query = query.eq("field_id", field_id)
        
        query = query.order("timestamp", desc=True)
        
        response = query.execute()
        
        latest_readings = {}
        for reading in response.data:
            key = f"{reading['field_id']}_{reading['sensor_type']}"
            if key not in latest_readings:
                latest_readings[key] = reading
        
        return {"data": list(latest_readings.values()), "count": len(latest_readings)}
    except Exception as e:
        if _is_table_missing(e):
            return {"data": [], "count": 0}
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/devices/status")
def get_devices_status():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    try:
        response = supabase.table("devices").select("*").execute()
        
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        if _is_table_missing(e):
            return {"data": [], "count": 0}
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/register")
def register_device(device: DeviceRegistration, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        existing_device = supabase.table("devices").select("*").eq("device_id", device.device_id).execute()
        
        if existing_device.data:
            raise HTTPException(status_code=400, detail=f"Device with ID '{device.device_id}' already registered")
        
        if device.field_id:
            field_check = supabase.table("fields").select("id").eq("id", device.field_id).eq("user_id", user_id).execute()
            if not field_check.data:
                raise HTTPException(status_code=400, detail="Field not found or does not belong to user")
        
        mqtt_topic = f"krishi/{user_id}/{device.device_id}"
        
        device_data = {
            "user_id": user_id,
            "device_id": device.device_id,
            "device_name": device.device_name,
            "field_id": device.field_id,
            "firmware_version": device.firmware_version,
            "mqtt_topic": mqtt_topic,
            "coordinates": device.coordinates,
            "status": "offline",
            "last_seen": None
        }
        
        response = supabase.table("devices").insert(device_data).execute()
        
        return {
            "message": "Device registered successfully",
            "device": response.data[0],
            "mqtt_topic": mqtt_topic
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/devices/{device_id}/calibrate")
def calibrate_device(device_id: str, calibration: DeviceCalibration, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        device_check = supabase.table("devices").select("*").eq("device_id", device_id).eq("user_id", user_id).execute()
        
        if not device_check.data:
            raise HTTPException(status_code=404, detail="Device not found")
        
        update_data = {
            "status": "calibrating"
        }
        
        response = supabase.table("devices").update(update_data).eq("device_id", device_id).execute()
        
        return {
            "message": "Device calibration initiated",
            "device": response.data[0],
            "calibration_data": calibration.calibration_data
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fields")
def get_fields(authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        response = supabase.table("fields").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        if _is_table_missing(e):
            return {"data": [], "count": 0}
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fields")
def create_field(field: FieldCreate, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        if not validate_geojson(field.geojson_boundary):
            raise HTTPException(status_code=400, detail="Invalid GeoJSON format. Must be a Polygon with valid coordinates.")
        
        coordinates = geojson_to_coordinates(field.geojson_boundary)
        area_sqm = calculate_polygon_area(coordinates)
        
        field_data = {
            "user_id": user_id,
            "name": field.name,
            "crop_type": field.crop_type,
            "planting_date": field.planting_date,
            "expected_harvest_date": field.expected_harvest_date,
            "geojson_boundary": field.geojson_boundary,
            "soil_type": field.soil_type,
            "area_sqm": area_sqm
        }
        
        response = supabase.table("fields").insert(field_data).execute()
        
        created_field = response.data[0]
        
        center_lat, center_lng = calculate_field_center(field.geojson_boundary)
        location_info = reverse_geocode(center_lat, center_lng)
        
        return {
            "message": "Field created successfully",
            "field": created_field,
            "area_sqm": area_sqm,
            "area_acres": round(area_sqm / 4047, 2),
            "location": location_info
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/fields/{field_id}")
def update_field(field_id: str, field_update: FieldUpdate, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        field_check = supabase.table("fields").select("*").eq("id", field_id).eq("user_id", user_id).execute()
        
        if not field_check.data:
            raise HTTPException(status_code=404, detail="Field not found")
        
        update_data = {}
        
        if field_update.name is not None:
            update_data["name"] = field_update.name
        if field_update.crop_type is not None:
            update_data["crop_type"] = field_update.crop_type
        if field_update.planting_date is not None:
            update_data["planting_date"] = field_update.planting_date
        if field_update.expected_harvest_date is not None:
            update_data["expected_harvest_date"] = field_update.expected_harvest_date
        if field_update.soil_type is not None:
            update_data["soil_type"] = field_update.soil_type
        
        if field_update.geojson_boundary is not None:
            if not validate_geojson(field_update.geojson_boundary):
                raise HTTPException(status_code=400, detail="Invalid GeoJSON format")
            
            coordinates = geojson_to_coordinates(field_update.geojson_boundary)
            area_sqm = calculate_polygon_area(coordinates)
            
            update_data["geojson_boundary"] = field_update.geojson_boundary
            update_data["area_sqm"] = area_sqm
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("fields").update(update_data).eq("id", field_id).execute()
        
        return {
            "message": "Field updated successfully",
            "field": response.data[0]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/fields/{field_id}")
def delete_field(field_id: str, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        field_check = supabase.table("fields").select("*").eq("id", field_id).eq("user_id", user_id).execute()
        
        if not field_check.data:
            raise HTTPException(status_code=404, detail="Field not found")
        
        supabase.table("fields").delete().eq("id", field_id).execute()
        
        return {
            "message": "Field deleted successfully",
            "field_id": field_id
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs")
async def get_daily_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        query = supabase.table("daily_farm_logs").select("*").eq("user_id", user_id).order("log_date", desc=True)
        
        if start_date:
            query = query.gte("log_date", start_date)
        if end_date:
            query = query.lte("log_date", end_date)
        
        response = query.execute()
        
        return {
            "data": response.data or [],
            "count": len(response.data) if response.data else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs/{log_date}")
async def get_daily_log_by_date(log_date: str, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        response = supabase.table("daily_farm_logs").select("*").eq("user_id", user_id).eq("log_date", log_date).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Log not found for this date")
        
        return response.data
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/logs/generate")
async def manual_generate_log(
    log_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        from datetime import datetime as _dt, date as _date
        if log_date:
            target_date = _dt.fromisoformat(log_date).date()
        else:
            target_date = _date.today()
        
        result = await generate_daily_log(supabase, user_id, target_date)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks")
async def get_tasks(
    status: Optional[str] = None,
    field_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        query = supabase.table("tasks").select("*").eq("user_id", user_id).order("due_date", desc=False)
        
        if status:
            query = query.eq("status", status)
        if field_id:
            query = query.eq("field_id", field_id)
        if start_date:
            query = query.gte("due_date", start_date)
        if end_date:
            query = query.lte("due_date", end_date)
        
        response = query.execute()
        
        return {
            "data": response.data or [],
            "count": len(response.data) if response.data else 0
        }
    except Exception as e:
        if _is_table_missing(e):
            return {"data": [], "count": 0}
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tasks")
async def create_task(task_data: dict, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        task_data["user_id"] = user_id
        task_data["status"] = task_data.get("status", "pending")
        
        response = supabase.table("tasks").insert(task_data).execute()
        
        return response.data[0] if response.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/tasks/{task_id}")
async def update_task(task_id: str, task_data: dict, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        existing = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        response = supabase.table("tasks").update(task_data).eq("id", task_id).eq("user_id", user_id).execute()
        
        return response.data[0] if response.data else {}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        response = supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
        
        return {"success": True, "deleted": len(response.data) if response.data else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    completion_data: dict,
    authorization: Optional[str] = Header(None)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        from datetime import datetime
        
        update_data = {
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "completion_notes": completion_data.get("notes", ""),
            "completion_photo_url": completion_data.get("photo_url")
        }
        
        response = supabase.table("tasks").update(update_data).eq("id", task_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schemes")
async def get_schemes(
    state: Optional[str] = None,
    category: Optional[str] = None,
    min_land: Optional[float] = None
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    try:
        query = supabase.table("government_schemes").select("*")
        
        if state:
            query = query.or_(f"state.eq.{state},state.eq.All India")
        else:
            query = query.eq("state", "All India")
        
        if category:
            query = query.eq("category", category)
        
        response = query.execute()
        schemes = response.data or []
        
        if min_land is not None:
            schemes = [
                s for s in schemes
                if (s.get("min_land_acres") is None or s.get("min_land_acres") <= min_land)
                and (s.get("max_land_acres") is None or s.get("max_land_acres") >= min_land)
            ]
        
        return {"data": schemes, "count": len(schemes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schemes/{scheme_id}")
async def get_scheme_by_id(scheme_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    try:
        response = supabase.table("government_schemes").select("*").eq("id", scheme_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        return response.data
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schemes/check-eligibility")
async def check_eligibility(profile_data: dict, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    try:
        response = supabase.table("government_schemes").select("*").execute()
        all_schemes = response.data or []
        
        user_state = profile_data.get("state", "")
        user_land_acres = profile_data.get("land_acres", 0)
        
        eligible_schemes = []
        
        for scheme in all_schemes:
            score = 0
            
            if scheme.get("state") == "All India" or scheme.get("state") == user_state:
                score += 50
            else:
                continue
            
            min_land = scheme.get("min_land_acres")
            max_land = scheme.get("max_land_acres")
            
            if min_land is not None and user_land_acres < min_land:
                continue
            if max_land is not None and user_land_acres > max_land:
                continue
            
            score += 30
            
            eligible_schemes.append({
                **scheme,
                "eligibility_score": score
            })
        
        eligible_schemes.sort(key=lambda x: x["eligibility_score"], reverse=True)
        
        return {
            "eligible_schemes": eligible_schemes,
            "count": len(eligible_schemes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/alerts")
async def get_alerts(
    acknowledged: Optional[bool] = None,
    authorization: Optional[str] = Header(None)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        query = supabase.table("alerts").select("*").eq("user_id", user_id).order("created_at", desc=True)
        
        if acknowledged is not None:
            query = query.eq("acknowledged", acknowledged)
        
        response = query.execute()
        
        return {
            "data": response.data or [],
            "count": len(response.data) if response.data else 0
        }
    except Exception as e:
        if _is_table_missing(e):
            return {"data": [], "count": 0}
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    
    user_id = get_user_id_from_token(authorization)
    
    try:
        response = supabase.table("alerts").update({
            "acknowledged": True,
            "acknowledged_at": datetime.utcnow().isoformat()
        }).eq("id", alert_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/weather/current")
async def get_current_weather_endpoint(lat: float, lon: float):
    try:
        from weather_service import get_current_weather
        weather = get_current_weather(lat, lon)
        
        if not weather:
            raise HTTPException(status_code=503, detail="Weather service unavailable")
        
        return weather
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/weather/forecast")
async def get_forecast_endpoint(lat: float, lon: float, days: int = 5):
    try:
        from weather_service import get_forecast
        forecast = get_forecast(lat, lon, days)
        
        if not forecast:
            raise HTTPException(status_code=503, detail="Weather service unavailable")
        
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/weather/alerts")
async def get_weather_alerts_endpoint(lat: float, lon: float):
    try:
        from weather_service import check_weather_alerts
        alerts = check_weather_alerts(lat, lon)
        
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class VoiceReminderRequest(BaseModel):
    task_id: str
    phone_number: str
    task_title: str
    channel: str = "voice"
    language: str = "en"


@app.post("/voice/send-reminder")
async def send_voice_reminder(
    request: VoiceReminderRequest,
    authorization: str = Header(None),
):
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    call_sid = send_task_reminder(
        phone_number=request.phone_number,
        task_title=request.task_title,
        task_id=request.task_id,
        channel=request.channel,
        language=request.language,
    )

    if call_sid and request.channel == "voice" and supabase:
        log_voice_call(supabase, request.task_id, call_sid, request.phone_number)

    return {
        "success": call_sid is not None or True,
        "call_sid": call_sid,
        "channel": request.channel,
        "message": f"Reminder sent via {request.channel}",
    }


@app.post("/voice/acknowledge/{task_id}")
async def voice_acknowledge(task_id: str, Digits: str = ""):
    if supabase:
        update_call_acknowledgment(supabase, task_id, "", Digits)

    from twilio.twiml.voice_response import VoiceResponse
    from fastapi.responses import Response

    twiml = VoiceResponse()
    if Digits == "1":
        twiml.say("Thank you for acknowledging. Have a great farming day!", voice="alice")
    elif Digits == "2":
        twiml.say("Your task has been postponed by one day. Goodbye!", voice="alice")
    else:
        twiml.say("Thank you for calling KrishiAI. Goodbye!", voice="alice")

    return Response(content=str(twiml), media_type="application/xml")


@app.get("/voice/call-logs")
async def get_voice_call_logs(authorization: str = Header(None)):
    user_id = await get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not supabase:
        return {"data": [], "message": "Database not configured"}

    try:
        logs = supabase.table("voice_call_logs").select("*").order("initiated_at", desc=True).limit(50).execute()
        return {"data": logs.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
