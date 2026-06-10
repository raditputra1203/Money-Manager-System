export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'c1', name: 'Food & Dining', icon: '🍽️', kind: 'expense' },
  { id: 'c2', name: 'Transportation', icon: '🚗', kind: 'expense' },
  { id: 'c3', name: 'Shopping', icon: '🛍️', kind: 'expense' },
  { id: 'c4', name: 'Entertainment', icon: '🍿', kind: 'expense' },
  { id: 'c5', name: 'Bills & Utilities', icon: '📄', kind: 'expense' },
  { id: 'c6', name: 'Health', icon: '💊', kind: 'expense' },
]

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'i1', name: 'Salary', icon: '💼', kind: 'income' },
  { id: 'i2', name: 'Bonus', icon: '🎁', kind: 'income' },
  { id: 'i3', name: 'Investment', icon: '📈', kind: 'income' },
  { id: 'i4', name: 'Part-time', icon: '💻', kind: 'income' },
]

export const DEFAULT_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]

export const PROTECTED_CATEGORY_IDS = new Set(DEFAULT_CATEGORIES.map((c) => c.id))

/** Merge persisted categories with defaults (adds income defaults for older saves). */
export function mergeAndNormalizeCategories(persisted) {
  const seen = new Set()
  const out = []

  const push = (c) => {
    if (!c?.id || seen.has(c.id)) return
    seen.add(c.id)
    out.push({ ...c })
  }

  if (Array.isArray(persisted) && persisted.length) {
    for (const c of persisted) {
      const d = DEFAULT_CATEGORIES.find((x) => x.id === c.id)
      if (d) {
        push({
          ...d,
          name: c.name ?? d.name,
          icon: c.icon ?? d.icon,
        })
      } else {
        push({
          id: c.id,
          name: c.name || 'Category',
          icon: c.icon || '📁',
          kind: c.kind === 'income' ? 'income' : 'expense',
        })
      }
    }
  }

  for (const d of DEFAULT_CATEGORIES) {
    if (!seen.has(d.id)) push({ ...d })
  }

  return out
}

export function categoryMatchesType(cat, type) {
  const k = cat.kind === 'income' ? 'income' : 'expense'
  return k === type
}

export function filterLedger(transactions) {
  return transactions.filter((t) => t.type === 'income' || t.type === 'expense')
}

export function monthKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function isCurrentMonth(ts) {
  const d = new Date(ts)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

export function isCurrentYear(ts) {
  return new Date(ts).getFullYear() === new Date().getFullYear()
}
