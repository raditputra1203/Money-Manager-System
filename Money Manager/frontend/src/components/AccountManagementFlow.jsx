import { useMemo, useState } from 'react'
import { useFinance } from '../financeStore.jsx'
import FullScreenHeader from './FullScreenHeader.jsx'
import { MoreAcctGlyph } from './icons/WalletIcons.jsx'

/**
 * @param {'list' | 'types'} initialView
 * @param {boolean} closeOnAdd — closes screen after account created (used from Wallet)
 */
export default function AccountManagementFlow({
  onClose,
  onToast,
  initialView = 'list',
  closeOnAdd = false,
}) {
  const { state, dispatch } = useFinance()
  const [view, setView] = useState(initialView)
  const [showUsed, setShowUsed] = useState(true)
  const [showUnused, setShowUnused] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDraft, setFormDraft] = useState(null)

  const filteredAccounts = useMemo(() => {
    return state.accounts.filter(
      (a) => (a.isUsed !== false && showUsed) || (a.isUsed === false && showUnused),
    )
  }, [state.accounts, showUsed, showUnused])

  const title =
    view === 'list'
      ? 'Account Management'
      : view === 'types'
        ? 'New Account'
        : 'Account name'

  const setFilterUsed = (v) => {
    setShowUsed(v)
    if (!v && !showUnused) setShowUnused(true)
  }
  const setFilterUnused = (v) => {
    setShowUnused(v)
    if (!v && !showUsed) setShowUsed(true)
  }

  const goBack = () => {
    if (view === 'list') onClose()
    else if (view === 'types') {
      if (initialView === 'types' && closeOnAdd) onClose()
      else setView('list')
    } else {
      setView('types')
      setFormDraft(null)
      setFormName('')
    }
  }

  const openAddFromList = () => setView('types')

  const openCustomForm = () => {
    setFormDraft({ kind: 'asset', accountSource: 'debit', placeholder: 'Account name', subtitle: '' })
    setFormName('')
    setView('form')
  }

  const selectType = (kind, accountSource, suggestedName) => {
    setFormDraft({ kind, accountSource, placeholder: suggestedName, subtitle: '' })
    setFormName(suggestedName)
    setView('form')
  }

  const submitAccount = () => {
    const nm = formName.trim()
    if (!nm) {
      onToast('Enter account name')
      return
    }
    if (!formDraft) return
    dispatch({
      type: 'ADD_ACCOUNT',
      name: nm,
      kind: formDraft.kind,
      accountSource: formDraft.accountSource,
      subtitle: formDraft.subtitle || '',
    })
    onToast('Account added')
    setFormDraft(null)
    setFormName('')
    if (closeOnAdd) {
      onClose()
      return
    }
    setView('list')
  }

  return (
    <div className="more-account-fs" role="dialog" aria-modal="true" aria-labelledby="more-acct-fs-title">
      <FullScreenHeader
        className="more-account-fs__header"
        titleId="more-acct-fs-title"
        title={title}
        onBack={view !== 'list' ? goBack : undefined}
        onClose={onClose}
      />

      {view === 'list' && (
        <>
          <div className="more-account-fs__filters">
            <label className="more-account-fs__filter">
              <span className="more-account-fs__teal-check">
                <input
                  type="checkbox"
                  checked={showUsed}
                  onChange={(e) => setFilterUsed(e.target.checked)}
                  className="more-account-fs__chk-hidden"
                />
                <span className={`more-account-fs__teal-box ${showUsed ? 'more-account-fs__teal-box--on' : ''}`} aria-hidden />
              </span>
              <span className="more-account-fs__filter-text">Used</span>
            </label>
            <label className="more-account-fs__filter">
              <span className="more-account-fs__teal-check">
                <input
                  type="checkbox"
                  checked={showUnused}
                  onChange={(e) => setFilterUnused(e.target.checked)}
                  className="more-account-fs__chk-hidden"
                />
                <span className={`more-account-fs__teal-box ${showUnused ? 'more-account-fs__teal-box--on' : ''}`} aria-hidden />
              </span>
              <span className="more-account-fs__filter-text">Unused</span>
            </label>
          </div>
          <div className="more-account-fs__body">
            <ul className="more-account-fs__list">
              {filteredAccounts.length === 0 ? (
                <li className="more-account-fs__empty-hint">Belum ada akun di filter ini</li>
              ) : (
                filteredAccounts.map((a) => (
                  <li key={a.id} className="more-account-fs__row">
                    <label className="more-account-fs__teal-check more-account-fs__teal-check--row">
                      <input
                        type="checkbox"
                        checked={a.isUsed !== false}
                        onChange={() =>
                          dispatch({
                            type: 'UPDATE_ACCOUNT',
                            id: a.id,
                            patch: { isUsed: a.isUsed === false },
                          })
                        }
                        className="more-account-fs__chk-hidden"
                      />
                      <span
                        className={`more-account-fs__teal-box ${a.isUsed !== false ? 'more-account-fs__teal-box--on' : ''}`}
                        aria-hidden
                      />
                    </label>
                    <span
                      className={`more-account-fs__row-icon more-account-fs__row-icon--${a.accountSource === 'cash' ? 'cash' : a.accountSource === 'credit' ? 'credit' : 'debit'}`}
                    >
                      <MoreAcctGlyph
                        source={a.accountSource === 'credit' ? 'credit' : a.accountSource === 'cash' ? 'cash' : 'debit'}
                      />
                    </span>
                    <span className="more-account-fs__row-name">{a.name}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="more-account-fs__footer">
            <button type="button" className="more-account-fs__addlink" onClick={openAddFromList}>
              + Add account
            </button>
          </div>
        </>
      )}

      {view === 'types' && (
        <>
          <div className="more-account-fs__body more-account-fs__body--flush">
            <button type="button" className="more-account-fs__type-row" onClick={() => selectType('asset', 'cash', 'Cash')}>
              <span className="more-account-fs__type-icon more-account-fs__type-icon--cash">
                <MoreAcctGlyph source="cash" />
              </span>
              <span className="more-account-fs__type-label">Cash</span>
              <span className="more-account-fs__chevron" aria-hidden>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <button type="button" className="more-account-fs__type-row" onClick={() => selectType('asset', 'debit', 'Debit Card')}>
              <span className="more-account-fs__type-icon more-account-fs__type-icon--debit">
                <MoreAcctGlyph source="debit" />
              </span>
              <span className="more-account-fs__type-label">Debit Card</span>
              <span className="more-account-fs__chevron" aria-hidden>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <button type="button" className="more-account-fs__type-row" onClick={() => selectType('debt', 'credit', 'Credit Card')}>
              <span className="more-account-fs__type-icon more-account-fs__type-icon--debit">
                <MoreAcctGlyph source="credit" />
              </span>
              <span className="more-account-fs__type-label">Credit Card</span>
              <span className="more-account-fs__chevron" aria-hidden>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
          <div className="more-account-fs__footer">
            <button type="button" className="more-account-fs__addlink" onClick={openCustomForm}>
              + Custom account
            </button>
          </div>
        </>
      )}

      {view === 'form' && formDraft && (
        <div className="more-account-fs__body more-account-fs__body--padded">
          <div className="form-field">
            <label htmlFor="acct-name">Account name</label>
            <input
              id="acct-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={formDraft.placeholder}
              autoComplete="off"
            />
          </div>
          <div className="form-field">
            <label htmlFor="acct-sub">Description</label>
            <input
              id="acct-sub"
              value={formDraft.subtitle || ''}
              onChange={(e) => setFormDraft((d) => ({ ...d, subtitle: e.target.value }))}
              placeholder="e.g. Main account"
            />
          </div>
          <button type="button" className="more-account-fs__btn-create" onClick={submitAccount}>
            Create account
          </button>
        </div>
      )}
    </div>
  )
}
