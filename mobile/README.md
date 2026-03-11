# KrishiAI Mobile App (Expo)

React Native mobile app for KrishiAI using Expo.

## Quick Start

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start the App
```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### 3. Test on Your Phone
- Download Expo Go app from App Store or Play Store
- Scan the QR code from terminal
- App will load on your phone

## Project Structure
```
mobile/
├── App.tsx                 # Main app with navigation
├── app.json               # Expo config
├── package.json           # Dependencies
├── src/
│   ├── lib/
│   │   └── supabase.ts   # Supabase client
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── SensorScreen.tsx
│       ├── VoiceScreen.tsx
│       └── ProfileScreen.tsx
```

## Features
- ✅ OTP-based login
- ✅ Real-time sensor dashboard
- ✅ Voice assistant integration
- ✅ Profile management
- ✅ Bottom tab navigation
- ✅ Offline support (with Expo)

## Build for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## Environment Setup
Update `src/lib/supabase.ts` with your Supabase credentials.

## Backend Connection
Make sure your backend is running on `http://localhost:8000` for development.
