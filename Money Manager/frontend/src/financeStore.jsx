import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { DEFAULT_CATEGORIES, mergeAndNormalizeCategories } from './financeHelpers.js'
import { isDemoMode, getFinanceState as apiGetFinanceState, addBook as apiAddBook, updateBook as apiUpdateBook, setDefaultBook as apiSetDefaultBook, deleteBook as apiDeleteBook, addAccount as apiAddAccount, updateAccount as apiUpdateAccount, addTransaction as apiAddTransaction, updateTransaction as apiUpdateTransaction, deleteTransaction as apiDeleteTransaction, transfer as apiTransfer, topup as apiTopup, updateSettings as apiUpdateSettings, addFeedback as apiAddFeedback, resetData as apiResetData } from './api.js'

const STORAGE_PREFIX = 'mm_finance_'
const DATA_VERSION = 2

function uid() {
  return crypto.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function seedState() {
  return {
    defaultBookId: null,
    books: [],
    accounts: [],
    transactions: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgets: zeroBudgetsFor(DEFAULT_CATEGORIES.map((c) => ({ ...c }))),
    settings: { notifications: true, compactNumbers: false },
    feedbacks: [],
  }
}

function zeroBudgetsFor(categories) {
  const o = {}
  for (const c of categories) o[c.id] = 0
  return o
}

function inferAccountSource(a) {
  if (a.accountSource) return a.accountSource
  if (a.kind === 'debt') return 'credit'
  if (a.kind === 'savings') return 'debit'
  const n = (a.name || '').toLowerCase()
  if (n.includes('cash')) return 'cash'
  return 'debit'
}

function normalizeAccountsList(accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) return accounts
  const hasExplicitDefault = accounts.some((a) => a.isDefault)
  const withFlags = accounts.map((a, i) => ({
    ...a,
    isUsed: a.isUsed !== false,
    isDefault: hasExplicitDefault ? !!a.isDefault : i === 0,
    accountSource: inferAccountSource(a),
  }))
  const defI = withFlags.findIndex((a) => a.isDefault)
  const idx = defI >= 0 ? defI : 0
  return withFlags.map((a, i) => ({ ...a, isDefault: i === idx }))
}

function loadState(email) {
  if (!email) return seedState()
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + email)
    if (!raw) return seedState()
    const p = JSON.parse(raw)
    if (!Array.isArray(p.books) || !Array.isArray(p.accounts)) return seedState()
    const s = seedState()

    const categories = mergeAndNormalizeCategories(p.categories)

    const hydrateBook = (b, i) => ({
      ...b,
      locked: b.locked ?? (b.name === 'Personal' || b.subtitle === 'Default book'),
      subtitle:
        b.subtitle ??
        (b.name === 'Personal' ? 'Default book' : b.name === 'Business' ? 'Side projects' : ''),
      variant: b.variant ?? (b.name === 'Business' ? 'blue' : i % 2 === 0 ? 'purple' : 'blue'),
    })

    if (p.dataVersion !== DATA_VERSION) {
      const defaultBookId =
        p.defaultBookId && p.books.some((b) => b.id === p.defaultBookId)
          ? p.defaultBookId
          : p.books[0]?.id ?? s.defaultBookId
      return {
        defaultBookId,
        books: p.books.map((b, i) => ({ ...hydrateBook(b, i), balance: 0 })),
        accounts: normalizeAccountsList(p.accounts.map((a) => ({ ...a, balance: 0, subtitle: a.subtitle || '' }))),
        transactions: [],
        categories,
        budgets: { ...zeroBudgetsFor(categories) },
        settings: { ...s.settings, ...(p.settings || {}) },
        feedbacks: Array.isArray(p.feedbacks) ? p.feedbacks : [],
      }
    }

    return {
      defaultBookId: p.defaultBookId ?? s.defaultBookId,
      books: p.books.map((b, i) => hydrateBook(b, i)),
      accounts: normalizeAccountsList(p.accounts),
      transactions: Array.isArray(p.transactions) ? p.transactions : [],
      categories,
      budgets:
        typeof p.budgets === 'object' && p.budgets
          ? { ...zeroBudgetsFor(categories), ...p.budgets }
          : { ...zeroBudgetsFor(categories) },
      settings: { ...s.settings, ...(p.settings || {}) },
      feedbacks: Array.isArray(p.feedbacks) ? p.feedbacks : [],
    }
  } catch {
    return seedState()
  }
}

function saveState(email, state) {
  if (!email) return
  const { defaultBookId, books, accounts, transactions, categories, budgets, settings, feedbacks } =
    state
  localStorage.setItem(
    STORAGE_PREFIX + email,
    JSON.stringify({
      defaultBookId,
      books,
      accounts,
      transactions,
      categories,
      budgets,
      settings,
      feedbacks,
      dataVersion: DATA_VERSION,
    }),
  )
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload

    case 'ADD_BOOK': {
      const id = action.id || uid()
      const n = state.books.length
      const newBook = {
        id,
        name: action.name.trim(),
        balance: 0,
        subtitle: '',
        variant: n % 2 === 0 ? 'purple' : 'blue',
        locked: false,
      }
      return {
        ...state,
        defaultBookId: id,
        books: [...state.books, newBook],
      }
    }

    case 'UPDATE_BOOK': {
      const { id, name, subtitle } = action
      return {
        ...state,
        books: state.books.map((b) =>
          b.id === id
            ? { ...b, name: (name || '').trim() || b.name, subtitle: subtitle !== undefined ? (subtitle || '').trim() : b.subtitle }
            : b,
        ),
      }
    }

    case 'SET_DEFAULT_BOOK':
      return { ...state, defaultBookId: action.bookId }

    case 'DELETE_BOOK': {
      const id = action.bookId
      const victim = state.books.find((b) => b.id === id)
      if (!victim || victim.locked) return state
      if (state.books.length <= 1) return state

      const remaining = state.books.filter((b) => b.id !== id)
      const newDefaultId =
        state.defaultBookId === id ? remaining[0]?.id ?? state.defaultBookId : state.defaultBookId
      const heirId = newDefaultId
      const delta = victim.balance

      const books = remaining.map((b) => (b.id === heirId ? { ...b, balance: b.balance + delta } : b))

      const transactions = state.transactions.map((t) =>
        'bookId' in t && t.bookId === id ? { ...t, bookId: heirId } : t,
      )

      return { ...state, books, defaultBookId: newDefaultId, transactions }
    }

    case 'ADD_TRANSACTION': {
      const { bookId, accountId, entryType, amount, categoryId, note, createdAt } = action
      const amt = Math.abs(Number(amount) || 0)
      if (amt <= 0) return state
      const tx = {
        id: action.id || uid(),
        bookId,
        accountId,
        type: entryType,
        amount: amt,
        categoryId,
        note: (note || '').trim(),
        createdAt: createdAt || Date.now(),
      }
      const accounts = state.accounts.map((a) => {
        if (a.id !== accountId) return a
        const delta = entryType === 'income' ? amt : -amt
        return { ...a, balance: a.balance + delta }
      })
      const books = state.books.map((b) => {
        if (b.id !== bookId) return b
        const delta = entryType === 'income' ? amt : -amt
        return { ...b, balance: b.balance + delta }
      })
      return { ...state, transactions: [tx, ...state.transactions], accounts, books }
    }

    case 'UPDATE_TRANSACTION': {
      const { id, bookId, accountId, entryType, amount, categoryId, note, createdAt } = action
      const amt = Math.abs(Number(amount) || 0)
      if (amt <= 0) return state
      const oldTx = state.transactions.find((t) => t.id === id)
      if (!oldTx) return state

      let accounts = state.accounts.map((a) => {
        if (a.id !== oldTx.accountId) return a
        const rev = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount
        return { ...a, balance: a.balance + rev }
      })
      let books = state.books.map((b) => {
        if (b.id !== oldTx.bookId) return b
        const rev = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount
        return { ...b, balance: b.balance + rev }
      })

      accounts = accounts.map((a) => {
        if (a.id !== accountId) return a
        const delta = entryType === 'income' ? amt : -amt
        return { ...a, balance: a.balance + delta }
      })
      books = books.map((b) => {
        if (b.id !== bookId) return b
        const delta = entryType === 'income' ? amt : -amt
        return { ...b, balance: b.balance + delta }
      })

      const updatedTx = { ...oldTx, bookId, accountId, type: entryType, amount: amt, categoryId, note: (note || '').trim(), createdAt: createdAt || oldTx.createdAt }
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === id ? updatedTx : t)),
        accounts,
        books,
      }
    }

    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.id)
      if (!tx) return state
      let accounts = state.accounts
      let books = state.books

      if (tx.kind === 'transfer') {
        const amt = tx.amount
        accounts = state.accounts.map((a) => {
          if (a.id === tx.fromId) return { ...a, balance: a.balance + amt }
          if (a.id === tx.toId) return { ...a, balance: a.balance - amt }
          return a
        })
      } else if (tx.kind === 'topup') {
        accounts = state.accounts.map((a) =>
          a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a,
        )
      } else if (tx.type === 'income' || tx.type === 'expense') {
        accounts = state.accounts.map((a) => {
          if (a.id !== tx.accountId) return a
          const delta = tx.type === 'income' ? -tx.amount : tx.amount
          return { ...a, balance: a.balance + delta }
        })
        books = state.books.map((b) => {
          if (b.id !== tx.bookId) return b
          const delta = tx.type === 'income' ? -tx.amount : tx.amount
          return { ...b, balance: b.balance + delta }
        })
      }

      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id), accounts, books }
    }

    case 'TRANSFER': {
      const { fromId, toId, amount } = action
      const amt = Math.abs(Number(amount) || 0)
      if (amt <= 0 || fromId === toId) return state
      const from = state.accounts.find((a) => a.id === fromId)
      if (!from || from.balance < amt) return state
      const accounts = state.accounts.map((a) => {
        if (a.id === fromId) return { ...a, balance: a.balance - amt }
        if (a.id === toId) return { ...a, balance: a.balance + amt }
        return a
      })
      const tx = {
        id: uid(),
        kind: 'transfer',
        fromId,
        toId,
        amount: amt,
        createdAt: Date.now(),
      }
      return { ...state, accounts, transactions: [tx, ...state.transactions] }
    }

    case 'TOP_UP': {
      const amt = Math.abs(Number(action.amount) || 0)
      if (amt <= 0) return state
      const accounts = state.accounts.map((a) => (a.id === action.accountId ? { ...a, balance: a.balance + amt } : a))
      const bookId = action.bookId || state.defaultBookId
      const categoryId = action.categoryId || 'i3'
      const note = (action.note || 'Top up').trim()

      const tx = {
        id: uid(),
        kind: 'topup',
        accountId: action.accountId,
        amount: amt,
        createdAt: Date.now(),
      }
      const ledgerTx = {
        id: uid(),
        bookId,
        accountId: action.accountId,
        type: 'income',
        amount: amt,
        categoryId,
        note: `Top up - ${note}`,
        createdAt: Date.now(),
      }
      const books = state.books.map((b) =>
        b.id === bookId ? { ...b, balance: b.balance + amt } : b,
      )
      return { ...state, accounts, books, transactions: [tx, ledgerTx, ...state.transactions] }
    }

    case 'PAY_BILL': {
      const amt = Math.abs(Number(action.amount) || 0)
      if (amt <= 0) return state
      const acc = state.accounts.find((a) => a.id === action.accountId)
      if (!acc || acc.balance < amt) return state
      const bookId = action.bookId || state.defaultBookId
      const categoryId = action.categoryId || 'c5'
      const note = (action.note || 'Pay bill').trim()
      const txExpense = {
        id: uid(),
        bookId,
        accountId: action.accountId,
        type: 'expense',
        amount: amt,
        categoryId,
        note,
        createdAt: Date.now(),
      }
      const accounts = state.accounts.map((a) =>
        a.id === action.accountId ? { ...a, balance: a.balance - amt } : a,
      )
      const books = state.books.map((b) => (b.id === bookId ? { ...b, balance: b.balance - amt } : b))
      return { ...state, transactions: [txExpense, ...state.transactions], accounts, books }
    }

    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: { ...state.budgets, [action.categoryId]: Math.max(0, Number(action.limit) || 0) },
      }

    case 'ADD_ACCOUNT': {
      const name = (action.name || '').trim()
      if (!name) return state
      const id = uid()
      const kind = ['asset', 'debt', 'savings'].includes(action.kind) ? action.kind : 'asset'
      const status = action.status || 'active'
      const accountSource = action.accountSource || 'debit'
      return {
        ...state,
        accounts: [
          ...state.accounts,
          {
            id,
            name,
            balance: 0,
            kind,
            status,
            isUsed: true,
            isDefault: false,
            accountSource,
            subtitle: action.subtitle || '',
            ...(action.goalAmount != null ? { goalAmount: action.goalAmount } : {}),
          },
        ],
      }
    }

    case 'UPDATE_ACCOUNT': {
      const { id, patch } = action
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }
    }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'ADD_FEEDBACK':
      return { ...state, feedbacks: [...(state.feedbacks || []), { id: uid(), text: action.text, at: Date.now() }] }

    case 'RESET_DATA':
      return { ...seedState(), categories: state.categories }

    default:
      return state
  }
}

const FinanceCtx = createContext(null)

export function FinanceProvider({ userEmail, children }) {
  const [state, dispatch] = useReducer(reducer, userEmail, loadState)
  const loadedRef = useRef(false)
  const defaultBookIdRef = useRef(state.defaultBookId)
  useEffect(() => {
    defaultBookIdRef.current = state.defaultBookId
  }, [state.defaultBookId])

  useEffect(() => {
    if (!userEmail || isDemoMode() || loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      try {
        const fresh = await apiGetFinanceState()
        if (fresh) dispatch({ type: 'HYDRATE', payload: fresh })
      } catch (err) {
        console.error('[apiSync] initial load failed, using localStorage', err)
      }
    })()
  }, [userEmail])

  useEffect(() => {
    saveState(userEmail, state)
  }, [userEmail, state])

  const apiDispatch = useMemo(() => {
    if (isDemoMode()) return dispatch

    return async (action) => {
      const type = action.type

      if (type === 'RESET_DATA') {
        try {
          await apiResetData()
          dispatch(action)
        } catch (err) {
          console.error('[apiSync] reset failed', err)
        }
        return
      }

      if (['UPDATE_BUDGET'].includes(type)) {
        dispatch(action)
        return
      }

      const clientId = (type === 'ADD_BOOK' || type === 'ADD_ACCOUNT' || type === 'ADD_TRANSACTION' || type === 'TRANSFER' || type === 'TOP_UP') ? uid() : null
      if (clientId && (type === 'ADD_BOOK' || type === 'ADD_ACCOUNT' || type === 'ADD_TRANSACTION')) {
        action.id = clientId
      }
      if (clientId && type === 'TOP_UP') {
        action.clientId = clientId
      }

      dispatch(action)

      try {
        const apiMap = {
          ADD_BOOK: () => apiAddBook(action.name, clientId),
          UPDATE_BOOK: () => apiUpdateBook(action.id, { name: action.name, subtitle: action.subtitle }),
          SET_DEFAULT_BOOK: () => apiSetDefaultBook(action.bookId),
          DELETE_BOOK: () => apiDeleteBook(action.bookId),
          ADD_TRANSACTION: () => apiAddTransaction({
            bookId: action.bookId,
            accountId: action.accountId,
            entryType: action.entryType,
            amount: action.amount,
            categoryId: action.categoryId,
            note: action.note,
            createdAt: action.createdAt,
            clientId,
          }),
          UPDATE_TRANSACTION: () => apiUpdateTransaction(action.id, {
            bookId: action.bookId,
            accountId: action.accountId,
            entryType: action.entryType,
            amount: action.amount,
            categoryId: action.categoryId,
            note: action.note,
            createdAt: action.createdAt,
          }),
          DELETE_TRANSACTION: () => apiDeleteTransaction(action.id),
          TRANSFER: () => apiTransfer({ fromId: action.fromId, toId: action.toId, amount: action.amount, clientId }),
          TOP_UP: () => Promise.all([
            apiTopup({ accountId: action.accountId, amount: action.amount, clientId }),
            apiAddTransaction({
              bookId: action.bookId || defaultBookIdRef.current,
              accountId: action.accountId,
              entryType: 'income',
              amount: action.amount,
              categoryId: action.categoryId || 'i3',
              note: 'Top up',
            }),
          ]),
          PAY_BILL: () => apiAddTransaction({
            bookId: action.bookId,
            accountId: action.accountId,
            entryType: 'expense',
            amount: action.amount,
            categoryId: action.categoryId,
            note: action.note,
          }),
          ADD_ACCOUNT: () => apiAddAccount({ name: action.name, kind: action.kind, accountSource: action.accountSource, subtitle: action.subtitle, clientId }),
          UPDATE_ACCOUNT: () => apiUpdateAccount(action.id, action.patch),
          SET_SETTINGS: () => apiUpdateSettings(action.patch),
          ADD_FEEDBACK: () => apiAddFeedback({ text: action.text }),
        }

        if (apiMap[type]) {
          await apiMap[type]()
        }
      } catch (err) {
        console.error('[apiSync]', err)
      }
    }
  }, [dispatch])

  const value = useMemo(() => ({ state, dispatch: apiDispatch, userEmail }), [state, apiDispatch, userEmail])

  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>
}

export function useFinance() {
  const v = useContext(FinanceCtx)
  if (!v) throw new Error('useFinance outside FinanceProvider')
  return v
}

export function useCategoryMap() {
  const { state } = useFinance()
  return useMemo(() => {
    const m = {}
    for (const c of state.categories) m[c.id] = c
    return m
  }, [state.categories])
}
