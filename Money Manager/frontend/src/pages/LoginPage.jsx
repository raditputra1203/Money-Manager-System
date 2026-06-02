import { useEffect, useState } from 'react'
import { IconClose } from '../components/icons/NavGlyph.jsx'
import { isDemoMode, login as apiLogin, register as apiRegister } from '../api.js'
import './LoginPage.css'

const USERS_KEY = 'mm_demo_users'

function delay(ms = 100) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getUsers() {
  const users = loadUsers()
  const key = 'demo@money.app'
  if (!users[key]) {
    users[key] = { password: 'demo123', name: 'Demo User' }
    saveUsers(users)
  }
  return users
}

function IconEye({ off }) {
  if (off) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.4 10.4 0 0112 5c4.2 0 7.6 2.7 9 6.5a10.1 10.1 0 01-3.4 4.4M6.7 6.7C4.8 8 3.3 9.9 3 12c1.4 3.8 4.8 6.5 9 6.5.7 0 1.4-.1 2-.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M7.8 7.8C6.3 8.8 5 10.3 4.2 12c1.4 3.8 4.8 6.5 9 6.5 1.2 0 2.3-.2 3.4-.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5c-4.2 0-7.6 2.7-9 6.5 1.4 3.8 4.8 6.5 9 6.5s7.6-2.7 9-6.5C19.6 7.7 16.2 5 12 5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.5 16.5v-4h1.2l.2-1.5h-1.4V9.8c0-.4.1-.7.7-.7h.8V7.7h-1.2c-1.5 0-2.4.8-2.4 2.2v1.1H9.5v1.5h1.1v4h2.9z"
      />
    </svg>
  )
}

const REMEMBER_KEY = 'mm_remember_email'

function readStoredEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || ''
  } catch {
    return ''
  }
}

export default function LoginPage({ onAuthenticated }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState(readStoredEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => Boolean(readStoredEmail()))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const clearFeedback = () => {
    setMessage('')
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    clearFeedback()
    setLoading(true)
    try {
      const key = String(email).toLowerCase().trim()
      if (!key || !password) {
        throw new Error('Email dan password wajib diisi.')
      }

      if (!isDemoMode()) {
        const res = await apiLogin(key, password)
        try {
          if (rememberMe) localStorage.setItem(REMEMBER_KEY, key)
          else localStorage.removeItem(REMEMBER_KEY)
        } catch { /* ignore */ }
        onAuthenticated?.({ email: key, name: res.user.name, accessToken: res.session.access_token, refreshToken: res.session.refresh_token, expiresAt: res.session.expires_at })
        return
      }

      await delay()
      const users = getUsers()
      const user = users[key]
      if (!user || user.password !== password) {
        throw new Error('Email atau password salah.')
      }
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, key)
        else localStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* ignore */
      }
      console.info('[Money Manager] demo login', { email: key, name: user.name })
      onAuthenticated?.({ email: key, name: user.name })
    } catch (err) {
      setError(err.message || 'Gagal login.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    clearFeedback()
    setLoading(true)
    try {
      const key = String(email).toLowerCase().trim()
      if (!username?.trim() || !key || !password) {
        throw new Error('Semua field wajib diisi.')
      }
      if (password.length < 6) {
        throw new Error('Password minimal 6 karakter.')
      }
      if (password !== confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok.')
      }

      if (!isDemoMode()) {
        await apiRegister(key, password, username.trim())
        setMessage('Akun berhasil dibuat. Silakan masuk.')
        setTab('login')
        setPassword('')
        setConfirmPassword('')
        setUsername('')
        return
      }

      await delay()
      const users = getUsers()
      if (users[key]) {
        throw new Error('Email sudah terdaftar.')
      }
      users[key] = { password, name: username.trim() }
      saveUsers(users)
      setMessage('Akun berhasil dibuat. Silakan masuk.')
      setTab('login')
      setPassword('')
      setConfirmPassword('')
      setUsername('')
    } catch (err) {
      setError(err.message || 'Gagal mendaftar.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    clearFeedback()
    setLoading(true)
    try {
      await delay()
      const addr = String(forgotEmail || email).toLowerCase().trim()
      if (!addr) {
        throw new Error('Masukkan email.')
      }
      const users = getUsers()
      setMessage(
        users[addr]
          ? 'Link reset (demo) telah dikirim ke email Anda.'
          : 'Jika email terdaftar, Anda akan menerima instruksi reset.',
      )
      setForgotOpen(false)
    } catch (err) {
      setError(err.message || 'Gagal.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider) => {
    clearFeedback()
    setLoading(true)
    try {
      await delay()
      const p = String(provider).toLowerCase()
      const demoEmail = p === 'google' ? 'google-demo@money.app' : 'facebook-demo@money.app'
      const demoName = p === 'google' ? 'Google User' : 'Facebook User'
      const users = getUsers()
      users[demoEmail] = { password: '__social_demo__', name: demoName }
      saveUsers(users)
      onAuthenticated?.({ email: demoEmail, name: demoName })
    } catch (err) {
      setError(err.message || 'Gagal.')
    } finally {
      setLoading(false)
    }
  }

  const openForgot = () => {
    setForgotEmail(email)
    setForgotOpen(true)
  }

  useEffect(() => {
    if (!forgotOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setForgotOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [forgotOpen])

  const isLogin = tab === 'login'

  return (
    <div className="login-page">
      <header className="header-block">
        <h1>Get Started now</h1>
        <p>Start managing your finances today!</p>
      </header>

      <div className="card-shell">
        <div className="card">
          <div className="tabs" role="tablist" aria-label="Login atau daftar">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => {
                setTab('login')
                clearFeedback()
              }}
            >
              Log In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => {
                setTab('signup')
                clearFeedback()
              }}
            >
              Sign Up
            </button>
          </div>

          <div className={`feedback ${error ? 'feedback--error' : ''} ${message && !error ? 'feedback--ok' : ''}`}>
            {error || message}
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <IconEye off={!showPassword} />
                  </button>
                </div>
              </div>
              <div className="row-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remeber me
                </label>
                <button type="button" className="link-blue" onClick={openForgot}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Memproses…' : 'Log In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <div className="field">
                <label htmlFor="username">Username</label>
                <div className="input-wrap">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="email-su">Email</label>
                <div className="input-wrap">
                  <input
                    id="email-su"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="password-su">Password</label>
                <div className="input-wrap">
                  <input
                    id="password-su"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <IconEye off={!showPassword} />
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirmation Password</label>
                <div className="input-wrap">
                  <input
                    id="confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    <IconEye off={!showConfirmPassword} />
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Memproses…' : 'Register'}
              </button>
            </form>
          )}

          <p className="footer-prompt">
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" className="link-blue" onClick={() => setTab('signup')}>
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className="link-blue" onClick={() => setTab('login')}>
                  Login
                </button>
              </>
            )}
          </p>

          <div className="divider" aria-hidden>
            <span>Or</span>
          </div>

          <button
            type="button"
            className="btn-social"
            disabled={loading}
            onClick={() => handleSocial('google')}
          >
            <GoogleMark />
            Continue with Google
          </button>
          <button
            type="button"
            className="btn-social"
            disabled={loading}
            onClick={() => handleSocial('facebook')}
          >
            <FacebookMark />
            Continue with Facebook
          </button>
        </div>
      </div>

      {forgotOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setForgotOpen(false)
          }}
        >
          <form className="modal" role="dialog" aria-labelledby="forgot-title" aria-modal="true" onSubmit={handleForgotSubmit}>
            <div className="modal__head">
              <h2 id="forgot-title">Reset password</h2>
              <button type="button" className="modal__close" aria-label="Tutup" onClick={() => setForgotOpen(false)}>
                <IconClose size={22} />
              </button>
            </div>
            <p>Masukkan email untuk instruksi reset (demo).</p>
            <div className="field">
              <label htmlFor="forgot-email">Email</label>
              <div className="input-wrap">
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setForgotOpen(false)}>
                Batal
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={loading}>
                Kirim
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
