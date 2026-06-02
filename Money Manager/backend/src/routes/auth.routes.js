import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler, httpError } from '../middleware/errorHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { seedNewUser } from '../services/seed.service.js'

const router = Router()

/** POST /api/auth/register */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '')
      .toLowerCase()
      .trim()
    const password = String(req.body.password || '')
    const name = String(req.body.name || req.body.username || '').trim()

    if (!email || !password) throw httpError(400, 'Email dan password wajib')
    if (password.length < 6) throw httpError(400, 'Password minimal 6 karakter')

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    })
    if (error) throw httpError(400, error.message)

    await seedNewUser(data.user.id, name || email)

    const { data: signIn, error: signErr } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (signErr) throw httpError(500, signErr.message)

    res.status(201).json({
      user: { id: signIn.user.id, email: signIn.user.email, name: name || email },
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
        expires_at: signIn.session.expires_at,
      },
    })
  }),
)

/** POST /api/auth/login */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '')
      .toLowerCase()
      .trim()
    const password = String(req.body.password || '')
    if (!email || !password) throw httpError(400, 'Email dan password wajib')

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (error) throw httpError(401, 'Email atau password salah')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', data.user.id)
      .maybeSingle()

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.display_name || data.user.user_metadata?.display_name || email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    })
  }),
)

/** GET /api/auth/me — requires JWT */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, premium')
      .eq('id', req.user.id)
      .maybeSingle()

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: profile?.display_name || req.user.user_metadata?.display_name || req.user.email,
        premium: !!profile?.premium,
      },
    })
  }),
)

/** PATCH /api/auth/me — update display_name */
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim()
    if (!name) throw httpError(400, 'Nama wajib diisi')

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ display_name: name })
      .eq('id', req.user.id)
    if (error) throw error

    res.json({ ok: true })
  }),
)

export default router
