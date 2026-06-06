import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppUIProvider, useAppUI } from './contexts/AppUIContext'
import PillButton from './components/ui/PillButton'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BeansPage from './pages/BeansPage'
import PastPage from './pages/PastPage'
import PastBeanPage from './pages/PastBeanPage'
import SettingsPage from './pages/SettingsPage'
import InvitePage from './pages/InvitePage'
import beanIcon from './assets/bean_icon_outline.svg'
import settingIcon from './assets/setting.svg'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/beans" replace />
  return children
}

// Floating bottom action bar
function FloatingActionBar() {
  const navigate = useNavigate()
  const { hideLogBrew } = useAppUI()

  return (
    <div style={styles.floatingBar}>
      {/* ADD BEANS dark pill */}
      <PillButton
        variant="dark"
        onClick={() => navigate('/beans', { state: { openAdd: true } })}
        aria-label="Add beans"
        style={styles.addBeansPill}
      >
        <span style={styles.addBeansText}>ADD BEANS</span>
      </PillButton>

      {/* LOG BREW pill — hidden when jar is empty */}
      {!hideLogBrew && (
        <PillButton
          variant="glass"
          onClick={() => navigate('/beans', { state: { openLogBrew: true } })}
          style={styles.logBrewPill}
          aria-label="Log brew"
        >
          <img src={beanIcon} alt="" aria-hidden="true" width={19} height={24} style={{ flexShrink: 0 }} />
          <span style={styles.centerPillText}>LOG BREW</span>
        </PillButton>
      )}

      {/* Settings pill */}
      <PillButton
        variant="glass"
        onClick={() => navigate('/settings')}
        aria-label="Settings"
        style={styles.iconPill}
      >
        <img src={settingIcon} alt="" aria-hidden="true" width={20} height={20} />
      </PillButton>
    </div>
  )
}

function AppLayout({ children }) {
  const location = useLocation()
  const showFloatingBar = location.pathname !== '/settings'

  return (
    <AppUIProvider>
      <div style={styles.appContainer}>
        <div style={{ ...styles.content, paddingBottom: showFloatingBar ? '112px' : 0 }}>
          {children}
        </div>
        {showFloatingBar && <FloatingActionBar />}
      </div>
    </AppUIProvider>
  )
}

function LoadingScreen() {
  return (
    <div style={styles.loading}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-taupe)', fontSize: 'var(--text-heading-sm)' }}>
        BrewNote
      </span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/beans"    element={<ProtectedRoute><AppLayout><BeansPage /></AppLayout></ProtectedRoute>} />
          <Route path="/past"     element={<ProtectedRoute><AppLayout><PastPage /></AppLayout></ProtectedRoute>} />
          <Route path="/past/:beanId" element={<ProtectedRoute><PastBeanPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/"         element={<Navigate to="/beans" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

const styles = {
  appContainer: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), var(--color-bg)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },

  // Floating action bar
  floatingBar: {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    zIndex: 50,
  },
  addBeansPill: {
    height: '48px',
    padding: '0 24px',
    flexShrink: 0,
  },
  addBeansText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    letterSpacing: '0.08em',
  },
  logBrewPill: {
    height: '48px',
    padding: '0 20px',
    gap: '8px',
    flexShrink: 0,
  },
  iconPill: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
  },
  centerPillText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    color: 'var(--color-accent)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },

  loading: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), var(--color-bg)',
  },
}
