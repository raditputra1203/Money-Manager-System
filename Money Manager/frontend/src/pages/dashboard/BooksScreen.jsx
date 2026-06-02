import { useMemo, useState } from 'react'
import { categoryMatchesType, filterLedger, isCurrentMonth } from '../../financeHelpers.js'
import { useCategoryMap, useFinance } from '../../financeStore.jsx'
import Sheet from '../../components/Sheet.jsx'
import { BookWalletIcon } from '../../components/icons/WalletIcons.jsx'
import { categoryIconTone } from '../../utils/categoryMeta.js'
import {
  fmtRp,
  fmtRpBooksDisplay,
  fmtTxAmountBooks,
  relativeDayLabelEn,
} from '../../utils/formatters.js'

export default function BooksScreen({ onToast }) {
  const { state, dispatch } = useFinance()
  const catMap = useCategoryMap()
  const [modal, setModal] = useState(null)
  const [bookName, setBookName] = useState('')
  const [txForm, setTxForm] = useState({
    type: 'expense',
    amount: '',
    bookId: '',
    accountId: '',
    categoryId: '',
    note: '',
  })

  const defaultBook = state.books.find((b) => b.id === state.defaultBookId) || state.books[0]
  const ledger = filterLedger(state.transactions)
  const sorted = useMemo(() => [...ledger].sort((a, b) => b.createdAt - a.createdAt), [ledger])

  const monthIncome = ledger
    .filter((t) => t.bookId === state.defaultBookId && t.type === 'income' && isCurrentMonth(t.createdAt))
    .reduce((s, t) => s + t.amount, 0)
  const monthExpense = ledger
    .filter((t) => t.bookId === state.defaultBookId && t.type === 'expense' && isCurrentMonth(t.createdAt))
    .reduce((s, t) => s + t.amount, 0)

  const openAddTx = () => {
    const firstExp = state.categories.find((c) => categoryMatchesType(c, 'expense'))
    setTxForm({
      type: 'expense',
      amount: '',
      bookId: state.defaultBookId,
      accountId: state.accounts[0]?.id || '',
      categoryId: firstExp?.id || state.categories[0]?.id || '',
      note: '',
    })
    setModal('tx')
  }

  const submitBook = () => {
    if (!bookName.trim()) {
      onToast('Nama buku wajib diisi')
      return
    }
    dispatch({ type: 'ADD_BOOK', name: bookName })
    setBookName('')
    setModal(null)
    onToast('Buku ditambahkan')
  }

  const submitTx = () => {
    const amt = Number(txForm.amount)
    if (!amt || amt <= 0) {
      onToast('Nominal tidak valid')
      return
    }
    const acc = state.accounts.find((a) => a.id === txForm.accountId)
    if (txForm.type === 'expense' && acc && acc.balance < amt) {
      onToast('Saldo akun tidak cukup')
      return
    }
    dispatch({
      type: 'ADD_TRANSACTION',
      bookId: txForm.bookId,
      accountId: txForm.accountId,
      entryType: txForm.type,
      amount: amt,
      categoryId: txForm.categoryId,
      note: txForm.note,
    })
    setModal(null)
    onToast('Transaksi tersimpan')
  }

  return (
    <div className="app-scroll app-scroll--books">
      <header className="books-hero">
        <h1 className="books-hero__title">
          {defaultBook?.subtitle === 'Default book' ? 'Default Book' : defaultBook?.name || 'Book'}
        </h1>
        <p className="books-hero__subtitle">Manage your finances</p>
        <p className="books-hero__balance-label">Total Balance</p>
        <p className="books-hero__balance">{fmtRpBooksDisplay(defaultBook?.balance ?? 0)}</p>
        <div className="books-hero__stats">
          <div className="books-stat books-stat--income">
            <div className="books-stat__icon books-stat__icon--in" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <path d="M12 5v14M12 19l-4-4M12 19l4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="books-stat__text">
              <span className="books-stat__label">Income</span>
              <strong className="books-stat__value">{fmtRpBooksDisplay(monthIncome)}</strong>
            </div>
          </div>
          <div className="books-stat books-stat--expense">
            <div className="books-stat__icon books-stat__icon--out" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <path d="M12 19V5M12 5l4 4M12 5l-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="books-stat__text">
              <span className="books-stat__label">Expense</span>
              <strong className="books-stat__value">{fmtRpBooksDisplay(monthExpense)}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="books-section">
        <div className="books-section__head">
          <h2 className="books-section__title">Your Books</h2>
          <button type="button" className="books-section__link" onClick={() => setModal('books-all')}>
            View All
          </button>
        </div>
        <div className="books-cards">
          {state.books.map((b) => {
            const isActive = b.id === state.defaultBookId
            const variant = b.variant === 'blue' ? 'blue' : 'purple'
            return (
              <button
                key={b.id}
                type="button"
                className={`book-tile ${isActive ? 'book-tile--active' : ''}`}
                title={b.locked ? 'Buku default tidak dapat dihapus.' : 'Ketuk untuk jadikan buku aktif'}
                onClick={() => dispatch({ type: 'SET_DEFAULT_BOOK', bookId: b.id })}
              >
                <div className={`book-tile__icon book-tile__icon--${variant}`}>
                  <BookWalletIcon />
                </div>
                <div className="book-tile__mid">
                  <strong className="book-tile__name">{b.name}</strong>
                  <span className="book-tile__sub">{b.subtitle || '\u00a0'}</span>
                </div>
                <div className="book-tile__right">
                  <strong className="book-tile__amt">{fmtRpBooksDisplay(b.balance)}</strong>
                  <span className="book-tile__spark" aria-hidden />
                </div>
              </button>
            )
          })}
          <button type="button" className="book-tile book-tile--add" onClick={() => setModal('book')}>
            <span className="book-tile--add__plus">+</span>
            <span>Add New Book</span>
          </button>
        </div>
      </section>

      <section className="books-section">
        <div className="books-section__head">
          <h2 className="books-section__title">Recent Transactions</h2>
          <button type="button" className="books-section__link" onClick={() => setModal('tx-all')}>
            See All
          </button>
        </div>
        <div className="books-tx-card">
          {sorted.length === 0 ? (
            <div className="books-tx-row books-tx-row--empty">Belum ada transaksi</div>
          ) : (
            sorted.slice(0, 3).map((t, idx, arr) => {
              const cat = catMap[t.categoryId]
              const tone = categoryIconTone(t.categoryId)
              const last = idx === arr.length - 1
              return (
                <div key={t.id} className={`books-tx-row ${last ? 'books-tx-row--last' : ''}`}>
                  <div className={`books-tx-icon books-tx-icon--${tone}`}>{cat?.icon || '📝'}</div>
                  <div className="books-tx-meta">
                    <strong>{cat?.name || 'Other'}</strong>
                    <span>{t.note || '—'}</span>
                  </div>
                  <div className="books-tx-right">
                    <span className={t.type === 'income' ? 'books-tx-amt books-tx-amt--in' : 'books-tx-amt books-tx-amt--out'}>
                      {fmtTxAmountBooks(t.amount, t.type)}
                    </span>
                    <span className="books-tx-when">{relativeDayLabelEn(t.createdAt)}</span>
                    <button
                      type="button"
                      className="books-tx-del"
                      aria-label="Hapus transaksi"
                      onClick={() => dispatch({ type: 'DELETE_TRANSACTION', id: t.id })}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                        <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <button type="button" className="books-fab" aria-label="Tambah transaksi" onClick={openAddTx}>
        +
      </button>

      {modal === 'books-all' && (
        <Sheet title="Semua buku" onClose={() => setModal(null)} center>
          <p className="sheet-hint">Ketuk buku untuk menjadikannya buku aktif.</p>
          <ul className="books-sheet-list">
            {state.books.map((b) => {
              const isActive = b.id === state.defaultBookId
              const variant = b.variant === 'blue' ? 'blue' : 'purple'
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    className={`books-sheet-list__item ${isActive ? 'books-sheet-list__item--active' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SET_DEFAULT_BOOK', bookId: b.id })
                      onToast(`${b.name} dipilih sebagai buku aktif`)
                    }}
                  >
                    <span className={`books-sheet-list__icon books-sheet-list__icon--${variant}`}>
                      <BookWalletIcon />
                    </span>
                    <span className="books-sheet-list__mid">
                      <strong>{b.name}</strong>
                      <span>{b.subtitle || '—'}</span>
                    </span>
                    <span className="books-sheet-list__amt">{fmtRpBooksDisplay(b.balance)}</span>
                    {isActive ? <span className="books-sheet-list__badge">Aktif</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          <button type="button" className="btn-inline" onClick={() => setModal('book')}>
            + Tambah buku baru
          </button>
        </Sheet>
      )}

      {modal === 'tx-all' && (
        <Sheet title="Semua transaksi" onClose={() => setModal(null)} center>
          {sorted.length === 0 ? (
            <p className="sheet-hint sheet-hint--center">Belum ada transaksi</p>
          ) : (
            <div className="books-tx-card books-tx-card--in-sheet">
              {sorted.map((t, idx, arr) => {
                const cat = catMap[t.categoryId]
                const tone = categoryIconTone(t.categoryId)
                const last = idx === arr.length - 1
                const book = state.books.find((b) => b.id === t.bookId)
                return (
                  <div key={t.id} className={`books-tx-row ${last ? 'books-tx-row--last' : ''}`}>
                    <div className={`books-tx-icon books-tx-icon--${tone}`}>{cat?.icon || '📝'}</div>
                    <div className="books-tx-meta">
                      <strong>{cat?.name || 'Other'}</strong>
                      <span>
                        {t.note || '—'}
                        {book ? ` · ${book.name}` : ''}
                      </span>
                    </div>
                    <div className="books-tx-right">
                      <span className={t.type === 'income' ? 'books-tx-amt books-tx-amt--in' : 'books-tx-amt books-tx-amt--out'}>
                        {fmtTxAmountBooks(t.amount, t.type)}
                      </span>
                      <span className="books-tx-when">{relativeDayLabelEn(t.createdAt)}</span>
                      <button
                        type="button"
                        className="books-tx-del"
                        aria-label="Hapus transaksi"
                        onClick={() => dispatch({ type: 'DELETE_TRANSACTION', id: t.id })}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                          <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Sheet>
      )}

      {modal === 'book' && (
        <Sheet title="Buku baru" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label htmlFor="bn">Nama buku</label>
            <input id="bn" value={bookName} onChange={(e) => setBookName(e.target.value)} placeholder="Mis. Tabungan" />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Batal
            </button>
            <button type="button" className="btn-confirm" onClick={submitBook}>
              Simpan
            </button>
          </div>
        </Sheet>
      )}

      {modal === 'tx' && (
        <Sheet title="Transaksi baru" onClose={() => setModal(null)} center>
          <div className="form-field">
            <label>Jenis</label>
            <select
              value={txForm.type}
              onChange={(e) => {
                const type = e.target.value
                const list = state.categories.filter((c) => categoryMatchesType(c, type))
                const nextId = list.some((c) => c.id === txForm.categoryId) ? txForm.categoryId : list[0]?.id || ''
                setTxForm((f) => ({ ...f, type, categoryId: nextId }))
              }}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="amt">Nominal (Rp)</label>
            <input
              id="amt"
              inputMode="numeric"
              value={txForm.amount}
              onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <label>Buku</label>
            <select value={txForm.bookId} onChange={(e) => setTxForm((f) => ({ ...f, bookId: e.target.value }))}>
              {state.books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Akun</label>
            <select value={txForm.accountId} onChange={(e) => setTxForm((f) => ({ ...f, accountId: e.target.value }))}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({fmtRp(a.balance)})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Kategori</label>
            <select value={txForm.categoryId} onChange={(e) => setTxForm((f) => ({ ...f, categoryId: e.target.value }))}>
              {state.categories
                .filter((c) => categoryMatchesType(c, txForm.type))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tn">Catatan</label>
            <input id="tn" value={txForm.note} onChange={(e) => setTxForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
              Batal
            </button>
            <button type="button" className="btn-confirm" onClick={submitTx}>
              Simpan
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
