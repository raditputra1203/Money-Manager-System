import { supabaseAdmin } from '../lib/supabase.js'
import { httpError } from './errorHandler.js'

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw httpError(401, 'Token not found. Expected: Authorization: Bearer <token>')

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) throw httpError(401, 'Invalid or expired token')

    req.user = data.user
    req.accessToken = token
    next()
  } catch (err) {
    next(err)
  }
}
