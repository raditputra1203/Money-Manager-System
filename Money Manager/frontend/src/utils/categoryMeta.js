export function categoryIconTone(categoryId) {
  const m = {
    c1: 'orange',
    c2: 'blue',
    c3: 'purple',
    c4: 'magenta',
    c5: 'teal',
    c6: 'pink',
    i1: 'teal',
    i2: 'orange',
    i3: 'purple',
    i4: 'blue',
  }
  return m[categoryId] || 'neutral'
}

const ACCOUNT_META = {
  cash: { tone: 'green', sub: 'On hand', icon: 'wallet' },
  debit: { tone: 'blue', sub: 'Bank account', icon: 'bank' },
  credit: { tone: 'purple', sub: 'Credit line', icon: 'card' },
  savings: { tone: 'pink', sub: 'Savings', icon: 'piggy' },
  debt: { tone: 'purple', sub: 'Credit', icon: 'card' },
  default: { tone: 'blue', sub: 'Account', icon: 'bank' },
}

export function walletAccountRowMeta(a) {
  const source = a.accountSource || ''
  const kind = a.kind || ''

  if (source === 'cash') return { ...ACCOUNT_META.cash }
  if (source === 'debit' && kind === 'savings') return { ...ACCOUNT_META.savings }
  if (source === 'credit' || kind === 'debt') return { ...ACCOUNT_META.credit, due: 'Due soon' }
  if (source === 'debit') return { ...ACCOUNT_META.debit }
  if (kind === 'savings') return { ...ACCOUNT_META.savings, sub: 'High-yield savings' }
  if (kind === 'debt') return { ...ACCOUNT_META.debt, due: 'Due soon' }
  if (kind === 'asset') return { ...ACCOUNT_META.debit }

  return { ...ACCOUNT_META.default }
}
