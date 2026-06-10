import { useState } from 'react'
import { categoryMatchesType } from '../../financeHelpers.js'
import { useFinance } from '../../financeStore.jsx'
import Sheet from '../../components/Sheet.jsx'
import { WalletAcctGlyph, WalletHeroTrendIcon, MoreAcctGlyph } from '../../components/icons/WalletIcons.jsx'
import { walletAccountRowMeta } from '../../utils/categoryMeta.js'
import { fmtRpBooksDisplay, fmtWalletBalanceStr, walletUpdatedLabel } from '../../utils/formatters.js'

export default function WalletScreen({ onToast }) {
  const { state, dispatch } = useFinance()
  const [modal, setModal] = useState(null)
  const [editAccount, setEditAccount] = useState({ id: '', name: '', subtitle: '' })
  const [addAccountStep, setAddAccountStep] = useState(null)
  const [addAccountDraft, setAddAccountDraft] = useState(null)
  const [addAccountName, setAddAccountName] = useState('')
  const [transfer, setTransfer] = useState({ fromId: '', toId: '', amount: '' })
  const [topup, setTopup] = useState({ accountId: '', amount: '', bookId: '' })
  const [bill, setBill] = useState({ accountId: '', amount: '', categoryId: 'c5', note: 'Pay bill' })

  const netWorth = state.accounts.reduce((s, a) => s + a.balance, 0)
  const assets = state.accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const debt = state.accounts.filter((a) => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)

  const openTransfer = () => {
    const asset = state.accounts.find((a) => a.balance > 0)
    setTransfer({
      fromId: asset?.id || state.accounts[0]?.id,
      toId: state.accounts.find((a) => a.id !== asset?.id)?.id || '',
      amount: '',
    })
    setModal('transfer')
  }

  const submitTransfer = () => {
    const amt = Number(transfer.amount)
    if (!amt || amt <= 0) {
      onToast('Invalid amount')
      return
    }
    const from = state.accounts.find((a) => a.id === transfer.fromId)
    if (!from || from.balance < amt) {
      onToast('Insufficient source balance')
      return
    }
    if (transfer.fromId === transfer.toId) {
      onToast('Choose different accounts')
      return
    }
    dispatch({ type: 'TRANSFER', fromId: transfer.fromId, toId: transfer.toId, amount: amt })
    setModal(null)
    onToast('Transfer successful')
  }

  const submitTopup = () => {
    const amt = Number(topup.amount)
    if (!amt || amt <= 0) {
      onToast('Invalid amount')
      return
    }
    if (!topup.bookId) {
      onToast('Select target book')
      return
    }
    dispatch({
      type: 'TOP_UP',
      accountId: topup.accountId,
      amount: amt,
      bookId: topup.bookId,
      categoryId: 'i3',
      note: 'Top up',
    })
    setModal(null)
    onToast('Top up successful')
  }

  const submitBill = () => {
    const amt = Number(bill.amount)
    if (!amt || amt <= 0) {
      onToast('Invalid amount')
      return
    }
    const acc = state.accounts.find((a) => a.id === bill.accountId)
    if (!acc || acc.balance < amt) {
      onToast('Insufficient balance')
      return
    }
    dispatch({
      type: 'PAY_BILL',
      accountId: bill.accountId,
      amount: amt,
      categoryId: bill.categoryId,
      note: bill.note,
      bookId: state.defaultBookId,
    })
    setModal(null)
    onToast('Payment recorded')
  }

  return (
    <div className="app-scroll app-scroll--wallet">
      <header className="wallet-hero">
        <p className="wallet-hero__label">Net Worth</p>
        <p className="wallet-hero__amount">{fmtRpBooksDisplay(netWorth)}</p>
        <div className="wallet-hero__stats">
          <div className="wallet-hero__stat">
            <div className="wallet-hero__stat-icon wallet-hero__stat-icon--assets" aria-hidden>
              <WalletHeroTrendIcon variant="up" />
            </div>
            <div className="wallet-hero__stat-text">
              <span className="wallet-hero__stat-label">Assets</span>
              <strong className="wallet-hero__stat-value">{fmtRpBooksDisplay(assets)}</strong>
            </div>
          </div>
          <div className="wallet-hero__stat">
            <div className="wallet-hero__stat-icon wallet-hero__stat-icon--debt" aria-hidden>
              <WalletHeroTrendIcon variant="down" />
            </div>
            <div className="wallet-hero__stat-text">
              <span className="wallet-hero__stat-label">Debt</span>
              <strong className="wallet-hero__stat-value">{fmtRpBooksDisplay(debt)}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="wallet-section">
        <div className="wallet-section__head">
          <h2 className="wallet-section__title">Accounts</h2>
          <button type="button" className="wallet-add-fab" aria-label="Add account" onClick={() => setAddAccountStep('types')}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>
        <div className="wallet-account-list">
          {state.accounts.map((a) => {
            const meta = walletAccountRowMeta(a)
            const goalPct =
              a.goalAmount && a.goalAmount > 0
                ? Math.min(100, Math.round((Math.max(0, a.balance) / a.goalAmount) * 100))
                : null
            const footLeft = meta.due ? `${meta.due} · ${walletUpdatedLabel()}` : walletUpdatedLabel()
            return (
              <div key={a.id} className="wallet-account-card">
                <div className="wallet-account-card__top">
                  <div className={`wallet-account-card__icon wallet-account-card__icon--${meta.tone}`}>
                    <WalletAcctGlyph icon={meta.icon} />
                  </div>
                  <div className="wallet-account-card__mid">
                    <strong className="wallet-account-card__name">{a.name}</strong>
                    <span className="wallet-account-card__sub">{a.subtitle || meta.sub}</span>
                  </div>
                  <div className={`wallet-account-card__balance ${a.balance < 0 ? 'wallet-account-card__balance--neg' : ''}`}>
                    {fmtWalletBalanceStr(a.balance)}
                  </div>
                </div>
                {a.goalAmount != null && a.goalAmount > 0 ? (
                  <div className="wallet-account-card__progress">
                    <div className="wallet-account-card__progress-head">
                      <span>Goal {fmtRpBooksDisplay(a.goalAmount)}</span>
                      <span className="wallet-account-card__pct">{goalPct}%</span>
                    </div>
                    <div className="wallet-progress-bar">
                      <span style={{ width: `${goalPct}%` }} />
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="wallet-account-card__edit"
                  aria-label="Edit account"
                  onClick={() => {
                    setEditAccount({ id: a.id, name: a.name, subtitle: a.subtitle || '' })
                    setModal('edit-account')
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <div className="wallet-account-card__foot">
                  <span className="wallet-account-card__when">{footLeft}</span>
                  <span
                    className={
                      a.status === 'active'
                        ? 'wallet-account__status wallet-account__status--active'
                        : 'wallet-account__status wallet-account__status--pending'
                    }
                  >
                    {a.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="wallet-quick">
        <h3 className="wallet-quick__title">Quick Actions</h3>
        <div className="wallet-quick__row">
          <button type="button" className="wallet-quick-btn" onClick={openTransfer}>
            <span className="wallet-quick-btn__circle wallet-quick-btn__circle--transfer">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
                <path
                  d="M17 3l4 4-4 4M3 11h18M7 21l-4-4 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Transfer
          </button>
          <button
            type="button"
            className="wallet-quick-btn"
            onClick={() => {
              setTopup({ accountId: state.accounts[0]?.id || '', amount: '', bookId: state.defaultBookId || state.books[0]?.id || '' })
              setModal('topup')
            }}
          >
            <span className="wallet-quick-btn__circle wallet-quick-btn__circle--topup">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </span>
            Top Up
          </button>
          <button
            type="button"
            className="wallet-quick-btn"
            onClick={() => {
              setBill({ accountId: state.accounts[0]?.id || '', amount: '', categoryId: 'c5', note: 'Pay bill' })
              setModal('bill')
            }}
          >
            <span className="wallet-quick-btn__circle wallet-quick-btn__circle--bill">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                <path fill="currentColor" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H4v-4h16v4zm0-8H4V6h16v2z" />
              </svg>
            </span>
            Pay Bill
          </button>
        </div>
      </section>

      {modal === 'edit-account' && (
        <Sheet title="Edit Account" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Account name</label>
            <input value={editAccount.name} onChange={(e) => setEditAccount((a) => ({ ...a, name: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Description</label>
            <input value={editAccount.subtitle} onChange={(e) => setEditAccount((a) => ({ ...a, subtitle: e.target.value }))} placeholder="e.g. Bank account" />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={() => {
              dispatch({ type: 'UPDATE_ACCOUNT', id: editAccount.id, patch: { name: editAccount.name, subtitle: editAccount.subtitle } })
              setModal(null)
              onToast('Account updated')
            }}>
              Save
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'transfer' && (
        <Sheet title="Transfer between accounts" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>From</label>
            <select value={transfer.fromId} onChange={(e) => setTransfer((t) => ({ ...t, fromId: e.target.value }))}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>To</label>
            <select value={transfer.toId} onChange={(e) => setTransfer((t) => ({ ...t, toId: e.target.value }))}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Amount (Rp)</label>
            <input inputMode="numeric" value={transfer.amount} onChange={(e) => setTransfer((t) => ({ ...t, amount: e.target.value }))} />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={submitTransfer}>
              Transfer
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'topup' && (
        <Sheet title="Top Up" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Account</label>
            <select value={topup.accountId} onChange={(e) => setTopup((t) => ({ ...t, accountId: e.target.value }))}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Amount (Rp)</label>
            <input inputMode="numeric" value={topup.amount} onChange={(e) => setTopup((t) => ({ ...t, amount: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Target book</label>
            <select value={topup.bookId} onChange={(e) => setTopup((t) => ({ ...t, bookId: e.target.value }))}>
              {state.books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={submitTopup}>
              Top Up
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'bill' && (
        <Sheet title="Pay Bill" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Pay from account</label>
            <select value={bill.accountId} onChange={(e) => setBill((b) => ({ ...b, accountId: e.target.value }))}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Amount (Rp)</label>
            <input inputMode="numeric" value={bill.amount} onChange={(e) => setBill((b) => ({ ...b, amount: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Category</label>
            <select value={bill.categoryId} onChange={(e) => setBill((b) => ({ ...b, categoryId: e.target.value }))}>
              {state.categories
                .filter((c) => categoryMatchesType(c, 'expense'))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-field">
            <label>Note</label>
            <input value={bill.note} onChange={(e) => setBill((b) => ({ ...b, note: e.target.value }))} />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={submitBill}>
              Pay
            </button>
          </div>
        </Sheet>
      )}

      {addAccountStep === 'types' && (
        <Sheet title="New Account" onClose={() => setAddAccountStep(null)} center>
          <p className="sheet-hint">Select account type</p>
          <div className="more-account-fs__body more-account-fs__body--flush">
            <button
              type="button"
              className="more-account-fs__type-row"
              onClick={() => {
                setAddAccountDraft({ kind: 'asset', accountSource: 'cash' })
                setAddAccountName('Cash')
                setAddAccountStep('form')
              }}
            >
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
            <button
              type="button"
              className="more-account-fs__type-row"
              onClick={() => {
                setAddAccountDraft({ kind: 'asset', accountSource: 'debit' })
                setAddAccountName('Debit Card')
                setAddAccountStep('form')
              }}
            >
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
            <button
              type="button"
              className="more-account-fs__type-row"
              onClick={() => {
                setAddAccountDraft({ kind: 'debt', accountSource: 'credit' })
                setAddAccountName('Credit Card')
                setAddAccountStep('form')
              }}
            >
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
        </Sheet>
      )}

      {addAccountStep === 'form' && addAccountDraft && (
        <Sheet title="Account name" onClose={() => setAddAccountStep(null)} center>
          <div className="form-field">
            <label htmlFor="wallet-acct-name">Account name</label>
            <input
              id="wallet-acct-name"
              value={addAccountName}
              onChange={(e) => setAddAccountName(e.target.value)}
              placeholder="e.g. Main wallet"
              autoComplete="off"
            />
          </div>
          <div className="form-field">
            <label htmlFor="wallet-acct-sub">Description</label>
            <input
              id="wallet-acct-sub"
              value={addAccountDraft.subtitle || ''}
              onChange={(e) => setAddAccountDraft((d) => ({ ...d, subtitle: e.target.value }))}
              placeholder="e.g. Daily expenses"
              autoComplete="off"
            />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setAddAccountStep(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-confirm"
              onClick={() => {
                const nm = addAccountName.trim()
                if (!nm) {
                  onToast('Enter account name')
                  return
                }
                dispatch({
                  type: 'ADD_ACCOUNT',
                  name: nm,
                  kind: addAccountDraft.kind,
                  accountSource: addAccountDraft.accountSource,
                  subtitle: addAccountDraft.subtitle || '',
                })
                setAddAccountStep(null)
                setAddAccountDraft(null)
                setAddAccountName('')
                onToast('Account added')
              }}
            >
              Create
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
