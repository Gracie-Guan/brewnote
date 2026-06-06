import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBeans } from '../hooks/useBeans'
import PastBeanCard from '../components/past/PastBeanCard'
import TopTabNav from '../components/ui/TopTabNav'

export default function PastPage() {
  const { beans, loading, error } = useBeans('archived')
  const navigate = useNavigate()

  // Count finished bags per name+roaster combination
  const purchaseCounts = useMemo(() => {
    const counts = {}
    beans.forEach(b => {
      const key = `${b.name.toLowerCase()}|${b.roaster.toLowerCase()}`
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, [beans])

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.greeting}>All Done.</h1>
      </div>

      <TopTabNav />

      {loading ? (
        <div style={styles.center}>
          <span style={styles.mutedText}>Loading…</span>
        </div>
      ) : error ? (
        <div style={styles.center}>
          <span style={styles.mutedText}>{error}</span>
        </div>
      ) : beans.length === 0 ? (
        <div style={styles.center}>
          <span style={styles.emptyTitle}>Nothing here yet.</span>
          <span style={styles.emptySubtext}>Beans move here when they're finished.</span>
        </div>
      ) : (
        <div style={styles.list}>
          {beans.map(bean => {
            const key = `${bean.name.toLowerCase()}|${bean.roaster.toLowerCase()}`
            return (
              <PastBeanCard
                key={bean.id}
                bean={bean}
                purchaseCount={purchaseCounts[key] ?? 1}
                onTap={() => navigate(`/past/${bean.id}`, { state: { bean } })}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px 20px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
    gap: '8px',
    padding: '20px',
    textAlign: 'center',
  },
  mutedText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    color: 'var(--color-dark)',
  },
  emptySubtext: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
  },
}
