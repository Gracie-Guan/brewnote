import { useState, useMemo } from 'react'
import { useBeans } from '../hooks/useBeans'
import PastBeanCard from '../components/past/PastBeanCard'
import PastBeanDetail from '../components/past/PastBeanDetail'

export default function PastPage() {
  const { beans, loading, error } = useBeans('archived')
  const [selectedBean, setSelectedBean] = useState(null)

  // Count finished bags per name+roaster combination
  const purchaseCounts = useMemo(() => {
    const counts = {}
    beans.forEach(b => {
      const key = `${b.name.toLowerCase()}|${b.roaster.toLowerCase()}`
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, [beans])

  if (loading) {
    return (
      <div style={styles.center}>
        <span style={styles.mutedText}>Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.center}>
        <span style={styles.mutedText}>{error}</span>
      </div>
    )
  }

  if (beans.length === 0) {
    return (
      <div style={styles.center}>
        <span style={styles.emptyTitle}>Nothing here yet.</span>
        <span style={styles.emptySubtext}>Beans move here when they're finished.</span>
      </div>
    )
  }

  return (
    <>
      <div style={styles.list}>
        {beans.map(bean => {
          const key = `${bean.name.toLowerCase()}|${bean.roaster.toLowerCase()}`
          return (
            <PastBeanCard
              key={bean.id}
              bean={bean}
              purchaseCount={purchaseCounts[key] ?? 1}
              onTap={() => setSelectedBean(bean)}
            />
          )
        })}
      </div>

      {selectedBean && (
        <PastBeanDetail
          bean={selectedBean}
          onClose={() => setSelectedBean(null)}
        />
      )}
    </>
  )
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px 20px 20px',
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
