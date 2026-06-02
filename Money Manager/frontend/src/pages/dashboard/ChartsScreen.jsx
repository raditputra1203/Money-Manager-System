import { useMemo, useState } from 'react'
import { filterLedger, isCurrentMonth, isCurrentYear, monthKey } from '../../financeHelpers.js'
import { useCategoryMap, useFinance } from '../../financeStore.jsx'
import ChartsDonutWithLabels from '../../components/charts/ChartsDonutWithLabels.jsx'
import { chartColorForCategory } from './chartColors.js'
import { fmtChartsBarAmount, fmtChartsCompactSigned, fmtChartsCurrencyId } from '../../utils/formatters.js'

export default function ChartsScreen() {
  const { state } = useFinance()
  const catMap = useCategoryMap()
  const [period, setPeriod] = useState('month')

  const filtered = useMemo(() => {
    return filterLedger(state.transactions).filter((t) =>
      period === 'month' ? isCurrentMonth(t.createdAt) : isCurrentYear(t.createdAt),
    )
  }, [state.transactions, period])

  const expenseTotal = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const incomeTotal = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  const byCategory = useMemo(() => {
    const m = {}
    for (const t of filtered) {
      if (t.type !== 'expense') continue
      m[t.categoryId] = (m[t.categoryId] || 0) + t.amount
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const donutSegments = useMemo(() => {
    return byCategory.map(([cid, val], i) => {
      const cat = catMap[cid]
      const pct = expenseTotal > 0 ? (val / expenseTotal) * 100 : 0
      const pctStr = (Math.round(pct * 10) / 10).toFixed(1)
      return {
        cid,
        val,
        name: cat?.name || 'Other',
        icon: cat?.icon || '📁',
        pctStr,
        color: chartColorForCategory(cat, cid, i),
      }
    })
  }, [byCategory, expenseTotal, catMap])

  const donutAriaLabel = useMemo(() => {
    if (expenseTotal <= 0) return 'No expenses in this period'
    return byCategory
      .map(([cid, val]) => {
        const pct = expenseTotal > 0 ? ((val / expenseTotal) * 100).toFixed(1) : '0'
        return `${catMap[cid]?.name || cid} ${pct}%`
      })
      .join('; ')
  }, [byCategory, expenseTotal, catMap])

  const monthLabel = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  const trendMonths = useMemo(() => {
    const out = []
    const d = new Date()
    for (let i = 0; i < 6; i++) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1)
      const mk = monthKey(x.getTime())
      const ledger = filterLedger(state.transactions)
      const inc = ledger.filter((t) => monthKey(t.createdAt) === mk && t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const exp = ledger.filter((t) => monthKey(t.createdAt) === mk && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      out.push({
        key: mk,
        label: x.toLocaleString('id-ID', { month: 'short' }),
        inc,
        exp,
        net: inc - exp,
      })
    }
    return out
  }, [state.transactions])

  const maxTrend = Math.max(1, ...trendMonths.flatMap((m) => [m.inc, m.exp]))

  return (
    <div className="app-scroll app-scroll--charts">
      <header className="charts-head">
        <h1 className="charts-head__title">Charts</h1>
        <p className="charts-head__sub">Expense analytics</p>
      </header>

      <div className="charts-toggle" role="group" aria-label="Period">
        <button type="button" aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>
          This Month
        </button>
        <button type="button" aria-pressed={period === 'year'} onClick={() => setPeriod('year')}>
          This Years
        </button>
      </div>

      <div className="charts-exp-hero">
        <p className="charts-exp-hero__label">Total Expenses</p>
        <p className="charts-exp-hero__amt">{fmtChartsCurrencyId(expenseTotal)}</p>
        <p className="charts-exp-hero__when">
          Income {fmtChartsCurrencyId(incomeTotal)} · {monthLabel}
        </p>
      </div>

      <section className="charts-card charts-card--category">
        <h2 className="charts-card__title">Expenses by Category</h2>
        <div className="charts-donut-block">
          <ChartsDonutWithLabels segments={donutSegments} expenseTotal={expenseTotal} ariaLabel={donutAriaLabel} />
          <div className="charts-cat-list">
            {byCategory.length === 0 ? (
              <p className="charts-cat-empty">Belum ada pengeluaran di periode ini</p>
            ) : (
              donutSegments.map((seg) => {
                const pct = expenseTotal > 0 ? (seg.val / expenseTotal) * 100 : 0
                return (
                  <div key={seg.cid} className="charts-cat-row">
                    <div className="charts-cat-row__icon" style={{ background: seg.color }}>
                      <span aria-hidden>{seg.icon}</span>
                    </div>
                    <div className="charts-cat-row__mid">
                      <span className="charts-cat-row__name">{seg.name}</span>
                      <div className="charts-cat-row__bar">
                        <span style={{ width: `${pct}%`, background: seg.color }} />
                      </div>
                    </div>
                    <div className="charts-cat-row__right">
                      <span className="charts-cat-row__pct">{seg.pctStr}%</span>
                      <span className="charts-cat-row__money">{fmtChartsBarAmount(seg.val)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="charts-card charts-card--trend">
        <h2 className="charts-card__title">Monthly Trend</h2>
        <div className="charts-trend-list">
          {trendMonths.map((m) => (
            <div key={m.key} className="charts-trend-item">
              <div className="charts-trend-item__head">
                <strong className="charts-trend-item__month">{m.label}</strong>
                <span className={`charts-trend-item__net ${m.net >= 0 ? 'charts-trend-item__net--pos' : 'charts-trend-item__net--neg'}`}>
                  {fmtChartsCompactSigned(m.net)}
                </span>
              </div>
              <div className="charts-trend-item__bars">
                <div className="charts-trend-line">
                  <div className="charts-trend-line__head">
                    <span>Income</span>
                    <span>{fmtChartsBarAmount(m.inc)}</span>
                  </div>
                  <div className="charts-trend-track">
                    <span className="charts-trend-track__fill charts-trend-track__fill--in" style={{ width: `${(m.inc / maxTrend) * 100}%` }} />
                  </div>
                </div>
                <div className="charts-trend-line">
                  <div className="charts-trend-line__head">
                    <span>Expense</span>
                    <span>{fmtChartsBarAmount(m.exp)}</span>
                  </div>
                  <div className="charts-trend-track">
                    <span className="charts-trend-track__fill charts-trend-track__fill--ex" style={{ width: `${(m.exp / maxTrend) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
