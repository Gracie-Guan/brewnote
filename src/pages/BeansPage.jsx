import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBeans } from '../hooks/useBeans'
import EmptyState from '../components/beans/EmptyState'
import BeanCarousel from '../components/beans/BeanCarousel'
import AddCoffeeModal from '../components/beans/AddCoffeeModal'

export default function BeansPage() {
  const { beans, householdId, loading, error, refetch } = useBeans('active')
  const [focusedBean, setFocusedBean] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Open modal if nav bar "+" was tapped
  useEffect(() => {
    if (location.state?.openAdd) {
      setShowAddModal(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.openAdd])

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

  return (
    <div style={styles.page}>
      {/* Greeting header */}
      <div style={styles.header}>
        <h1 style={styles.greeting}>Coffee Yet?</h1>
        <p style={styles.subgreeting}>
          {beans.length === 0
            ? 'Your jar is waiting.'
            : `${beans.length} bean${beans.length !== 1 ? 's' : ''} in the jar`}
        </p>
      </div>

      {beans.length === 0 ? (
        <EmptyState onAddBeans={() => setShowAddModal(true)} />
      ) : (
        <BeanCarousel
          beans={beans}
          onCardTap={(bean) => {/* BeanDetailModal wired in step 6 */}}
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
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100%',
    paddingBottom: '24px',
  },
  header: {
    padding: '20px 20px 8px',
  },
  greeting: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-display)',
    fontWeight: 700,
    color: 'var(--color-dark)',
    margin: 0,
    lineHeight: 1.2,
  },
  subgreeting: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    margin: 0,
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
