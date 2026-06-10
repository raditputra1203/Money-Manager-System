import { getAccessToken, getRefreshToken, saveToken } from './session.js'

/**
 * Returns the API base URL.
 * - If VITE_API_URL is set (production): use it
 * - If DEV mode (Vite proxy active): return empty string (relative /api path)
 * - Otherwise: return null (demo/localStorage mode)
 */
function getApiUrl() {
  try {
    const envUrl = import.meta.env.VITE_API_URL
    if (envUrl) return envUrl.replace(/\/+$/, '')
  } catch {
    /* ignore */
  }
  try {
    if (import.meta.env.DEV) return ''
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Returns true if no backend API is configured — run in demo (localStorage) mode.
 * DEV mode (Vite proxy) returns '' so !isDemoMode() → API calls to /api/*
 * Production with VITE_API_URL returns the full URL.
 * No VITE_API_URL and not DEV → null → demo mode.
 */
export function isDemoMode() {
  return getApiUrl() === null
}

/**
 * Build fetch headers including Authorization if a token is available.
 */
function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra }
  const token = getAccessToken()
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

let refreshing = null

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns the new access token, or null if refresh fails.
 */
async function tryRefreshToken() {
  if (refreshing) return refreshing
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  refreshing = (async () => {
    try {
      const base = getApiUrl()
      const res = await fetch(`${base}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()
      saveToken(data.access_token, data.refresh_token, data.expires_at)
      return data.access_token
    } catch {
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/**
 * Parse response, throw on non-ok status. On 401, attempt token refresh once.
 */
async function handleResponse(res) {
  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      // Retry the original request with the new token
      const base = getApiUrl()
      const url = `${base}${res.url.replace(base || '', '')}`
      const opts = {
        method: res.method,
        headers: headers(),
      }
      if (res.method !== 'GET' && res.method !== 'HEAD') {
        const body = await res.clone().text()
        if (body) opts.body = body
      }
      const retryRes = await fetch(url, opts)
      if (retryRes.ok) return retryRes.json()
    }
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body.error) msg = body.error
      if (body.details) msg += ` (${body.details})`
    } catch {
      // ignore parse errors
    }
    throw new Error(msg)
  }
  return res.json()
}

/**
 * Generic fetch wrapper.
 */
async function request(method, path, body) {
  const base = getApiUrl()
  const url = `${base}${path}`
  const opts = { method, headers: headers() }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  return handleResponse(res)
}

// ─── Auth ───────────────────────────────────────────────

export async function login(email, password) {
  return request('POST', '/api/auth/login', { email, password })
}

export async function register(email, password, name) {
  return request('POST', '/api/auth/register', { email, password, name })
}

export async function getMe() {
  return request('GET', '/api/auth/me')
}

// ─── Finance State ────────────────────────────────────

export async function getFinanceState() {
  return request('GET', '/api/finance')
}

// ─── Profile ──────────────────────────────────────────

export async function updateProfile(name) {
  return request('PATCH', '/api/auth/me', { name })
}

// ─── Settings ─────────────────────────────────────────

export async function updateSettings(patch) {
  return request('PATCH', '/api/finance/settings', patch)
}

// ─── Books ────────────────────────────────────────────

export async function addBook(name, clientId) {
  return request('POST', '/api/finance/books', { name, clientId })
}

export async function updateBook(id, data) {
  return request('PATCH', `/api/finance/books/${id}`, data)
}

export async function setDefaultBook(bookId) {
  return request('PATCH', '/api/finance/books/default', { bookId })
}

export async function deleteBook(bookId) {
  return request('DELETE', `/api/finance/books/${bookId}`)
}

// ─── Accounts ─────────────────────────────────────────

export async function addAccount(data) {
  return request('POST', '/api/finance/accounts', data)
}

export async function updateAccount(id, patch) {
  return request('PATCH', `/api/finance/accounts/${id}`, patch)
}

// ─── Transactions ─────────────────────────────────────

export async function addTransaction(data) {
  return request('POST', '/api/finance/transactions', data)
}

export async function updateTransaction(id, data) {
  return request('PATCH', `/api/finance/transactions/${id}`, data)
}

export async function deleteTransaction(id) {
  return request('DELETE', `/api/finance/transactions/${id}`)
}

// ─── Transfers & Top-ups ─────────────────────────────

export async function transfer(data) {
  return request('POST', '/api/finance/transfers', data)
}

export async function topup(data) {
  return request('POST', '/api/finance/topups', data)
}

// ─── Feedbacks ────────────────────────────────────────

export async function addFeedback(data) {
  return request('POST', '/api/finance/feedbacks', data)
}

// ─── Reset ────────────────────────────────────────────

export async function resetData() {
  return request('DELETE', '/api/finance/reset')
}
