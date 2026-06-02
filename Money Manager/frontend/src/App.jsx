import { useCallback, useState } from 'react'
import AppDashboard from './pages/AppDashboard.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { FinanceProvider } from './financeStore.jsx'
import { clearSession, readSession, saveSession } from './session.js'

function App() {
  const [user, setUser] = useState(() => readSession())

  const handleAuthenticated = useCallback((sessionUser) => {
    saveSession(sessionUser)
    setUser(sessionUser)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const handleProfileChange = useCallback((name) => {
    setUser((u) => {
      if (!u) return u
      const next = { ...u, name }
      saveSession(next)
      return next
    })
  }, [])

  if (!user) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <FinanceProvider userEmail={user.email}>
      <AppDashboard user={user} onLogout={handleLogout} onProfileChange={handleProfileChange} />
    </FinanceProvider>
  )
}

export default App
