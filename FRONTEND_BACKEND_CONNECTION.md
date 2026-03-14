# Connect Frontend to Backend

## Frontend Deployed ✅
- **URL**: https://kisan-shayak.vercel.app
- **Inspect**: https://vercel.com/yerra-kaushiks-projects/kisan-shayak

## Backend Deployed ✅
- **Railway URL**: Get this from your Railway dashboard

## Next Steps

### 1. Get Your Railway Backend URL
1. Go to https://railway.app
2. Select your Agri-Sentry backend project
3. Click on the service
4. Look for the "Public URL" or "Domain" section
5. Copy the URL (should look like: `https://your-service-name.railway.app`)

### 2. Update Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your "kisan-shayak" project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```
VITE_BACKEND_URL = https://your-railway-backend-url
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_GEMINI_API_KEY = your_gemini_api_key
VITE_OPENWEATHER_API_KEY = your_openweather_api_key
```

### 3. Redeploy Frontend
After updating environment variables:
1. Go to Vercel dashboard
2. Select kisan-shayak project
3. Click "Redeploy" or push a new commit to trigger auto-deploy

### 4. Test Connection
1. Visit https://kisan-shayak.vercel.app
2. Try logging in or making an API call
3. Check browser console (F12) for any errors
4. Check Vercel logs for deployment issues

## Troubleshooting

**If frontend can't reach backend:**
- Verify VITE_BACKEND_URL is set correctly in Vercel
- Check that Railway backend is running (check Railway logs)
- Ensure CORS is enabled on backend (it should be by default)
- Check browser console for specific error messages

**If environment variables aren't loading:**
- Redeploy after updating variables
- Clear browser cache (Ctrl+Shift+Delete)
- Check that variable names match exactly (case-sensitive)
