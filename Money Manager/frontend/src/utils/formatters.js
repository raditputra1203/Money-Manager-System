/** Currency & amount formatting shared across dashboard screens */

export function fmtRp(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtRpBooksDisplay(n) {
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(n))
  return `Rp ${abs}`
}

export function fmtWalletBalanceStr(n) {
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(n))
  if (n < 0) return `-Rp ${abs}`
  return `Rp ${abs}`
}

export function fmtTxAmountBooks(amount, type) {
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)
  if (type === 'income') return `Rp +${abs}`
  return `Rp -${abs}`
}

export function fmtChartsCurrencyId(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtChartsBarAmount(n) {
  if (n === 0) return 'Rp 0'
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}k`
  return `Rp ${n}`
}

export function fmtChartsCompactSigned(n) {
  if (n === 0) return 'Rp 0'
  const abs = Math.abs(n)
  let core
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    core = `${m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')}M`
  } else if (abs >= 1_000) {
    core = `${Math.round(abs / 1_000)}k`
  } else {
    core = String(abs)
  }
  return n > 0 ? `+Rp ${core}` : `-Rp ${core}`
}

export function fmtPremiumPerMonthIdr(yearlyTotal) {
  const per = yearlyTotal / 12
  const s = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(per)
  return `${s}/Month`
}

export function walletUpdatedLabel() {
  const t = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())
  return `Today, ${t}`
}

export function relativeDayLabelEn(ts) {
  const a = new Date()
  const b = new Date(ts)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  const diff = Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}
