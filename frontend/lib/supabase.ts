/**
 * Supabase Client Configuration for Next.js
 * Reference: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file'
  )
}

/**
 * Create a Supabase client for client-side operations
 * This client automatically handles session management and token refresh
 * 
 * Reference: https://supabase.com/docs/guides/auth/auth-helpers/nextjs#client-side
 */
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance for convenience
export const supabase = createClient()
