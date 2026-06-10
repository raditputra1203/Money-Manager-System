import { supabaseAdmin } from '../lib/supabase.js'

/** Seed profile for a new user. Categories are now global (002_global_categories.sql).
 *  Books and accounts start empty — user creates them manually. */
export async function seedNewUser(userId, displayName) {
  const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    display_name: displayName || '',
    settings: { notifications: true, compactNumbers: false },
  })
  if (profileErr) throw profileErr

  return { defaultBookId: null }
}
