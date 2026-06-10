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
    saveToken(user.accessToken, user.refreshToken, user.expiresAt)
  }
}

export function saveToken(accessToken, refreshToken, expiresAt) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    accessToken,
    refreshToken: refreshToken || '',
    expiresAt: expiresAt || 0,
  }))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
  // Clear all finance data from localStorage so stale data doesn't persist across logins
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('mm_finance_')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
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

/** Get the stored refresh token. */
export function getRefreshToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.refreshToken || null
  } catch {
    return null
  }
}
