import { supabaseAdmin } from '../lib/supabase.js'
import { httpError } from '../middleware/errorHandler.js'

function num(n) {
  return Number(n) || 0
}

function mapBook(row) {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle || '',
    variant: row.variant || 'purple',
    balance: num(row.balance),
    locked: !!row.locked,
  }
}

function mapAccount(row) {
  return {
    id: row.id,
    name: row.name,
    balance: num(row.balance),
    kind: row.kind,
    status: row.status,
    accountSource: row.account_source,
    goalAmount: row.goal_amount != null ? num(row.goal_amount) : undefined,
    isUsed: row.is_used !== false,
    isDefault: !!row.is_default,
  }
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    kind: row.kind,
  }
}

/** Shape expected by frontend financeStore HYDRATE */
export async function loadFinanceState(userId) {
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (pErr) throw pErr

  const [booksRes, accountsRes, categoriesRes, txRes, movRes, plansRes, fbRes, rtRes] =
    await Promise.all([
      supabaseAdmin.from('books').select('*').eq('user_id', userId).order('created_at'),
      supabaseAdmin.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabaseAdmin.from('categories').select('*').or(`user_id.is.null,user_id.eq.${userId}`),
      supabaseAdmin.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('account_movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('budget_plans').select('*').eq('user_id', userId),
      supabaseAdmin.from('feedbacks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('ratings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

  for (const res of [booksRes, accountsRes, categoriesRes, txRes, movRes, plansRes, fbRes, rtRes]) {
    if (res.error) throw res.error
  }

  const ledger = (txRes.data || []).map((t) => ({
    id: t.id,
    bookId: t.book_id,
    accountId: t.account_id,
    type: t.type,
    amount: num(t.amount),
    categoryId: t.category_id,
    note: t.note || '',
    createdAt: new Date(t.created_at).getTime(),
  }))

  const movements = (movRes.data || []).map((m) => {
    if (m.kind === 'transfer') {
      return {
        id: m.id,
        kind: 'transfer',
        fromId: m.from_account_id,
        toId: m.to_account_id,
        amount: num(m.amount),
        createdAt: new Date(m.created_at).getTime(),
      }
    }
    return {
      id: m.id,
      kind: 'topup',
      accountId: m.account_id,
      amount: num(m.amount),
      createdAt: new Date(m.created_at).getTime(),
    }
  })

  const transactions = [...ledger, ...movements].sort((a, b) => b.createdAt - a.createdAt)

  const categories = (categoriesRes.data || []).map(mapCategory)
  const budgets = {}
  for (const c of categories) budgets[c.id] = 0
  for (const p of plansRes.data || []) budgets[p.category_id] = num(p.amount)

  return {
    defaultBookId: profile.default_book_id,
    books: (booksRes.data || []).map(mapBook),
    accounts: (accountsRes.data || []).map(mapAccount),
    transactions,
    categories,
    budgets,
    budgetPlans: (plansRes.data || []).map((p) => ({
      id: p.id,
      categoryId: p.category_id,
      name: p.name,
      icon: p.icon,
      amount: num(p.amount),
      period: p.period,
      startDate: p.start_date,
      note: p.note || '',
    })),
    premium: !!profile.premium,
    settings: profile.settings || { notifications: true, compactNumbers: false },
    feedbacks: (fbRes.data || []).map((f) => ({ id: f.id, text: f.body, createdAt: new Date(f.created_at).getTime() })),
    ratings: (rtRes.data || []).map((r) => ({ id: r.id, stars: r.stars, createdAt: new Date(r.created_at).getTime() })),
  }
}

export async function addBook(userId, name, clientId) {
  const n = (name || '').trim()
  if (!n) throw httpError(400, 'Nama buku wajib')

  const { count } = await supabaseAdmin.from('books').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  const variant = (count || 0) % 2 === 0 ? 'purple' : 'blue'

  const insert = { user_id: userId, name: n, subtitle: '', variant, balance: 0, locked: false }
  if (clientId) insert.id = clientId

  const { data, error } = await supabaseAdmin
    .from('books')
    .insert(insert)
    .select()
    .single()
  if (error) throw error
  return mapBook(data)
}

export async function setDefaultBook(userId, bookId) {
  const { error } = await supabaseAdmin.from('profiles').update({ default_book_id: bookId }).eq('id', userId)
  if (error) throw error
}

export async function addAccount(userId, { name, kind, accountSource, clientId }) {
  const n = (name || '').trim()
  if (!n) throw httpError(400, 'Nama akun wajib')

  const insert = {
    user_id: userId,
    name: n,
    balance: 0,
    kind: ['asset', 'debt', 'savings'].includes(kind) ? kind : 'asset',
    status: 'active',
    account_source: accountSource || 'debit',
    is_used: true,
    is_default: false,
  }
  if (clientId) insert.id = clientId

  const { data, error } = await supabaseAdmin
    .from('accounts')
    .insert(insert)
    .select()
    .single()
  if (error) throw error
  return mapAccount(data)
}

export async function updateAccount(userId, accountId, patch) {
  const row = {}
  if (patch.isUsed !== undefined) row.is_used = patch.isUsed
  if (patch.name !== undefined) row.name = patch.name
  const { error } = await supabaseAdmin.from('accounts').update(row).eq('id', accountId).eq('user_id', userId)
  if (error) throw error
}

async function adjustBalances(userId, { bookId, accountId, bookDelta, accountDelta }) {
  if (accountId && accountDelta) {
    const { data: acc } = await supabaseAdmin.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
    if (!acc) throw httpError(404, 'Akun tidak ditemukan')
    const next = num(acc.balance) + accountDelta
    await supabaseAdmin.from('accounts').update({ balance: next }).eq('id', accountId)
  }
  if (bookId && bookDelta) {
    const { data: book } = await supabaseAdmin.from('books').select('balance').eq('id', bookId).eq('user_id', userId).single()
    if (!book) throw httpError(404, 'Buku tidak ditemukan')
    const next = num(book.balance) + bookDelta
    await supabaseAdmin.from('books').update({ balance: next }).eq('id', bookId)
  }
}

export async function addLedgerTransaction(userId, { bookId, accountId, entryType, amount, categoryId, note, clientId }) {
  const amt = Math.abs(Number(amount) || 0)
  if (amt <= 0) throw httpError(400, 'Nominal tidak valid')
  if (!['income', 'expense'].includes(entryType)) throw httpError(400, 'Jenis transaksi tidak valid')

  const { data: acc } = await supabaseAdmin.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
  if (!acc) throw httpError(404, 'Akun tidak ditemukan')
  if (entryType === 'expense' && num(acc.balance) < amt) throw httpError(400, 'Saldo akun tidak cukup')

  const bookDelta = entryType === 'income' ? amt : -amt
  const accountDelta = bookDelta

  const insert = {
    user_id: userId,
    book_id: bookId,
    account_id: accountId,
    category_id: categoryId,
    type: entryType,
    amount: amt,
    note: (note || '').trim(),
  }
  if (clientId) insert.id = clientId

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert(insert)
    .select()
    .single()
  if (error) throw error

  await adjustBalances(userId, { bookId, accountId, bookDelta, accountDelta })

  return {
    id: data.id,
    bookId: data.book_id,
    accountId: data.account_id,
    type: data.type,
    amount: num(data.amount),
    categoryId: data.category_id,
    note: data.note || '',
    createdAt: new Date(data.created_at).getTime(),
  }
}

export async function deleteTransaction(userId, transactionId) {
  const { data: tx } = await supabaseAdmin.from('transactions').select('*').eq('id', transactionId).eq('user_id', userId).maybeSingle()
  if (tx) {
    const rev = tx.type === 'income' ? -num(tx.amount) : num(tx.amount)
    await adjustBalances(userId, {
      bookId: tx.book_id,
      accountId: tx.account_id,
      bookDelta: rev,
      accountDelta: rev,
    })
    await supabaseAdmin.from('transactions').delete().eq('id', transactionId)
    return
  }

  const { data: mov } = await supabaseAdmin
    .from('account_movements')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!mov) throw httpError(404, 'Transaksi tidak ditemukan')

  if (mov.kind === 'transfer') {
    await adjustBalances(userId, { accountId: mov.from_account_id, accountDelta: num(mov.amount) })
    await adjustBalances(userId, { accountId: mov.to_account_id, accountDelta: -num(mov.amount) })
  } else {
    await adjustBalances(userId, { accountId: mov.account_id, accountDelta: -num(mov.amount) })
  }
  await supabaseAdmin.from('account_movements').delete().eq('id', transactionId)
}

export async function transfer(userId, { fromId, toId, amount, clientId }) {
  const amt = Math.abs(Number(amount) || 0)
  if (amt <= 0) throw httpError(400, 'Nominal tidak valid')
  if (fromId === toId) throw httpError(400, 'Pilih akun berbeda')

  const { data: from } = await supabaseAdmin.from('accounts').select('balance').eq('id', fromId).eq('user_id', userId).single()
  if (!from || num(from.balance) < amt) throw httpError(400, 'Saldo asal tidak cukup')

  const insert = { user_id: userId, kind: 'transfer', from_account_id: fromId, to_account_id: toId, amount: amt }
  if (clientId) insert.id = clientId

  const { data, error } = await supabaseAdmin
    .from('account_movements')
    .insert(insert)
    .select()
    .single()
  if (error) throw error

  await adjustBalances(userId, { accountId: fromId, accountDelta: -amt })
  await adjustBalances(userId, { accountId: toId, accountDelta: amt })

  return {
    id: data.id,
    kind: 'transfer',
    fromId,
    toId,
    amount: amt,
    createdAt: new Date(data.created_at).getTime(),
  }
}

export async function topUp(userId, { accountId, amount, clientId }) {
  const amt = Math.abs(Number(amount) || 0)
  if (amt <= 0) throw httpError(400, 'Nominal tidak valid')

  const insert = { user_id: userId, kind: 'topup', account_id: accountId, amount: amt }
  if (clientId) insert.id = clientId

  const { data, error } = await supabaseAdmin
    .from('account_movements')
    .insert(insert)
    .select()
    .single()
  if (error) throw error

  await adjustBalances(userId, { accountId, accountDelta: amt })

  return {
    id: data.id,
    kind: 'topup',
    accountId,
    amount: amt,
    createdAt: new Date(data.created_at).getTime(),
  }
}

export async function deleteBook(userId, bookId) {
  const { data: book } = await supabaseAdmin.from('books').select('*').eq('id', bookId).eq('user_id', userId).maybeSingle()
  if (!book) throw httpError(404, 'Buku tidak ditemukan')
  if (book.locked) throw httpError(400, 'Buku default tidak dapat dihapus')

  const { data: remaining } = await supabaseAdmin.from('books').select('id').eq('user_id', userId).neq('id', bookId)
  if (!remaining || remaining.length === 0) throw httpError(400, 'Tidak bisa menghapus buku terakhir')

  const { data: profile } = await supabaseAdmin.from('profiles').select('default_book_id').eq('id', userId).single()
  const wasDefault = profile?.default_book_id === bookId
  if (wasDefault && remaining.length > 0) {
    const heirId = remaining[0].id
    await supabaseAdmin.from('profiles').update({ default_book_id: heirId }).eq('id', userId)
  }

  const heirId = wasDefault ? remaining[0].id : null
  if (heirId && num(book.balance) !== 0) {
    await adjustBalances(userId, { bookId: heirId, bookDelta: num(book.balance) })
  }

  const { error } = await supabaseAdmin.from('books').delete().eq('id', bookId)
  if (error) throw error
}

export async function saveBudgetPlan(userId, { categoryId, name, icon, amount, period, startDate, note }) {
  const { data, error } = await supabaseAdmin
    .from('budget_plans')
    .upsert({
      user_id: userId,
      category_id: categoryId,
      name: (name || '').trim(),
      icon: icon || '📊',
      amount: Math.max(0, Number(amount) || 0),
      period: period || 'monthly',
      start_date: startDate || new Date().toISOString().slice(0, 10),
      note: (note || '').trim(),
    })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    categoryId: data.category_id,
    name: data.name,
    icon: data.icon,
    amount: num(data.amount),
    period: data.period,
    startDate: data.start_date,
    note: data.note || '',
  }
}

export async function deleteBudgetPlan(userId, id) {
  const { error } = await supabaseAdmin.from('budget_plans').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function addFeedback(userId, { text }) {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .insert({ user_id: userId, body: (text || '').trim() })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, text: data.body, createdAt: new Date(data.created_at).getTime() }
}

export async function addRating(userId, { stars }) {
  const { data, error } = await supabaseAdmin
    .from('ratings')
    .insert({ user_id: userId, stars: Math.min(5, Math.max(1, Math.round(Number(stars) || 0))) })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, stars: data.stars, createdAt: new Date(data.created_at).getTime() }
}

export async function updateSettings(userId, patch) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single()
  if (!profile) throw httpError(404, 'Profil tidak ditemukan')

  const merged = { ...(profile.settings || {}), ...patch }
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ settings: merged })
    .eq('id', userId)
  if (error) throw error
}

export async function addCategory(userId, { name, icon, kind }) {
  const n = (name || '').trim()
  if (!n) throw httpError(400, 'Nama kategori wajib')
  const k = kind === 'income' ? 'income' : 'expense'

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ user_id: userId, name: n, icon: icon || '📁', kind: k })
    .select()
    .single()
  if (error) throw error
  return mapCategory(data)
}

export async function deleteCategory(userId, id) {
  const { data: cat } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()
  if (!cat) throw httpError(404, 'Kategori tidak ditemukan')
  // Hanya bisa hapus kategori milik sendiri (user_id not null)
  if (!cat.user_id || cat.user_id !== userId) throw httpError(403, 'Tidak bisa menghapus kategori global')

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function resetUserData(userId) {
  const tables = ['transactions', 'account_movements', 'budget_plans', 'books', 'accounts']
  for (const table of tables) {
    await supabaseAdmin.from(table).delete().eq('user_id', userId)
  }
  await supabaseAdmin.from('profiles').update({
    default_book_id: null,
    premium: false,
    settings: { notifications: true, compactNumbers: false },
  }).eq('id', userId)
}
