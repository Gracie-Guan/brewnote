import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BeansPage from './pages/BeansPage'
import PastPage from './pages/PastPage'
import SettingsPage from './pages/SettingsPage'

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

function AppLayout({ children }) {
  const location = useLocation()
  const tabs = [
    { path: '/beans', label: 'Beans' },
    { path: '/past', label: 'Past' },
    { path: '/settings', label: 'Settings' },
  ]

  return (
    <div style={styles.appContainer}>
      <div style={styles.content}>{children}</div>
      <nav style={styles.tabBar}>
        {tabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              ...styles.tabItem,
              color: location.pathname === tab.path ? '#EA6816' : '#9A8F86',
              fontWeight: location.pathname === tab.path ? 500 : 400,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={styles.loading}>
      <span style={{ fontFamily: '"Courier Prime", monospace', color: '#9A8F86', fontSize: '20px' }}>
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
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route
            path="/beans"
            element={
              <ProtectedRoute>
                <AppLayout><BeansPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/past"
            element={
              <ProtectedRoute>
                <AppLayout><PastPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout><SettingsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/beans" replace />} />
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
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), #EDEBEB',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '82px',
  },
  tabBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(237,235,235,0.7)',
    border: '3px solid rgba(255,255,255,0.2)',
    boxShadow: '0px -4px 16px 4px rgba(154,143,134,0.2)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 100,
    padding: '8px 20px 34px',
  },
  tabItem: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '99px',
    transition: 'color 0.15s',
  },
  loading: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), #EDEBEB',
  },
}
