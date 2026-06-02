export const CAT_CHART_COLORS = {
  c1: '#4A86E8',
  c2: '#A480F2',
  c3: '#F4B475',
  c4: '#F7D74C',
  c5: '#E66776',
  c6: '#E886C0',
}

const CHART_COLOR_FALLBACK = ['#78909c', '#5c6bc0', '#26a69a', '#ab47bc', '#00acc1', '#8d6e63']

export function chartColorForCategory(cat, cid, index) {
  if (CAT_CHART_COLORS[cid]) return CAT_CHART_COLORS[cid]
  const n = (cat?.name || '').toLowerCase()
  if (n.includes('food') || n.includes('dining')) return CAT_CHART_COLORS.c1
  if (n.includes('transport')) return CAT_CHART_COLORS.c2
  if (n.includes('shop')) return CAT_CHART_COLORS.c3
  if (n.includes('entertain')) return CAT_CHART_COLORS.c4
  if (n.includes('bill') || n.includes('utilit')) return CAT_CHART_COLORS.c5
  if (n.includes('health')) return CAT_CHART_COLORS.c6
  return CHART_COLOR_FALLBACK[index % CHART_COLOR_FALLBACK.length]
}
