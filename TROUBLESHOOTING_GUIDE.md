# 🔧 Troubleshooting Guide

## Common Issues & Solutions

---

## 1. Database Errors

### Error: "Could not find the 'name' column of 'profiles'"

**Cause:** Migration not pushed to Supabase

**Fix:**
```powershell
cd C:\Users\kaush\Shayak\Agri-Sentry-
supabase db push
```

**Verify:**
```powershell
supabase db list
```

Should show:
```
20260311000010_add_name_to_profiles.sql ✓
```

---

### Error: "null value in column 'id' of relation 'profiles'"

**Cause:** Backend not generating UUID for new users

**Fix:** Already fixed in `backend/api.py`. Just restart backend:
```powershell
# Terminal 1: Press Ctrl+C
# Terminal 1: Run again
python api.py
```

---

## 2. Network Errors

### Error: "Network request failed" or "Network error"

**Cause:** Mobile app can't reach backend

**Step 1: Check IP Address**
```powershell
ipconfig | Select-String "IPv4"
```

Look for IPv4 address. Should be something like `10.21.135.117`

**Step 2: Update Mobile App**

If IP is different from `10.21.135.117`, update these files:

**File 1: `mobile/src/screens/LoginScreen.tsx`**
- Find: `const API_URL = 'http://10.21.135.117:8000';`
- Replace with your IP: `const API_URL = 'http://YOUR_IP:8000';`

**File 2: `mobile/src/screens/DashboardScreen.tsx`**
- Find: `const API_URL = 'http://10.21.135.117:8000';`
- Replace with your IP: `const API_URL = 'http://YOUR_IP:8000';`

**File 3: `mobile/src/screens/FieldsScreen.tsx`**
- Find: `const API_URL = 'http://10.21.135.117:8000';`
- Replace with your IP: `const API_URL = 'http://YOUR_IP:8000';`

**Step 3: Restart Mobile App**
```powershell
# Terminal 2: Press Ctrl+C
# Terminal 2: Run again
npm start
```

**Step 4: Reload in Emulator**
- Press 'r' in Terminal 2 to reload

---

### Error: "Backend not running" or "Cannot reach backend"

**Step 1: Check if Backend is Running**
```powershell
netstat -ano | Select-String ":8000"
```

Should show:
```
TCP    0.0.0.0:8000    0.0.0.0:0    LISTENING
```

**Step 2: If Not Running, Start Backend**
```powershell
cd C:\Users\kaush\Shayak\Agri-Sentry-\backend
python api.py
```

**Step 3: Check Firewall**
- Windows Defender might block port 8000
- Go to: Settings → Firewall & Network Protection → Allow an app through firewall
- Add Python to allowed apps

---

## 3. OTP Issues

### Issue: OTP Not Appearing in Backend Logs

**Cause 1: Twilio credentials missing**

Check `backend/.env`:
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

If missing, add them and restart backend.

**Cause 2: Backend not restarted after code changes**

Restart backend:
```powershell
# Terminal 1: Press Ctrl+C
# Terminal 1: Run again
python api.py
```

**Cause 3: Phone number format wrong**

- Must include country code: `+917660935999`
- Or just 10 digits: `7660935999` (will be converted to `+917660935999`)

---

### Issue: "OTP sent successfully" but no OTP in logs

**This is expected!** Twilio trial account limitation.

**Solution:**
1. Check backend logs for: `📝 OTP for testing: 123456`
2. Copy the 6-digit code
3. Enter in mobile app

---

### Issue: "Invalid OTP" error

**Cause 1: Wrong OTP code**
- Copy exact code from backend logs
- Don't add extra spaces

**Cause 2: OTP expired**
- OTP valid for 10 minutes
- If more than 10 minutes passed, send new OTP

**Cause 3: Too many attempts**
- Max 3 attempts per OTP
- Send new OTP if all 3 failed

---

## 4. Mobile App Issues

### Issue: App Crashes on Startup

**Cause:** Missing dependencies

**Fix:**
```powershell
cd C:\Users\kaush\Shayak\Agri-Sentry-\mobile
npm install
npm start
```

---

### Issue: Language Selection Not Showing

**Cause:** App state issue

**Fix:**
```powershell
# Terminal 2: Press Ctrl+C
# Terminal 2: Run again
npm start
# Press 'a' to reload in emulator
```

---

### Issue: Crop Names in English Even After Selecting Telugu

**Cause:** Already fixed in latest code

**Fix:** Make sure you have latest `LoginScreen.tsx`:
```powershell
# Terminal 2: Press 'r' to reload
```

---

### Issue: "Login successful" but no navigation to Dashboard

**Cause:** Session not created

**Fix:** Already fixed in latest code. Restart backend and mobile:
```powershell
# Terminal 1: Ctrl+C and restart
python api.py

# Terminal 2: Ctrl+C and restart
npm start
```

---

## 5. Emulator Issues

### Issue: Emulator Won't Start

**Solution 1: Use Android Studio**
```
Android Studio → Tools → Device Manager → Play button
```

**Solution 2: Use Physical Device**
```
Connect phone via USB
Enable USB Debugging
Press 'a' in Terminal 2
```

---

### Issue: "Press 'a' to open Android" but nothing happens

**Cause:** Emulator not running

**Fix:**
1. Open Android Studio
2. Go to Tools → Device Manager
3. Click Play button on any device
4. Wait for emulator to fully load
5. Press 'a' in Terminal 2

---

## 6. Supabase Issues

### Issue: "Supabase client not configured"

**Cause:** Missing environment variables

**Check `backend/.env`:**
```
VITE_SUPABASE_URL=https://jqmuyhoyuxytxyuvinju.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If missing, add them and restart backend.

---

### Issue: "Migration already applied"

**This is OK!** Just means migration was already pushed.

---

## 7. Twilio Issues

### Issue: "The number is unverified"

**This is expected!** Twilio trial account limitation.

**Solution:**
1. OTP will be logged in backend
2. Copy from logs and enter manually
3. To fix permanently: Verify phone at https://www.twilio.com/user/account/phone-numbers/verified

---

## 8. Performance Issues

### Issue: App Slow or Freezing

**Cause:** Too many processes running

**Fix:**
1. Close unnecessary apps
2. Restart emulator
3. Restart backend and mobile

---

## 9. Port Already in Use

### Error: "Address already in use" on port 8000

**Cause:** Another process using port 8000

**Fix:**
```powershell
# Find process using port 8000
netstat -ano | Select-String ":8000"

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Restart backend
python api.py
```

---

## 10. Quick Diagnostics

### Check Everything is Running

```powershell
# Check backend
netstat -ano | Select-String ":8000"

# Check backend responds
curl http://10.21.135.117:8000/health/scheduler

# Check Supabase connection
# (Look in backend logs for "Supabase client initialized")
```

---

## 📞 Still Having Issues?

1. **Check backend logs** - Most errors are logged there
2. **Check mobile console** - Press 'i' in Terminal 2 for iOS logs
3. **Check network** - Make sure IP address is correct
4. **Restart everything** - Sometimes a fresh start fixes it

---

## 🎯 Quick Restart Procedure

If everything is broken:

```powershell
# Terminal 1: Stop backend
Ctrl+C

# Terminal 2: Stop mobile
Ctrl+C

# Terminal 1: Restart backend
cd C:\Users\kaush\Shayak\Agri-Sentry-\backend
python api.py

# Terminal 2: Restart mobile
cd C:\Users\kaush\Shayak\Agri-Sentry-\mobile
npm start

# Terminal 2: Reload in emulator
Press 'a'
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 8000
- [ ] Mobile app running
- [ ] Emulator open
- [ ] IP address correct in mobile app
- [ ] Database migration pushed
- [ ] Supabase credentials in `.env`
- [ ] Twilio credentials in `.env`
- [ ] No network errors in mobile app
- [ ] OTP appearing in backend logs
- [ ] Login successful message showing

