import { useState } from 'react'
import { useBeans } from '../hooks/useBeans'
import EmptyState from '../components/beans/EmptyState'
import BeanCarousel from '../components/beans/BeanCarousel'

export default function BeansPage() {
  const { beans, loading, error } = useBeans('active')
  const [focusedBean, setFocusedBean] = useState(null)

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
        <EmptyState onAddBeans={() => {/* wired in step 4 */}} />
      ) : (
        <>
          <BeanCarousel
            beans={beans}
            onCardTap={(bean) => {/* BeanDetailModal wired in step 6 */}}
            onFocusChange={setFocusedBean}
          />

          {/* LOG BREW — placeholder, wired in step 7 */}
          <div style={styles.brewButtonRow}>
            <button style={styles.brewButton}>
              LOG BREW
            </button>
          </div>
        </>
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
    padding: '28px 20px 8px',
  },
  greeting: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '28px',
    fontWeight: 700,
    color: '#130801',
    margin: '0 0 4px 0',
    lineHeight: 1.2,
  },
  subgreeting: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#9A8F86',
    margin: 0,
  },
  brewButtonRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 20px 0',
  },
  brewButton: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '15px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    color: '#F5F4ED',
    background: 'rgba(74, 57, 51, 0.8)',
    boxShadow: '2px 2px 4px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.3)',
    border: 'none',
    borderRadius: '99px',
    padding: '14px 48px',
    cursor: 'pointer',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  loadingText: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '16px',
    color: '#9A8F86',
  },
  errorText: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#B93006',
  },
}
