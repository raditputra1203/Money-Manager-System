import { useMemo, useRef, useState } from 'react'
import {
  categoryMatchesType,
  filterLedger,
  PROTECTED_CATEGORY_IDS,
} from '../../financeHelpers.js'
import { useCategoryMap, useFinance } from '../../financeStore.jsx'
import { isDemoMode } from '../../api.js'
import Sheet from '../../components/Sheet.jsx'
import AccountManagementFlow from '../../components/AccountManagementFlow.jsx'
import FullScreenHeader from '../../components/FullScreenHeader.jsx'
import { IconCheck, IconClose } from '../../components/icons/NavGlyph.jsx'
import { fmtRp, fmtPremiumPerMonthIdr } from '../../utils/formatters.js'

const PREMIUM_FEATURES = [
  {
    id: 'cats',
    icon: '🗂️',
    title: 'Unlimited Categories',
    sub: 'Create unlimited custom expense/income categories',
  },
  {
    id: 'books',
    icon: '📚',
    title: 'Multiple Books',
    sub: 'Create dedicated books for different scenarios',
  },
  {
    id: 'bio',
    icon: '👆',
    title: 'Fingerprint / Face ID',
    sub: 'Unlock app with Touch ID / Face ID',
  },
  {
    id: 'search',
    icon: '🔍',
    title: 'Search Transactions',
    sub: 'Search by category / amount / note / account',
  },
  {
    id: 'support',
    icon: '🤝',
    title: 'Support Us',
    sub: 'Help us keep innovating',
  },
  { id: 'charts', icon: '📊', title: 'More Charts', sub: null },
]

function MorePremiumFullScreen({ onClose, onToast, onPurchase, isPremium }) {
  const [plan, setPlan] = useState('year')

  const yearlyTotal = 169_000
  const perMonthLine = fmtPremiumPerMonthIdr(yearlyTotal)

  const cta =
    plan === 'month'
      ? {
          sub: 'Pay per month (Automatic subscription 1 month)',
          price: 'Rp 25ribu',
        }
      : {
          sub: 'Pay per year (Automatic subscription 1 year)',
          price: 'Rp 169ribu',
        }

  const handleBuy = () => {
    if (isPremium) {
      onToast('Anda sudah Premium')
      return
    }
    onPurchase()
  }

  return (
    <div className="more-premium-fs" role="dialog" aria-modal="true" aria-labelledby="more-premium-title">
      <FullScreenHeader
        className="more-premium-fs__header"
        titleId="more-premium-title"
        title="Purchase Premium"
        onClose={onClose}
      />

      <div className="more-premium-fs__body">
        <ul className="more-premium-fs__features">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f.id} className="more-premium-fs__feature">
              <span className="more-premium-fs__feature-icon" aria-hidden>
                {f.icon}
              </span>
              <div className="more-premium-fs__feature-copy">
                <strong>{f.title}</strong>
                {f.sub ? <p>{f.sub}</p> : null}
              </div>
              <span className="more-premium-fs__feature-check" aria-hidden>
                ✓
              </span>
            </li>
          ))}
        </ul>

        <div className="more-premium-fs__plans">
          <button
            type="button"
            className={`more-premium-fs__plan ${plan === 'month' ? 'more-premium-fs__plan--selected' : ''}`}
            onClick={() => setPlan('month')}
          >
            <span className="more-premium-fs__plan-label">Pay per month</span>
            <span className="more-premium-fs__plan-price">Rp 25ribu</span>
          </button>
          <button
            type="button"
            className={`more-premium-fs__plan ${plan === 'year' ? 'more-premium-fs__plan--selected' : ''}`}
            onClick={() => setPlan('year')}
          >
            <span className="more-premium-fs__plan-label">Pay per year</span>
            <span className="more-premium-fs__plan-price">Rp 169ribu</span>
            <span className="more-premium-fs__plan-note">{perMonthLine}</span>
          </button>
        </div>

        <div className="more-premium-fs__legal">
          <p>
            Premium features are linked to your account. Restore purchase is available if you reinstall the app.
            Subscription renews automatically unless cancelled at least 24 hours before the end of the current period.
            Manage your subscription in your account settings.
          </p>
        </div>
        <div className="more-premium-fs__legal-links">
          <button type="button" onClick={() => onToast('Terms of Use (demo)')}>
            Terms of Use
          </button>
          <span aria-hidden> · </span>
          <button type="button" onClick={() => onToast('Privacy Policy (demo)')}>
            Privacy Policy
          </button>
        </div>
      </div>

      <div className="more-premium-fs__footer">
        <button type="button" className="more-premium-fs__cta" onClick={handleBuy}>
          <span className="more-premium-fs__cta-sub">{cta.sub}</span>
          <span className="more-premium-fs__cta-price">{cta.price}</span>
        </button>
      </div>
    </div>
  )
}

const BUDGET_ICON_OPTIONS = ['📊', '🍽️', '🚗', '🛍️', '🎬', '📄', '💊', '🏠', '💰', '🎯', '❤️', '📁']

function BudgetCreateView({ categories, catMap, onBack, onClose, onToast, onSaved, dispatch }) {
  const dateInputRef = useRef(null)
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📊')
  const [amountStr, setAmountStr] = useState('')
  const [startIso, setStartIso] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [sheet, setSheet] = useState(null)

  const limitNum = Math.max(0, Number(amountStr.replace(/\D/g, '')) || 0)
  const startDisplay = useMemo(() => {
    try {
      return new Date(`${startIso}T12:00:00`).toLocaleDateString('en-US')
    } catch {
      return startIso
    }
  }, [startIso])

  const submit = () => {
    if (!categoryId) {
      onToast('Pilih kategori')
      return
    }
    if (!name.trim()) {
      onToast('Isi nama budget')
      return
    }
    if (limitNum <= 0) {
      onToast('Nominal budget wajib diisi')
      return
    }
    dispatch({
      type: 'SAVE_BUDGET_PLAN',
      categoryId,
      name: name.trim(),
      icon,
      amount: limitNum,
      startDate: startIso,
      note,
    })
    onToast('Budget disimpan')
    onSaved()
  }

  return (
    <div className="more-budget-fs more-budget-fs--create">
      <FullScreenHeader
        className="more-budget-fs__header more-budget-fs__header--primary"
        title="Create Budget"
        onBack={onBack}
        rightAction={
          <div className="fs-header__actions">
            <button type="button" className="fs-header__btn" aria-label="Simpan" onClick={submit}>
              <IconCheck />
            </button>
            <button type="button" className="fs-header__btn" aria-label="Tutup" onClick={onClose}>
              <IconClose />
            </button>
          </div>
        }
      />

      <div className="more-budget-fs__create-scroll">
        <div className="more-budget-fs__create-summary">
          <p className="more-budget-fs__create-summary-label">Budget Monthly</p>
          <p className="more-budget-fs__create-limit-line">
            Budget Limit:{' '}
            <span className={limitNum === 0 ? 'more-budget-fs__limit-val more-budget-fs__limit-val--zero' : 'more-budget-fs__limit-val'}>
              {fmtRp(limitNum)}
            </span>
          </p>
        </div>

        <div className="more-budget-fs__form">
          <button type="button" className="more-budget-fs__field" onClick={() => setSheet('category')}>
            <span className="more-budget-fs__field-icon" aria-hidden>
              👤
            </span>
            <div className="more-budget-fs__field-mid">
              <span className="more-budget-fs__field-label">Category</span>
              <span className="more-budget-fs__field-sub">{catMap[categoryId]?.name || '—'}</span>
            </div>
            <span className="more-budget-fs__field-chev" aria-hidden>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          <label className="more-budget-fs__field more-budget-fs__field--input">
            <span className="more-budget-fs__field-icon" aria-hidden>
              👤
            </span>
            <div className="more-budget-fs__field-mid">
              <span className="more-budget-fs__field-label">Budget Name</span>
              <input
                className="more-budget-fs__field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Living Expenses, ..."
                maxLength={60}
              />
            </div>
          </label>

          <button type="button" className="more-budget-fs__field" onClick={() => setSheet('icon')}>
            <span className="more-budget-fs__field-icon" aria-hidden>
              🎨
            </span>
            <div className="more-budget-fs__field-mid">
              <span className="more-budget-fs__field-label">Icon</span>
            </div>
            <span className="more-budget-fs__field-icon-pick" aria-hidden>
              {icon}
            </span>
            <span className="more-budget-fs__field-chev" aria-hidden>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          <label className="more-budget-fs__field more-budget-fs__field--input">
            <span className="more-budget-fs__field-icon" aria-hidden>
              💵
            </span>
            <div className="more-budget-fs__field-mid">
              <span className="more-budget-fs__field-label">Budget Amount</span>
              <input
                className="more-budget-fs__field-input"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </label>

          <button type="button" className="more-budget-fs__field" onClick={() => onToast('Period: Monthly')}>
            <span className="more-budget-fs__field-icon" aria-hidden>
              🔄
            </span>
            <div className="more-budget-fs__field-mid">
              <span className="more-budget-fs__field-label">Period Type</span>
              <span className="more-budget-fs__field-sub">Monthly</span>
            </div>
            <span className="more-budget-fs__field-chev" aria-hidden>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          <p className="more-budget-fs__section-hint">Date</p>
          <label className="more-budget-fs__field more-budget-fs__field--date">
            <span className="more-budget-fs__field-icon" aria-hidden>
              📅
            </span>
            <div className="more-budget-fs__field-mid">
              <span className="more-budget-fs__field-label">Start Date</span>
              <span className="more-budget-fs__field-sub">{startDisplay}</span>
            </div>
            <span className="more-budget-fs__field-chev" aria-hidden>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              ref={dateInputRef}
              type="date"
              className="more-budget-fs__date-native"
              value={startIso}
              onChange={(e) => setStartIso(e.target.value)}
              aria-label="Start date"
            />
          </label>

          <p className="more-budget-fs__note-title">Note</p>
          <div className="more-budget-fs__note-wrap">
            <textarea
              className="more-budget-fs__note-area"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 30))}
              placeholder="Enter budget description"
              maxLength={30}
              rows={3}
            />
            <span className="more-budget-fs__note-count">{note.length}/30</span>
          </div>
        </div>
      </div>

      {sheet === 'category' && (
        <Sheet title="Category" onClose={() => setSheet(null)} center>
          <div className="more-budget-fs__pick-list">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`more-budget-fs__pick-item ${c.id === categoryId ? 'more-budget-fs__pick-item--on' : ''}`}
                onClick={() => {
                  setCategoryId(c.id)
                  setSheet(null)
                }}
              >
                <span>{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === 'icon' && (
        <Sheet title="Icon" onClose={() => setSheet(null)} center>
          <div className="more-budget-fs__icon-grid">
            {BUDGET_ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`more-budget-fs__icon-cell ${ic === icon ? 'more-budget-fs__icon-cell--on' : ''}`}
                onClick={() => {
                  setIcon(ic)
                  setSheet(null)
                }}
              >
                {ic}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}

function BudgetFlowFullScreen({ onClose, onToast }) {
  const { state, dispatch } = useFinance()
  const catMap = useCategoryMap()
  const [view, setView] = useState('list')

  const plans = state.budgetPlans || []
  const hasPlans = plans.length > 0

  return (
    <div className="more-budget-fs-root" role="dialog" aria-modal="true">
      {view === 'list' ? (
        <div className="more-budget-fs more-budget-fs--list">
          <FullScreenHeader
            className="more-budget-fs__header more-budget-fs__header--soft"
            title="Budget"
            onClose={onClose}
          />

          <div className="more-budget-fs__list-body">
            {!hasPlans ? (
              <div className="more-budget-fs__empty">
                <span className="more-budget-fs__empty-emoji" aria-hidden>
                  😆
                </span>
                <p className="more-budget-fs__empty-text">No budget yet</p>
                <button type="button" className="more-budget-fs__empty-cta" onClick={() => setView('create')}>
                  Create your first budget
                </button>
              </div>
            ) : (
              <ul className="more-budget-fs__plan-list">
                {plans.map((p) => (
                  <li key={p.id} className="more-budget-fs__plan-item">
                    <span className="more-budget-fs__plan-ico">{p.icon}</span>
                    <div className="more-budget-fs__plan-mid">
                      <strong>{p.name}</strong>
                      <span>{catMap[p.categoryId]?.name || 'Category'}</span>
                    </div>
                    <span className="more-budget-fs__plan-amt">{fmtRp(p.amount)}</span>
                    <button
                      type="button"
                      className="more-budget-fs__plan-del"
                      aria-label="Hapus budget"
                      onClick={() => {
                        dispatch({ type: 'DELETE_BUDGET_PLAN', id: p.id })
                        onToast('Budget dihapus')
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="more-budget-fs__list-footer">
            <button type="button" className="more-budget-fs__add-foot" onClick={() => setView('create')}>
              +Add
            </button>
          </div>
        </div>
      ) : (
        <BudgetCreateView
          categories={state.categories.filter((c) => categoryMatchesType(c, 'expense'))}
          catMap={catMap}
          onBack={() => setView('list')}
          onClose={onClose}
          onToast={onToast}
          onSaved={() => setView('list')}
          dispatch={dispatch}
        />
      )}
    </div>
  )
}

function startOfSunWeek(d) {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay())
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfSunWeekFromStart(weekStart) {
  const e = new Date(weekStart)
  e.setDate(e.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

function CategoryManagementFullScreen({ onClose, onToast }) {
  const { state, dispatch } = useFinance()
  const [tab, setTab] = useState('expense')
  const [view, setView] = useState('list')
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('📁')
  const [detailCat, setDetailCat] = useState(null)
  const [memberMode, setMemberMode] = useState('expense')
  const [accountMode, setAccountMode] = useState('income')

  const { weekStart, weekEnd } = useMemo(() => {
    const ws = startOfSunWeek(new Date())
    return { weekStart: ws, weekEnd: endOfSunWeekFromStart(ws) }
  }, [])

  const filtered = useMemo(
    () => state.categories.filter((c) => categoryMatchesType(c, tab)),
    [state.categories, tab],
  )

  const defaultBook = state.books.find((b) => b.id === state.defaultBookId) || state.books[0]

  const rangeLabel = useMemo(() => {
    const a = weekStart.toLocaleDateString('en-US')
    const b = weekEnd.toLocaleDateString('en-US')
    return `${a} - ${b}`
  }, [weekStart, weekEnd])

  const detailMetrics = useMemo(() => {
    if (!detailCat) return null
    const ledger = filterLedger(state.transactions)
    const txs = ledger.filter((t) => {
      const ts = t.createdAt || 0
      return (
        t.categoryId === detailCat.id &&
        t.bookId === state.defaultBookId &&
        ts >= weekStart.getTime() &&
        ts <= weekEnd.getTime()
      )
    })
    const expenseTotal = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const incomeTotal = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const memberTotal = txs.filter((t) => t.type === memberMode).reduce((s, t) => s + t.amount, 0)
    const accountTotal = txs.filter((t) => t.type === accountMode).reduce((s, t) => s + t.amount, 0)
    return {
      billCount: txs.length,
      expenseTotal,
      incomeTotal,
      memberTotal,
      accountTotal,
    }
  }, [detailCat, state.transactions, state.defaultBookId, weekStart, weekEnd, memberMode, accountMode])

  const saveAdd = () => {
    if (!addName.trim()) {
      onToast('Nama kategori wajib')
      return
    }
    dispatch({ type: 'ADD_CATEGORY', name: addName.trim(), icon: addIcon, kind: tab })
    setAddName('')
    setAddIcon('📁')
    setView('list')
    onToast('Kategori ditambah')
  }

  const removeCat = (cat) => {
    if (PROTECTED_CATEGORY_IDS.has(cat.id)) {
      onToast('Kategori bawaan tidak bisa dihapus')
      return
    }
    dispatch({ type: 'DELETE_CATEGORY', id: cat.id })
    onToast('Kategori dihapus')
  }

  const openDetail = (cat) => {
    setDetailCat(cat)
    setMemberMode('expense')
    setAccountMode('income')
    setView('detail')
  }

  const backFromDetail = () => {
    setDetailCat(null)
    setView('list')
  }

  if (view === 'add') {
    return (
      <div className="more-cat-fs-root" role="dialog" aria-modal="true">
        <div className="more-cat-fs more-cat-fs--stack">
          <FullScreenHeader
            className="more-cat-fs__header more-cat-fs__header--primary more-cat-fs__header--solid"
            title="Add Category"
            onBack={() => setView('list')}
            onClose={onClose}
          />
          <div className="more-cat-fs__subbody">
            <p className="more-cat-fs__kind-hint">{tab === 'income' ? 'Income' : 'Expense'}</p>
            <div className="form-field">
              <label>Ikon</label>
              <input value={addIcon} onChange={(e) => setAddIcon(e.target.value)} maxLength={4} />
            </div>
            <div className="form-field">
              <label>Nama</label>
              <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Category name" />
            </div>
            <button type="button" className="more-cat-fs__save-btn" onClick={saveAdd}>
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'detail' && detailCat && detailMetrics) {
    const isExp = categoryMatchesType(detailCat, 'expense')
    const mainTotal = isExp ? detailMetrics.expenseTotal : detailMetrics.incomeTotal
    const mainClass = isExp ? 'more-cat-fs__sum more-cat-fs__sum--out' : 'more-cat-fs__sum more-cat-fs__sum--in'

    return (
      <div className="more-cat-fs-root more-cat-fs-root--detail" role="dialog" aria-modal="true">
        <div className="more-cat-fs more-cat-fs--stack">
          <FullScreenHeader
            className="more-cat-fs__header more-cat-fs__header--primary more-cat-fs__header--solid"
            title={detailCat.name}
            onBack={backFromDetail}
            onClose={onClose}
          />

          <div className="more-cat-fs__detail-scroll">
            <section className="more-cat-fs__card more-cat-fs__card--hero">
              <div className="more-cat-fs__hero-top">
                <div>
                  <h2 className="more-cat-fs__cat-title">{detailCat.name}</h2>
                  <p className="more-cat-fs__cat-sub">{defaultBook?.name || 'Default Book'}</p>
                </div>
                <span className="more-cat-fs__hero-ico" aria-hidden>
                  {detailCat.icon}
                </span>
              </div>
              <div className="more-cat-fs__date-row">
                <button type="button" className="more-cat-fs__chev-btn" aria-label="Previous week" disabled>
                  ‹
                </button>
                <span className="more-cat-fs__date-range">{rangeLabel}</span>
                <button type="button" className="more-cat-fs__chev-btn" aria-label="Next week" disabled>
                  ›
                </button>
              </div>
              <div className="more-cat-fs__stats-row">
                <span className="more-cat-fs__bills">{detailMetrics.billCount} Number of Bills</span>
                <div className="more-cat-fs__total-block">
                  <span className={mainClass}>{fmtRp(mainTotal)}</span>
                  <span className="more-cat-fs__total-label">Total</span>
                </div>
              </div>
              <div className="more-cat-fs__freq-row">
                <span>Weekly</span>
                <span className="more-cat-fs__chev-sm" aria-hidden>
                  ▾
                </span>
              </div>
            </section>

            <p className="more-cat-fs__section-label">Charts</p>
            <section className="more-cat-fs__card">
              <h3 className="more-cat-fs__card-title">Trends</h3>
              <div className="more-cat-fs__trends-box">
                {!state.premium ? (
                  <div className="more-cat-fs__premium-lock">
                    <span aria-hidden>👑</span>
                    <span>Purchase premium to unlock this feature</span>
                  </div>
                ) : (
                  <p className="more-cat-fs__muted">Trend chart (demo)</p>
                )}
              </div>
              <div className="more-cat-fs__trends-head">
                <span>Date ▾</span>
                <span>Expenses</span>
                <span>Total</span>
              </div>
            </section>

            <section className="more-cat-fs__card">
              <div className="more-cat-fs__card-head">
                <span className="more-cat-fs__card-title-inline">
                  Member <span className="more-cat-fs__chev-sm">›</span>
                </span>
                <div className="more-cat-fs__mini-toggle" role="group" aria-label="Member type">
                  <button
                    type="button"
                    className={memberMode === 'expense' ? 'more-cat-fs__mini-toggle-btn more-cat-fs__mini-toggle-btn--on' : 'more-cat-fs__mini-toggle-btn'}
                    onClick={() => setMemberMode('expense')}
                  >
                    Expenses
                  </button>
                  <button
                    type="button"
                    className={memberMode === 'income' ? 'more-cat-fs__mini-toggle-btn more-cat-fs__mini-toggle-btn--on' : 'more-cat-fs__mini-toggle-btn'}
                    onClick={() => setMemberMode('income')}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div className="more-cat-fs__split-body">
                <div>
                  <p className="more-cat-fs__used-qty">{detailMetrics.billCount}/6 Used/Quantity</p>
                  <p className="more-cat-fs__split-total">
                    <span className={memberMode === 'expense' ? 'more-cat-fs__sum--out-txt' : 'more-cat-fs__sum--in-txt'}>
                      {fmtRp(detailMetrics.memberTotal)}
                    </span>
                    <span className="more-cat-fs__total-label"> Total</span>
                  </p>
                </div>
                <span className="more-cat-fs__emoji" aria-hidden>
                  😆
                </span>
              </div>
              {detailMetrics.memberTotal === 0 ? (
                <p className="more-cat-fs__empty-tx">No Transactions in this period!</p>
              ) : null}
            </section>

            <section className="more-cat-fs__card">
              <div className="more-cat-fs__card-head">
                <span className="more-cat-fs__card-title-inline">
                  Account <span className="more-cat-fs__chev-sm">›</span>
                </span>
                <div className="more-cat-fs__mini-toggle" role="group" aria-label="Account type">
                  <button
                    type="button"
                    className={accountMode === 'expense' ? 'more-cat-fs__mini-toggle-btn more-cat-fs__mini-toggle-btn--on' : 'more-cat-fs__mini-toggle-btn'}
                    onClick={() => setAccountMode('expense')}
                  >
                    Expenses
                  </button>
                  <button
                    type="button"
                    className={accountMode === 'income' ? 'more-cat-fs__mini-toggle-btn more-cat-fs__mini-toggle-btn--on' : 'more-cat-fs__mini-toggle-btn'}
                    onClick={() => setAccountMode('income')}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div className="more-cat-fs__split-body">
                <div>
                  <p className="more-cat-fs__used-qty">{detailMetrics.billCount}/6 Used/Quantity</p>
                  <p className="more-cat-fs__split-total">
                    <span className={accountMode === 'expense' ? 'more-cat-fs__sum--out-txt' : 'more-cat-fs__sum--in-txt'}>
                      {fmtRp(detailMetrics.accountTotal)}
                    </span>
                    <span className="more-cat-fs__total-label"> Total</span>
                  </p>
                </div>
                <span className="more-cat-fs__emoji" aria-hidden>
                  😆
                </span>
              </div>
              {detailMetrics.accountTotal === 0 ? (
                <p className="more-cat-fs__empty-tx">No Transactions in this period!</p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="more-cat-fs-root" role="dialog" aria-modal="true">
      <div className="more-cat-fs more-cat-fs--stack">
        <div className="more-cat-fs__blue-top">
          <FullScreenHeader
            className="more-cat-fs__header more-cat-fs__header--primary"
            title="Category Management"
            onClose={onClose}
          />

          <div className="more-cat-fs__tabs" role="tablist" aria-label="Category type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'expense'}
              className={tab === 'expense' ? 'more-cat-fs__tab more-cat-fs__tab--on' : 'more-cat-fs__tab'}
              onClick={() => setTab('expense')}
            >
              <span aria-hidden>🛒</span> Expense
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'income'}
              className={tab === 'income' ? 'more-cat-fs__tab more-cat-fs__tab--on' : 'more-cat-fs__tab'}
              onClick={() => setTab('income')}
            >
              <span aria-hidden>💰</span> Income
            </button>
          </div>
        </div>

        <ul className="more-cat-fs__list">
          {filtered.map((cat) => (
            <li key={cat.id} className="more-cat-fs__row">
              <button type="button" className="more-cat-fs__row-main" onClick={() => openDetail(cat)}>
                <span className="more-cat-fs__row-ico" aria-hidden>
                  {cat.icon}
                </span>
                <span className="more-cat-fs__row-name">{cat.name}</span>
              </button>
              {!PROTECTED_CATEGORY_IDS.has(cat.id) ? (
                <button type="button" className="more-cat-fs__row-del" aria-label="Delete category" onClick={() => removeCat(cat)}>
                  ×
                </button>
              ) : (
                <span className="more-cat-fs__row-del-spacer" aria-hidden />
              )}
              <span className="more-cat-fs__drag" aria-hidden>
                <span />
                <span />
              </span>
            </li>
          ))}
        </ul>

        <div className="more-cat-fs__footer">
          <button type="button" className="more-cat-fs__add-link" onClick={() => setView('add')}>
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MoreScreen({ user, onLogout, onProfileChange, onToast, setTab }) {
  const { state, dispatch } = useFinance()
  const [modal, setModal] = useState(null)
  const [accountFsOpen, setAccountFsOpen] = useState(false)
  const [premiumFsOpen, setPremiumFsOpen] = useState(false)
  const [budgetFsOpen, setBudgetFsOpen] = useState(false)
  const [categoryFsOpen, setCategoryFsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user.name || '')
  const [searchQ, setSearchQ] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [rateStars, setRateStars] = useState(0)
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

  const saveProfile = () => {
    onProfileChange(displayName.trim() || user.email)
    setModal(null)
    onToast('Profil diperbarui')
  }

  const buyPremium = () => {
    dispatch({ type: 'SET_PREMIUM', value: true })
    setPremiumFsOpen(false)
    onToast('Premium aktif (demo)')
  }

  const submitFeedback = () => {
    if (!feedbackText.trim()) {
      onToast('Tulis feedback dulu')
      return
    }
    dispatch({ type: 'ADD_FEEDBACK', text: feedbackText })
    setFeedbackText('')
    setModal(null)
    onToast('Terima kasih!')
  }

  const submitRating = () => {
    if (rateStars < 1) {
      onToast('Pilih bintang')
      return
    }
    dispatch({ type: 'ADD_RATING', stars: rateStars })
    setModal(null)
    onToast('Penilaian tersimpan')
  }

  return (
    <>
      {accountFsOpen ? (
        <AccountManagementFlow onClose={() => setAccountFsOpen(false)} onToast={onToast} initialView="list" />
      ) : null}
      {premiumFsOpen ? (
        <MorePremiumFullScreen
          onClose={() => setPremiumFsOpen(false)}
          onToast={onToast}
          onPurchase={buyPremium}
          isPremium={state.premium}
        />
      ) : null}
      {budgetFsOpen ? <BudgetFlowFullScreen onClose={() => setBudgetFsOpen(false)} onToast={onToast} /> : null}
      {categoryFsOpen ? (
        <CategoryManagementFullScreen onClose={() => setCategoryFsOpen(false)} onToast={onToast} />
      ) : null}
      <div className="app-scroll app-scroll--more">
      <div className="screen-more__hero">
        <div className="avatar" aria-hidden>
          👤
        </div>
        <h2>
          {user.name || 'User'}
          {state.premium ? <span className="premium-badge">PRO</span> : null}
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
          <button type="button" onClick={() => setPremiumFsOpen(true)}>
            <span className="ic">⭐</span>
            Purchase Premium
          </button>
          <button type="button" onClick={() => setBudgetFsOpen(true)}>
            <span className="ic">📊</span>
            Budget Management
          </button>
          <button type="button" onClick={() => setCategoryFsOpen(true)}>
            <span className="ic">🏷️</span>
            Category Management
          </button>
          <button type="button" onClick={() => setModal('settings')}>
            <span className="ic">⚙️</span>
            Settings
          </button>
        </div>
      </section>

      <div className="support-list">
        <button type="button" onClick={() => setModal('help')}>
          Help &amp; Support <span>›</span>
        </button>
        <button type="button" onClick={() => setModal('feedback')}>
          Send Feedback <span>›</span>
        </button>
        <button type="button" onClick={() => { setRateStars(0); setModal('rate') }}>
          Rate This App <span>›</span>
        </button>
      </div>

      <button type="button" className="btn-logout" onClick={onLogout}>
        Log out
      </button>

      {modal === 'profile' && (
        <Sheet title="Edit Profile" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Nama tampilan</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input value={user.email} disabled style={{ opacity: 0.7 }} />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Tutup
            </button>
            <button type="button" className="btn-confirm" onClick={saveProfile}>
              Simpan
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'settings' && (
        <Sheet title="Settings" onClose={() => setModal(null)} center>
          <div className="toggle-inline">
            <span>Notifikasi (demo)</span>
            <input
              type="checkbox"
              checked={state.settings.notifications}
              onChange={(e) => dispatch({ type: 'SET_SETTINGS', patch: { notifications: e.target.checked } })}
            />
          </div>
          <div className="toggle-inline">
            <span>Angka ringkas</span>
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
            <label>Kata kunci</label>
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Catatan atau kategori" />
          </div>
          <div className="card-list" style={{ maxHeight: 280, overflow: 'auto' }}>
            {filteredSearch.length === 0 ? (
              <div className="card-list__item" style={{ justifyContent: 'center', color: 'var(--app-muted)' }}>
                {searchQ.trim() ? 'Tidak ada hasil' : 'Ketik untuk mencari'}
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
                    Hapus
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
            <h4>Memulai</h4>
            <p>Tambah transaksi di tab Books. Transfer &amp; top up di Wallet. Grafik mengikuti data Anda.</p>
            <h4>Data</h4>
            <p>{isDemoMode() ? 'Semua disimpan lokal di browser (localStorage) untuk akun email Anda.' : 'Data tersimpan aman di server. Login di perangkat lain untuk akses data yang sama.'}</p>
            <h4>Kontak</h4>
            <p>Demo aplikasi — gunakan Kirim feedback untuk catatan ke pengembang.</p>
          </div>
        </Sheet>
      )}

      {modal === 'feedback' && (
        <Sheet title="Send Feedback" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Pesan</label>
            <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Saran atau masalah..." />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Batal
            </button>
            <button type="button" className="btn-confirm" onClick={submitFeedback}>
              Kirim
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'rate' && (
        <Sheet title="Rate This App" onClose={() => setModal(null)} center>
          <p style={{ textAlign: 'center', color: 'var(--app-muted)' }}>Berapa bintang?</p>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRateStars(n)} aria-label={`${n} bintang`}>
                {n <= rateStars ? '★' : '☆'}
              </button>
            ))}
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Tutup
            </button>
            <button type="button" className="btn-confirm" onClick={submitRating}>
              Kirim
            </button>
          </div>
        </Sheet>
      )}
    </div>
    </>
  )
}