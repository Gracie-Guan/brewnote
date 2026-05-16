import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import PillButton from './components/ui/PillButton'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BeansPage from './pages/BeansPage'
import PastPage from './pages/PastPage'
import SettingsPage from './pages/SettingsPage'
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

// Top text tabs — Beans / Past
function TopTabNav() {
  const location = useLocation()
  const tabs = [
    { path: '/beans', label: 'Beans' },
    { path: '/past',  label: 'Past' },
  ]
  return (
    <div style={styles.topNav}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <div key={tab.path} style={styles.topTabWrapper}>
            <Link
              to={tab.path}
              style={{ ...styles.topTab, color: active ? 'var(--color-dark)' : 'var(--color-taupe)', fontWeight: active ? 600 : 400 }}
            >
              {tab.label}
            </Link>
            {active && <span style={styles.topTabDot} />}
          </div>
        )
      })}
    </div>
  )
}

// Floating bottom action bar
function FloatingActionBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const onBeans = location.pathname === '/beans'

  return (
    <div style={styles.floatingBar}>
      {/* + pill */}
      <PillButton
        variant="glass"
        onClick={() => navigate('/beans', { state: { openAdd: true } })}
        aria-label="Add beans"
        style={styles.iconPill}
      >
        <Plus size={24} color="var(--color-taupe)" strokeWidth={1.5} />
      </PillButton>

      {/* LOG BREW center pill */}
      <PillButton
        variant="glass"
        onClick={() => navigate('/beans', { state: { openLogBrew: true } })}
        style={styles.centerPill}
        aria-label="Log brew"
      >
        <img src={beanIcon} alt="" aria-hidden="true" width={19} height={24} style={{ flexShrink: 0 }} />
        <span style={styles.centerPillText}>LOG BREW</span>
      </PillButton>

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
  const showTabs = ['/beans', '/past'].includes(location.pathname)

  return (
    <div style={styles.appContainer}>
      <div style={styles.content}>
        {showTabs && <TopTabNav />}
        {children}
      </div>
      <FloatingActionBar />
    </div>
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
          <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/"         element={<Navigate to="/beans" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

const styles = {
  appContainer: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), var(--color-bg)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '112px',
  },

  // Top Beans / Past tab strip
  topNav: {
    display: 'flex',
    flexDirection: 'row',
    gap: '24px',
    padding: '16px 20px 0',
  },
  topTabWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  topTab: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    textDecoration: 'none',
    lineHeight: 1,
    transition: 'color 0.15s',
  },
  topTabDot: {
    width: '6px',
    height: '6px',
    borderRadius: '99px',
    background: 'var(--color-accent)',
  },

  // Floating action bar
  floatingBar: {
    position: 'fixed',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '311px',
    height: '48px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '24px',
    zIndex: 50,
  },
  iconPill: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
  },
  centerPill: {
    flex: 1,
    height: '48px',
    gap: '8px',
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
