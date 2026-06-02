export default function ChartsDonutWithLabels({ segments, expenseTotal, ariaLabel }) {
  const vbPadX = 108
  const vbPadY = 44
  const inner = 280
  const vbW = inner + vbPadX * 2
  const vbH = inner + vbPadY * 2
  const cx = vbPadX + inner / 2
  const cy = vbPadY + inner / 2
  const viewBoxStr = `0 0 ${vbW} ${vbH}`
  const rOut = 80
  const rIn = 48
  const rad = (deg) => ((deg - 90) * Math.PI) / 180
  const xy = (r, deg) => ({
    x: cx + r * Math.cos(rad(deg)),
    y: cy + r * Math.sin(rad(deg)),
  })

  function wedgePath(a0, a1) {
    const span = a1 - a0
    if (span >= 359.99) {
      const xoE = cx + rOut
      const xoW = cx - rOut
      const xiE = cx + rIn
      const xiW = cx - rIn
      return `M ${xoE} ${cy} A ${rOut} ${rOut} 0 1 1 ${xoW} ${cy} A ${rOut} ${rOut} 0 1 1 ${xoE} ${cy} M ${xiE} ${cy} A ${rIn} ${rIn} 0 1 0 ${xiW} ${cy} A ${rIn} ${rIn} 0 1 0 ${xiE} ${cy} Z`
    }
    const large = span > 180 ? 1 : 0
    const p1 = xy(rOut, a0)
    const p2 = xy(rOut, a1)
    const p3 = xy(rIn, a1)
    const p4 = xy(rIn, a0)
    return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y} Z`
  }

  if (!segments.length || expenseTotal <= 0) {
    return (
      <div className="charts-donut-svg-wrap charts-donut-svg-wrap--empty" role="img" aria-label={ariaLabel}>
        <svg viewBox={viewBoxStr} className="charts-donut-svg" aria-hidden>
          <circle cx={cx} cy={cy} r={(rOut + rIn) / 2} fill="none" stroke="#eceff1" strokeWidth={rOut - rIn} />
        </svg>
      </div>
    )
  }

  const pies = []
  let cum = 0
  for (const seg of segments) {
    const slice = (seg.val / expenseTotal) * 360
    const start = cum
    const end = cum + slice
    const mid = start + slice / 2
    cum = end
    pies.push({ ...seg, start, end, mid })
  }

  return (
    <div className="charts-donut-svg-wrap" role="img" aria-label={ariaLabel}>
      <svg viewBox={viewBoxStr} className="charts-donut-svg" aria-hidden>
        {pies.map((p) => {
          const span = p.end - p.start
          const isFullRing = span >= 359.99
          return (
            <path
              key={p.cid}
              d={wedgePath(p.start, p.end)}
              fill={p.color}
              fillRule={isFullRing ? 'evenodd' : 'nonzero'}
              stroke={isFullRing ? 'none' : '#fff'}
              strokeWidth={isFullRing ? 0 : 1.5}
            />
          )
        })}
        {pies.map((p) => {
          const cos = Math.cos(rad(p.mid))
          const sin = Math.sin(rad(p.mid))
          const isRight = cos >= 0
          const edge = xy(rOut + 0.5, p.mid)
          const bend = 26
          const x2 = cx + cos * (rOut + bend)
          const y2 = cy + sin * (rOut + bend)
          const x3 = cx + cos * (rOut + bend + 16)
          const y3 = cy + sin * (rOut + bend + 16)
          const tx = x3 + (isRight ? 5 : -5)
          const nameShort = p.name.length > 24 ? `${p.name.slice(0, 22)}…` : p.name
          return (
            <g key={`lbl-${p.cid}`}>
              <polyline
                points={`${edge.x},${edge.y} ${x2},${y2} ${x3},${y3}`}
                fill="none"
                stroke="#b0bec5"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x={tx}
                y={y3}
                textAnchor={isRight ? 'start' : 'end'}
                dominantBaseline="middle"
                className="charts-donut-svg__label"
              >
                <tspan x={tx} dy="-0.55em" className="charts-donut-svg__name">
                  {nameShort}
                </tspan>
                <tspan x={tx} dy="1.1em" className="charts-donut-svg__pct">
                  {p.pctStr}%
                </tspan>
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
