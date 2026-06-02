const SESSION_KEY = 'mm_session'
const TOKEN_KEY = 'mm_token'

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data && typeof data.email === 'string') return { email: data.email, name: data.name || data.email }
    return null
  } catch {
    return null
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, name: user.name }))
  if (user.accessToken) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({
      accessToken: user.accessToken,
      refreshToken: user.refreshToken || '',
      expiresAt: user.expiresAt || 0,
    }))
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

/** Get the stored access token for API calls. */
export function getAccessToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.accessToken || null
  } catch {
    return null
  }
}
