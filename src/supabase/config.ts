import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Provide fallback values for build-time static analysis
// This prevents the "supabaseUrl is required" error during Vercel builds
const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
  console.warn('Supabase credentials missing. Check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-for-build.supabase.co',
  supabaseAnonKey || 'placeholder'
);

