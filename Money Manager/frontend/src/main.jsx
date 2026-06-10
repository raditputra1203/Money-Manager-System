import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Restore dark mode preference
try {
  const theme = localStorage.getItem('mm_dark_mode')
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
