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
        throw new Error('All fields are required.')
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }
      if (password !== confirmPassword) {
        throw new Error('Password confirmation does not match.')
      }

      if (!isDemoMode()) {
        await apiRegister(key, password, username.trim())
        setMessage('Account created. Please sign in.')
        setTab('login')
        setPassword('')
        setConfirmPassword('')
        setUsername('')
        return
      }

      await delay()
      const users = getUsers()
      if (users[key]) {
        throw new Error('Email already registered.')
      }
      users[key] = { password, name: username.trim() }
      saveUsers(users)
      setMessage('Account created. Please sign in.')
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
                  Remember me
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
              <button type="button" className="modal__close" aria-label="Close" onClick={() => setForgotOpen(false)}>
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
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={loading}>
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
