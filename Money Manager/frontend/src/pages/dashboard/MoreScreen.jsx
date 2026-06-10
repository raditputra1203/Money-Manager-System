import { useMemo, useState } from 'react'
import { filterLedger } from '../../financeHelpers.js'
import { useCategoryMap, useFinance } from '../../financeStore.jsx'
import { isDemoMode, updateProfile } from '../../api.js'
import Sheet from '../../components/Sheet.jsx'
import AccountManagementFlow from '../../components/AccountManagementFlow.jsx'
import { fmtRp } from '../../utils/formatters.js'

export default function MoreScreen({ user, onLogout, onProfileChange, onToast, setTab }) {
  const { state, dispatch } = useFinance()
  const [modal, setModal] = useState(null)
  const [accountFsOpen, setAccountFsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user.name || '')
  const [searchQ, setSearchQ] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')
  const catMap = useCategoryMap()

  const ledgerCount = filterLedger(state.transactions).length
  const transferCount = state.transactions.filter((t) => t.kind === 'transfer' || t.kind === 'topup').length

  const filteredSearch = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return []
    return [...state.transactions]
      .filter((t) => {
        if (t.type === 'income' || t.type === 'expense') {
          const cat = catMap[t.categoryId]?.name || ''
          return (t.note || '').toLowerCase().includes(q) || cat.toLowerCase().includes(q)
        }
        return JSON.stringify(t).toLowerCase().includes(q)
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 50)
  }, [state.transactions, searchQ, catMap])

  const saveProfile = async () => {
    const name = displayName.trim() || user.email
    if (!isDemoMode()) {
      try {
        await updateProfile(name)
      } catch {
        onToast('Failed to sync to server')
        return
      }
    }
    onProfileChange(name)
    setModal(null)
    onToast('Profile updated')
  }

  const submitFeedback = () => {
    if (!feedbackText.trim()) {
      onToast('Write feedback first')
      return
    }
    dispatch({ type: 'ADD_FEEDBACK', text: feedbackText })
    setFeedbackText('')
    setModal(null)
    onToast('Thank you!')
  }


  return (
    <>
      {accountFsOpen ? (
        <AccountManagementFlow onClose={() => setAccountFsOpen(false)} onToast={onToast} initialView="list" />
      ) : null}
      <div className="app-scroll app-scroll--more">
      <div className="screen-more__hero">
        <div className="avatar" aria-hidden>
          👤
        </div>
        <h2>
          {user.name || 'User'}
        </h2>
        <p>{user.email}</p>
      </div>

      <div className="stats-row">
        <div>
          <strong>{state.books.length}</strong>
          <span>Books</span>
        </div>
        <div>
          <strong>{state.accounts.length}</strong>
          <span>Accounts</span>
        </div>
        <div>
          <strong>{ledgerCount + transferCount}</strong>
          <span>Transactions</span>
        </div>
      </div>

      <section className="section">
        <div className="feature-grid">
          <button
            type="button"
            onClick={() => {
              setDisplayName(user.name || '')
              setModal('profile')
            }}
          >
            <span className="ic">✏️</span>
            Edit Profile
          </button>
          <button type="button" onClick={() => setAccountFsOpen(true)}>
            <span className="ic">💳</span>
            Account Management
          </button>
          <button type="button" onClick={() => setModal('settings')}>
            <span className="ic">⚙️</span>
            Settings
          </button>
        </div>
      </section>

      <div className="support-list">
        <button type="button" onClick={() => setModal('help')}>
          Help & Support <span>›</span>
        </button>
        <button type="button" onClick={() => setModal('feedback')}>
          Send Feedback <span>›</span>
        </button>
      </div>

      <button type="button" className="btn-logout" onClick={onLogout}>
        Log out
      </button>

      {modal === 'profile' && (
        <Sheet title="Edit Profile" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input value={user.email} disabled style={{ opacity: 0.7 }} />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Close
            </button>
            <button type="button" className="btn-confirm" onClick={saveProfile}>
              Save
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'settings' && (
        <Sheet title="Settings" onClose={() => setModal(null)} center>
          <div className="toggle-inline">
            <span>Dark mode</span>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => {
                const isDark = e.target.checked
                setDarkMode(isDark)
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
                try { localStorage.setItem('mm_dark_mode', isDark ? 'dark' : 'light') } catch { /* ignore */ }
              }}
            />
          </div>
          <div className="toggle-inline">
            <span>Compact numbers</span>
            <input
              type="checkbox"
              checked={state.settings.compactNumbers}
              onChange={(e) => dispatch({ type: 'SET_SETTINGS', patch: { compactNumbers: e.target.checked } })}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--app-muted)' }}>
            Reset menghapus semua data keuangan demo untuk akun ini dan memuat ulang data awal.
          </p>
          <button
            type="button"
            className="btn-logout"
            style={{ margin: '12px 0 0', width: '100%' }}
            onClick={() => {
              if (window.confirm('Reset semua data keuangan?')) {
                dispatch({ type: 'RESET_DATA' })
                setModal(null)
                onToast('Data direset')
                setTab('books')
              }
            }}
          >
            Reset data keuangan
          </button>
        </Sheet>
      )}

      {modal === 'search' && (
        <Sheet title="Search Transactions" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Keyword</label>
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Note or category" />
          </div>
          <div className="card-list" style={{ maxHeight: 280, overflow: 'auto' }}>
            {filteredSearch.length === 0 ? (
              <div className="card-list__item" style={{ justifyContent: 'center', color: 'var(--app-muted)' }}>
                {searchQ.trim() ? 'No results' : 'Type to search'}
              </div>
            ) : (
              filteredSearch.map((t) => (
                <div key={t.id} className="card-list__item">
                  <div style={{ fontSize: 13 }}>
                    {t.type === 'income' || t.type === 'expense' ? (
                      <>
                        <strong>{catMap[t.categoryId]?.name || t.type}</strong>
                        <div style={{ color: 'var(--app-muted)' }}>{t.note || fmtRp(t.amount)}</div>
                      </>
                    ) : (
                      <strong>{t.kind || 'Entry'}</strong>
                    )}
                  </div>
                  <button type="button" className="tx-actions" onClick={() => dispatch({ type: 'DELETE_TRANSACTION', id: t.id })}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </Sheet>
      )}

      {modal === 'help' && (
        <Sheet title="Help & Support" onClose={() => setModal(null)} center>
          <div className="help-block">
            <h4>Getting Started</h4>
            <p>Welcome to Money Manager! Track your income and expenses, manage multiple accounts, and view insightful charts of your financial data.</p>
            <h4>How to Use</h4>
            <p>Use the <strong>Books</strong> tab to add income/expense transactions. Use the <strong>Wallet</strong> tab to manage your accounts, transfers, and top-ups. The <strong>Charts</strong> tab visualizes your spending and earnings.</p>
            <h4>Data Storage</h4>
            <p>{isDemoMode() ? 'All data is stored locally in your browser (localStorage) for demo purposes.' : 'Your data is securely stored on our servers and accessible across devices.'}</p>
            <h4>Contact Us</h4>
            <p>If you have any questions, suggestions, or issues, please use the <strong>Send Feedback</strong> option to reach out to us. We'd love to hear from you!</p>
          </div>
        </Sheet>
      )}

      {modal === 'feedback' && (
        <Sheet title="Send Feedback" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Message</label>
            <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Your suggestions or issues..." />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={submitFeedback}>
              Send
            </button>
          </div>
        </Sheet>
      )}

    </div>
    </>
  )
}
