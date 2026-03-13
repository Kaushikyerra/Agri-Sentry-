# 🔑 API Keys Required for KrishiAI

## 📋 Current Status

**Already Configured (in .env):**
- ✅ Supabase (Database)
- ✅ Twilio (SMS/OTP)
- ✅ MQTT Broker (HiveMQ)

**Need to Add:**
- 🔴 OpenWeather API Key
- 🔴 Google Gemini API Key
- 🔴 Sarvam AI API Key (for speech-to-speech alternative)

---

## 🔴 API Keys You Need to Get

### 1. OpenWeather API Key
**Purpose:** Weather data, forecasts, alerts

**Get it from:** https://openweathermap.org/api
- Sign up for free account
- Go to API keys section
- Copy your API key
- Free tier: 1,000 calls/day

**Add to:** `backend/.env`
```
OPENWEATHER_API_KEY=your_key_here
```

---

### 2. Google Gemini API Key
**Purpose:** AI-powered features (daily logs, recommendations, voice assistant)

**Get it from:** https://aistudio.google.com/app/apikey
- Sign in with Google account
- Click "Create API Key"
- Copy the key
- Free tier: 60 requests/minute

**Add to:** `backend/.env` and `frontend/.env.local`
```
VITE_GEMINI_API_KEY=your_key_here
```

---

### 3. Sarvam AI API Key (Alternative for Speech-to-Speech)
**Purpose:** Speech recognition and synthesis (alternative to Google)

**Get it from:** https://www.sarvam.ai/
- Sign up for free account
- Go to API keys section
- Copy your API key
- Free tier: Limited requests

**Add to:** `backend/.env`
```
SARVAM_API_KEY=your_key_here
```

**Note:** Sarvam AI is good for:
- ✅ Indian language support (Hindi, Telugu, Marathi, Kannada, Tamil)
- ✅ Better for agricultural context
- ✅ Lower latency for India
- ✅ Cost-effective

---

## ✅ Already Configured (No Action Needed)

### Supabase
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Twilio (SMS/OTP)
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### MQTT Broker
```
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
```

---

## 📝 How to Add API Keys

### Step 1: Get the Keys
- OpenWeather: https://openweathermap.org/api
- Gemini: https://aistudio.google.com/app/apikey
- Sarvam: https://www.sarvam.ai/

### Step 2: Update backend/.env
```
OPENWEATHER_API_KEY=your_openweather_key
VITE_GEMINI_API_KEY=your_gemini_key
SARVAM_API_KEY=your_sarvam_key
```

### Step 3: Update frontend/.env.local
```
VITE_GEMINI_API_KEY=your_gemini_key
```

### Step 4: Update mobile/src/lib/supabase.ts
```typescript
const GEMINI_API_KEY = 'your_gemini_key';
const SARVAM_API_KEY = 'your_sarvam_key';
```

### Step 5: Restart Services
```powershell
# Backend
cd backend
python api.py

# Frontend
npm run dev

# Mobile
cd mobile
npm start
```

---

## 🎯 Priority Order

1. **CRITICAL:** OpenWeather API Key
   - Needed for weather features
   - Used in Weather page
   - Used in alerts

2. **HIGH:** Google Gemini API Key
   - Needed for AI features
   - Daily log generation
   - Recommendations
   - Voice assistant

3. **OPTIONAL:** Sarvam AI API Key
   - Alternative to Google for speech
   - Better for Indian languages
   - Can use Google as fallback

---

## 💡 Sarvam AI vs Google Gemini

| Feature | Sarvam AI | Google Gemini |
|---------|-----------|---------------|
| Speech Recognition | ✅ Yes | ✅ Yes |
| Speech Synthesis | ✅ Yes | ❌ No |
| Indian Languages | ✅ Excellent | ⚠️ Good |
| Cost | 💰 Cheap | 💰 Free tier |
| Latency | ⚡ Low (India) | ⚡ Medium |
| Setup | 📝 Simple | 📝 Simple |

**Recommendation:** Use Sarvam AI for speech-to-speech, Google Gemini for AI features

---

## 🔧 Implementation

### Backend (api.py)
```python
# Weather
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# AI Features
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")

# Speech
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
```

### Frontend (React)
```typescript
// Gemini for AI
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Sarvam for speech
const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY;
```

### Mobile (React Native)
```typescript
// Gemini for AI
const GEMINI_API_KEY = 'your_key';

// Sarvam for speech
const SARVAM_API_KEY = 'your_key';
```

---

## ✨ Features Enabled by Each Key

### OpenWeather API Key
- ✅ Current weather display
- ✅ 5-day forecast
- ✅ Weather alerts
- ✅ Location-based weather
- ✅ Severe weather warnings

### Google Gemini API Key
- ✅ Daily farm log generation
- ✅ AI recommendations
- ✅ Voice assistant
- ✅ Crop advice
- ✅ Problem diagnosis

### Sarvam AI API Key
- ✅ Speech-to-text (Indian languages)
- ✅ Text-to-speech (Indian languages)
- ✅ Voice commands
- ✅ Voice responses
- ✅ Multilingual support

---

## 📞 Support

- **OpenWeather Docs:** https://openweathermap.org/api
- **Gemini Docs:** https://ai.google.dev/docs
- **Sarvam Docs:** https://www.sarvam.ai/docs

---

## 🚀 Next Steps

1. Get OpenWeather API key
2. Get Google Gemini API key
3. Get Sarvam AI API key (optional)
4. Add to .env files
5. Restart services
6. Test features

