import { useCallback, useState } from 'react'
import BooksScreen from './dashboard/BooksScreen.jsx'
import ChartsScreen from './dashboard/ChartsScreen.jsx'
import MoreScreen from './dashboard/MoreScreen.jsx'
import WalletScreen from './dashboard/WalletScreen.jsx'
import { NavIconBooks, NavIconCharts, NavIconMore, NavIconWallet } from '../components/NavIcons.jsx'
import './AppDashboard.css'

const TABS = [
  { id: 'books', label: 'Books', Icon: NavIconBooks },
  { id: 'wallet', label: 'Wallet', Icon: NavIconWallet },
  { id: 'charts', label: 'Charts', Icon: NavIconCharts },
  { id: 'more', label: 'More', Icon: NavIconMore },
]

export default function AppDashboard({ user, onLogout, onProfileChange }) {
  const [tab, setTab] = useState('books')
  const [toast, setToast] = useState('')

  const onToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  return (
    <div className="app-shell">
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}

      <nav className="app-nav" aria-label="Utama">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            <Icon active={tab === id} />
            {label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'books' && <BooksScreen onToast={onToast} />}
        {tab === 'wallet' && <WalletScreen onToast={onToast} />}
        {tab === 'charts' && <ChartsScreen />}
        {tab === 'more' && (
          <MoreScreen
            user={user}
            onLogout={onLogout}
            onProfileChange={onProfileChange}
            onToast={onToast}
            setTab={setTab}
          />
        )}
      </main>
    </div>
  )
}
