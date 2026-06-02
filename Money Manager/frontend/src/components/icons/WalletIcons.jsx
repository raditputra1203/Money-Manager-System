export function WalletHeroTrendIcon({ variant }) {
  const isUp = variant === 'up'
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      {isUp ? (
        <path fill="currentColor" d="M4 14l4-4 4 4 8-8v6H4v-4zm0 6h16v2H4v-2z" />
      ) : (
        <path fill="currentColor" d="M4 10h16v2H4v-2zm0-4l8 8 4-4 4 4V4H4v2zm0 12h16v2H4v-2z" />
      )}
    </svg>
  )
}

export function WalletAcctGlyph({ icon }) {
  if (icon === 'wallet')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19 7h-1V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2zm0 8h-4a2 2 0 000 4h4V9H5v10zm-5-3a1 1 0 112 0 1 1 0 01-2 0z" />
      </svg>
    )
  if (icon === 'bank')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4 10h16v2H4v-2zm2-4h12l6 4v2H2V10l4-4zm0 8h3v6H6v-6zm5 0h2v6h-2v-6zm5 0h3v6h-3v-6zM2 20h20v2H2v-2z" />
      </svg>
    )
  if (icon === 'card')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
      </svg>
    )
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8 6 6 9 6 12a6 6 0 1012 0c0-3-2-6-6-10zm0 14a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  )
}

export function BookWalletIcon() {
  return (
    <svg className="book-wallet-svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M19 7h-1V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2zm0 10H5V8h14v1h-4a2 2 0 000 4h4v4zm-6-3a1 1 0 112 0 1 1 0 01-2 0z"
      />
    </svg>
  )
}

export function MoreAcctGlyph({ source }) {
  if (source === 'cash')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
        <path fill="#2e7d32" d="M5 8h14v3H5V8zm0 5h14v3H5v-3zm1-7l-1 1v12l1 1h12l1-1V7l-1-1H6z" opacity="0.35" />
        <path fill="#43a047" d="M4 7h16v10H4V7zm1 1v8h14V8H5zm2 2h10v1H7V9zm0 3h6v1H7v-1z" />
        <path fill="#66bb6a" d="M4 11h16v8H4v-8zm1 1v6h14v-6H5zm2 1h10v1H7v-1zm0 3h7v1H7v-1z" />
      </svg>
    )
  if (source === 'credit')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          fill="currentColor"
          d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
        />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V10h16v8zm0-10H4V6h16v2z"
      />
    </svg>
  )
}
