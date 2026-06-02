import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

/** Server-only client (bypasses RLS). Use only in backend routes. */
export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Client scoped to the user's JWT (respects RLS). */
export function supabaseAsUser(accessToken) {
  return createClient(config.supabase.url, config.supabase.anonKey || config.supabase.serviceRoleKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
