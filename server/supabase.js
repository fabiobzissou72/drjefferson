import { createClient } from '@supabase/supabase-js';

const readEnv = (name) => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
const supabaseServiceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase environment variables are not configured for the API server.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
