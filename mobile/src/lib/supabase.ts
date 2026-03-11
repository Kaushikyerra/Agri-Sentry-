import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// You need to set these in mobile/.env file
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jqmuyhoyuxytxyuvinju.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Check if key is set
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('placeholder') || SUPABASE_ANON_KEY.includes('d0Yd0')) {
  console.error('❌ Supabase API key is not set or is a placeholder!');
  console.error('Please create mobile/.env file with:');
  console.error('VITE_SUPABASE_URL=https://jqmuyhoyuxytxyuvinju.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=YOUR_ACTUAL_SUPABASE_ANON_KEY');
  console.error('');
  console.error('To get your Supabase anon key:');
  console.error('1. Go to https://jqmuyhoyuxytxyuvinju.supabase.co');
  console.error('2. Go to Project Settings → API');
  console.error('3. Copy the "anon/public" key (starts with eyJ...)');
  console.error('4. Paste it in mobile/.env as VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
