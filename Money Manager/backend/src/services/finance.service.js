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
    subtitle: row.subtitle || '',
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
    .maybeSingle()
  if (pErr) throw pErr

  // Auto-create profile if it doesn't exist (e.g. user registered before backend was connected)
  if (!profile) {
    const { error: createErr } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      display_name: '',
      settings: { notifications: true, compactNumbers: false },
    })
    if (createErr) throw createErr
    return {
      defaultBookId: null,
      books: [],
      accounts: [],
      transactions: [],
      categories: [],
      settings: { notifications: true, compactNumbers: false },
      feedbacks: [],
    }
  }

  const [booksRes, accountsRes, categoriesRes, txRes, movRes, fbRes] =
    await Promise.all([
      supabaseAdmin.from('books').select('*').eq('user_id', userId).order('created_at'),
      supabaseAdmin.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabaseAdmin.from('categories').select('*').or(`user_id.is.null,user_id.eq.${userId}`),
      supabaseAdmin.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('account_movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseAdmin.from('feedbacks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

  for (const res of [booksRes, accountsRes, categoriesRes, txRes, movRes, fbRes]) {
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

  return {
    defaultBookId: profile.default_book_id,
    books: (booksRes.data || []).map(mapBook),
    accounts: (accountsRes.data || []).map(mapAccount),
    transactions,
    categories,
    budgets,
    settings: profile.settings || { notifications: true, compactNumbers: false },
    feedbacks: (fbRes.data || []).map((f) => ({ id: f.id, text: f.body, createdAt: new Date(f.created_at).getTime() })),
  }
}

export async function addBook(userId, name, clientId) {
  const n = (name || '').trim()
  if (!n) throw httpError(400, 'Book name is required')

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

  // Set this book as default for the user
  await supabaseAdmin
    .from('profiles')
    .update({ default_book_id: data.id })
    .eq('id', userId)

  return mapBook(data)
}

export async function updateBook(userId, bookId, { name, subtitle }) {
  const row = {}
  if (name !== undefined) row.name = (name || '').trim()
  if (subtitle !== undefined) row.subtitle = (subtitle || '').trim()
  const { error } = await supabaseAdmin.from('books').update(row).eq('id', bookId).eq('user_id', userId)
  if (error) throw error
}

export async function setDefaultBook(userId, bookId) {
  const { error } = await supabaseAdmin.from('profiles').update({ default_book_id: bookId }).eq('id', userId)
  if (error) throw error
}

export async function addAccount(userId, { name, kind, accountSource, subtitle, clientId }) {
  const n = (name || '').trim()
  if (!n) throw httpError(400, 'Account name is required')

  const insert = {
    user_id: userId,
    name: n,
    balance: 0,
    kind: ['asset', 'debt', 'savings'].includes(kind) ? kind : 'asset',
    status: 'active',
    account_source: accountSource || 'debit',
    subtitle: (subtitle || '').trim(),
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
  if (patch.subtitle !== undefined) row.subtitle = patch.subtitle
  const { error } = await supabaseAdmin.from('accounts').update(row).eq('id', accountId).eq('user_id', userId)
  if (error) throw error
}

async function adjustBalances(userId, { bookId, accountId, bookDelta, accountDelta }) {
  if (accountId && accountDelta) {
    const { data: acc } = await supabaseAdmin.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
    if (!acc) throw httpError(404, 'Account not found')
    const next = num(acc.balance) + accountDelta
    await supabaseAdmin.from('accounts').update({ balance: next }).eq('id', accountId)
  }
  if (bookId && bookDelta) {
    const { data: book } = await supabaseAdmin.from('books').select('balance').eq('id', bookId).eq('user_id', userId).single()
    if (!book) throw httpError(404, 'Book not found')
    const next = num(book.balance) + bookDelta
    await supabaseAdmin.from('books').update({ balance: next }).eq('id', bookId)
  }
}

export async function addLedgerTransaction(userId, { bookId, accountId, entryType, amount, categoryId, note, clientId, createdAt }) {
  const amt = Math.abs(Number(amount) || 0)
  if (amt <= 0) throw httpError(400, 'Invalid amount')
  if (!['income', 'expense'].includes(entryType)) throw httpError(400, 'Invalid transaction type')

  const { data: acc } = await supabaseAdmin.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
  if (!acc) throw httpError(404, 'Account not found')
  if (entryType === 'expense' && num(acc.balance) < amt) throw httpError(400, 'Insufficient account balance')

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
  if (createdAt) {
    insert.created_at = new Date(createdAt).toISOString()
  }

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

export async function updateTransaction(userId, transactionId, { bookId, accountId, entryType, amount, categoryId, note, createdAt }) {
  const amt = Math.abs(Number(amount) || 0)
  if (amt <= 0) throw httpError(400, 'Invalid amount')
  if (!['income', 'expense'].includes(entryType)) throw httpError(400, 'Invalid transaction type')

  const { data: tx } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!tx) throw httpError(404, 'Transaction not found')

  const oldEffect = tx.type === 'income' ? num(tx.amount) : -num(tx.amount)
  const newEffect = entryType === 'income' ? amt : -amt

  // First: reverse the OLD effect from the OLD book/account
  const revOld = -oldEffect
  if (revOld !== 0) {
    await adjustBalances(userId, { bookId: tx.book_id, accountId: tx.account_id, bookDelta: revOld, accountDelta: revOld })
  }

  // Then: apply the NEW effect to the NEW book/account
  if (newEffect !== 0) {
    await adjustBalances(userId, { bookId, accountId, bookDelta: newEffect, accountDelta: newEffect })
  }

  const updateFields = {
    book_id: bookId,
    account_id: accountId,
    type: entryType,
    amount: amt,
    category_id: categoryId,
    note: (note || '').trim(),
  }
  if (createdAt) {
    updateFields.created_at = new Date(createdAt).toISOString()
  }

  const { error } = await supabaseAdmin
    .from('transactions')
    .update(updateFields)
    .eq('id', transactionId)
  if (error) throw error

  return {
    id: transactionId,
    bookId,
    accountId,
    type: entryType,
    amount: amt,
    categoryId,
    note: (note || '').trim(),
    createdAt: new Date(tx.created_at).getTime(),
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
  if (!mov) throw httpError(404, 'Transaction not found')

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
  if (amt <= 0) throw httpError(400, 'Invalid amount')
  if (fromId === toId) throw httpError(400, 'Choose different accounts')

  const { data: from } = await supabaseAdmin.from('accounts').select('balance').eq('id', fromId).eq('user_id', userId).single()
  if (!from || num(from.balance) < amt) throw httpError(400, 'Insufficient source balance')

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
  if (amt <= 0) throw httpError(400, 'Invalid amount')

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
  if (!book) throw httpError(404, 'Book not found')
  if (book.locked) throw httpError(400, 'Default book cannot be deleted')

  const { data: remaining } = await supabaseAdmin.from('books').select('id').eq('user_id', userId).neq('id', bookId)
  if (!remaining || remaining.length === 0) throw httpError(400, 'Cannot delete the last book')

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

export async function addFeedback(userId, { text }) {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .insert({ user_id: userId, body: (text || '').trim() })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, text: data.body, createdAt: new Date(data.created_at).getTime() }
}

export async function updateSettings(userId, patch) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single()
  if (!profile) throw httpError(404, 'Profile not found')

  const merged = { ...(profile.settings || {}), ...patch }
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ settings: merged })
    .eq('id', userId)
  if (error) throw error
}

export async function resetUserData(userId) {
  const tables = ['transactions', 'account_movements', 'books', 'accounts']
  for (const table of tables) {
    await supabaseAdmin.from(table).delete().eq('user_id', userId)
  }
  await supabaseAdmin.from('profiles').update({
    default_book_id: null,
    settings: { notifications: true, compactNumbers: false },
  }).eq('id', userId)
}
