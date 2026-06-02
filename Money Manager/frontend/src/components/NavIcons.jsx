export function NavIconBooks({ active }) {
  const c = active ? '#1e88e5' : '#424242'
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6a1 1 0 011-1h6v14H5a1 1 0 01-1-1V6zm10-1h6a1 1 0 011v12a1 1 0 01-1 1h-6V5z"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? 'rgba(30,136,229,0.08)' : 'none'}
      />
    </svg>
  )
}

export function NavIconWallet({ active }) {
  const c = active ? '#1e88e5' : '#424242'
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={c} strokeWidth="2" />
      <path d="M3 10h18" stroke={c} strokeWidth="2" />
      <circle cx="16" cy="13" r="1.5" fill={c} />
    </svg>
  )
}

export function NavIconCharts({ active }) {
  const c = active ? '#1e88e5' : '#424242'
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5M4 19h16" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16V11M12 16V8M16 16v-5" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function NavIconMore({ active }) {
  const c = active ? '#1e88e5' : '#424242'
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="2" fill={c} />
      <circle cx="12" cy="12" r="2" fill={c} />
      <circle cx="18" cy="12" r="2" fill={c} />
    </svg>
  )
}
