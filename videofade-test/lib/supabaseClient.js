/**
 * Supabase Client Configuration
 *
 * Provides reusable Supabase client instances for server-side and API routes
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found in environment variables');
  console.warn('   Required: SUPABASE_URL and SUPABASE_ANON_KEY');
}

/**
 * Client-side Supabase client (uses anon key with RLS policies)
 * Use this for operations that respect Row Level Security
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client (uses service role key, bypasses RLS)
 * Use this for admin operations and server-side operations
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
  supabaseAdmin
};
