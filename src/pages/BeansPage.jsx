import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBeans } from '../hooks/useBeans'
import { useAppUI } from '../contexts/AppUIContext'
import EmptyState from '../components/beans/EmptyState'
import BeanCarousel from '../components/beans/BeanCarousel'
import AddCoffeeModal from '../components/beans/AddCoffeeModal'
import BeanDetailModal from '../components/beans/BeanDetailModal'
import LogBrewDrawer from '../components/beans/LogBrewDrawer'
import TopTabNav from '../components/ui/TopTabNav'
import Toast from '../components/ui/Toast'

export default function BeansPage() {
  const { beans, householdId, loading, error, refetch } = useBeans('active')
  const { setHideLogBrew } = useAppUI()
  const [focusedBean, setFocusedBean] = useState(null)
  const [selectedBean, setSelectedBean] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLogBrew, setShowLogBrew] = useState(false)
  const [toast, setToast] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Open Add modal if nav bar "+" was tapped
  useEffect(() => {
    if (location.state?.openAdd) {
      setShowAddModal(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.openAdd])

  // Open Log Brew drawer if action bar button was tapped
  useEffect(() => {
    if (location.state?.openLogBrew) {
      navigate(location.pathname, { replace: true, state: {} })
      // Only open if there are beans in the carousel
      if (beans.length > 0) setShowLogBrew(true)
    }
  }, [location.state?.openLogBrew, beans.length])

  useEffect(() => {
    if (!loading) setHideLogBrew(beans.length === 0)
  }, [beans.length, loading, setHideLogBrew])

  function handleBeanArchived(beanName) {
    setToast(`☕ ${beanName} finished — moved to Past`)
    refetch()
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <span style={styles.loadingText}>loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.center}>
        <span style={styles.errorText}>{error}</span>
      </div>
    )
  }

  const activeFocusedBean = focusedBean ?? (beans.length > 0 ? beans[0] : null)

  return (
    <div style={styles.page}>
      {/* Greeting header */}
      <div style={styles.header}>
        <h1 style={styles.greeting}>Coffee Yet?</h1>
      </div>

      <TopTabNav />

      {beans.length === 0 ? (
        <EmptyState />
      ) : (
        <BeanCarousel
          beans={beans}
          onCardTap={setSelectedBean}
          onFocusChange={setFocusedBean}
        />
      )}

      {showAddModal && (
        <AddCoffeeModal
          householdId={householdId}
          onClose={() => setShowAddModal(false)}
          onAdded={refetch}
        />
      )}

      {selectedBean && (
        <BeanDetailModal
          bean={selectedBean}
          householdId={householdId}
          onClose={() => setSelectedBean(null)}
          onBeanUpdated={refetch}
        />
      )}

      {showLogBrew && activeFocusedBean && (
        <LogBrewDrawer
          bean={activeFocusedBean}
          householdId={householdId}
          onClose={() => setShowLogBrew(false)}
          onBeanUpdated={refetch}
          onBeanArchived={handleBeanArchived}
        />
      )}

      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100%',
    paddingBottom: '24px',
  },
  header: {
    padding: '24px 20px 4px',
  },
  greeting: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-display)',
    fontWeight: 400,
    color: 'var(--color-dark)',
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: '-0.05em',
    textShadow: '0px 6px 10px rgba(154,143,134,0.2)',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  loadingText: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
  },
  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-lychee)',
  },
}
