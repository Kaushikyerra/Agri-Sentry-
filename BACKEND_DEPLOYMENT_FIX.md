# Backend Deployment Fix - Supabase Lazy Initialization

## Problem Fixed
The backend was crashing on Railway with the error:
```
supabase._sync.client.SupabaseException: Invalid URL
```

This occurred because the Supabase client was being initialized at import time (when the module loads) before environment variables were properly loaded in the Railway environment.

## Solution Implemented
Implemented **lazy initialization** for the Supabase client across all backend modules:

### Files Modified
1. **backend/mqtt_client.py** - Added `get_supabase_client()` function
2. **backend/api.py** - Added `get_supabase_client()` function and `SupabaseProxy` class
3. **backend/seed_schemes.py** - Added `get_supabase_client()` function
4. **backend/tasks/daily_logs.py** - Added `get_supabase_client()` function

### How It Works
- Supabase client is now created **on first use**, not at import time
- Environment variables are loaded before the client is initialized
- All database operations work transparently through the lazy initialization

## Redeploying to Railway

### Step 1: Pull Latest Code
```bash
git pull origin main
```

### Step 2: Set Environment Variables in Railway
Go to your Railway project dashboard and ensure these variables are set:

```
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
VITE_GEMINI_API_KEY=your_gemini_key
```

### Step 3: Redeploy
1. Go to Railway dashboard
2. Select your backend service
3. Click "Deploy" or push a new commit to trigger auto-deploy
4. Monitor the logs to ensure it starts without errors

### Step 4: Verify
Check the Railway logs for:
```
Supabase client initialized successfully
✅ MQTT client and Background scheduler started
```

## Testing Locally
To test the fix locally:

```bash
cd backend
python -m pip install -r requirements.txt
python api.py
```

The server should start without the "Invalid URL" error.

## Key Changes Summary
- **Before**: `supabase = create_client(SUPABASE_URL, SUPABASE_KEY)` at import time
- **After**: `supabase = get_supabase_client()` on first use

This ensures environment variables are loaded before attempting to create the Supabase client.
