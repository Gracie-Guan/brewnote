import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import paperBg from '../../assets/paper_bg.svg'

function SmallBeanIcon({ filled }) {
  return (
    <svg
      width="16" height="20" viewBox="0 0 19 24" fill="none"
      aria-hidden="true"
      style={{ transform: 'rotate(30deg)', display: 'block', flexShrink: 0 }}
    >
      <path
        d="M9.3916 0C14.5781 0.00020547 18.7822 5.37271 18.7822 12C18.7822 18.6273 14.5781 23.9998 9.3916 24C4.20493 24 0 18.6274 0 12C0 5.37258 4.20493 0 9.3916 0ZM9.30957 2.04395C8.86765 1.71308 8.24126 1.80345 7.91016 2.24512C7.57919 2.68719 7.6683 3.31449 8.11035 3.64551C8.44196 3.89384 8.99752 4.407 9.48828 5.08008C9.98182 5.75709 10.356 6.52201 10.4395 7.2832C10.4853 7.70231 10.4001 8.25746 10.1748 8.96094C9.95269 9.65442 9.62349 10.4076 9.25586 11.208C8.89732 11.9886 8.49528 12.8297 8.17285 13.6201C7.85185 14.407 7.57149 15.2331 7.48535 16.0127C7.34101 17.3204 7.78859 18.5819 8.31738 19.5635C8.85222 20.5562 9.5322 21.3788 10.0176 21.8525C10.4128 22.238 11.046 22.2301 11.4316 21.835C11.8173 21.4397 11.8092 20.8066 11.4141 20.4209C11.0599 20.0751 10.5081 19.4124 10.0781 18.6143C9.64223 17.8051 9.39145 16.9687 9.47266 16.2324C9.52763 15.7348 9.72153 15.1152 10.0234 14.375C10.3242 13.6379 10.6952 12.8682 11.0742 12.043C11.444 11.2378 11.8179 10.389 12.0801 9.57031C12.339 8.76166 12.5184 7.89328 12.4277 7.06543C12.2924 5.83149 11.7137 4.73703 11.1045 3.90137C10.4923 3.06178 9.79479 2.40731 9.30957 2.04395Z"
        fill={filled ? 'var(--color-accent)' : 'rgba(154,143,134,0.3)'}
      />
    </svg>
  )
}

const tagVariants = [
  { background: 'var(--color-lychee)', color: '#FFFFFF' },
  { background: 'var(--color-bg)', color: 'var(--color-mid-roast)', border: '1px solid rgba(154,143,134,0.3)' },
  { background: 'var(--color-porcelain)', color: 'var(--color-accent)' },
]

function TagChip({ tag, index }) {
  return (
    <span style={{
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-small)',
      fontWeight: 500,
      borderRadius: 'var(--radius-tag)',
      padding: '3px 8px',
      ...tagVariants[Math.min(index, 2)],
    }}>
      {tag}
    </span>
  )
}

export default function PastBeanDetail({ bean, onClose }) {
  const [brewNotes, setBrewNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  const avgRating = bean.ratings?.length > 0
    ? bean.ratings.reduce((s, r) => s + Number(r.score), 0) / bean.ratings.length
    : null
  const filledCount = avgRating ? Math.round(avgRating) : 0

  const archivedDate = bean.archived_at
    ? new Date(bean.archived_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const roastDate = bean.roast_date
    ? new Date(bean.roast_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  useEffect(() => {
    supabase
      .from('brew_notes')
      .select('*')
      .eq('bean_id', bean.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBrewNotes(data ?? [])
        setLoading(false)
      })
  }, [bean.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 360)
  }

  return (
    <div
      style={{
        ...styles.backdrop,
        animation: closing ? 'fade-out 0.32s ease-in-out forwards' : 'fade-in 0.2s ease forwards',
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        style={{
          ...styles.card,
          animation: closing
            ? 'modal-flip-out 0.36s cubic-bezier(0.34, 1.15, 0.64, 1) forwards'
            : 'modal-flip-in 0.36s cubic-bezier(0.34, 1.15, 0.64, 1) forwards',
        }}
      >
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={{ flex: 1 }}>
            <span style={styles.roaster}>{bean.roaster}</span>
            <h2 style={styles.beanName}>{bean.name}</h2>
          </div>
          <button type="button" style={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke="var(--color-taupe)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Metadata grid */}
        <div style={styles.metaGrid}>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Process</span>
            <span style={styles.metaValue}>{bean.process || '—'}</span>
          </div>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Roast Date</span>
            <span style={styles.metaValue}>{roastDate}</span>
          </div>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Finished</span>
            <span style={styles.metaValue}>{archivedDate}</span>
          </div>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Total Consumed</span>
            <span style={styles.metaValue}>{bean.total_weight_g}g</span>
          </div>
        </div>

        {/* Flavor tags */}
        {bean.flavor_tags?.length > 0 && (
          <div style={styles.section}>
            <span style={styles.sectionLabel}>Flavour</span>
            <div style={styles.tagsWrap}>
              {bean.flavor_tags.map((tag, i) => (
                <TagChip key={tag + i} tag={tag} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        {avgRating !== null && (
          <div style={styles.section}>
            <span style={styles.sectionLabel}>Rating</span>
            <div style={styles.ratingRow}>
              <span style={styles.ratingNum}>{avgRating.toFixed(1)}</span>
              <div style={styles.beanIcons}>
                {[1, 2, 3, 4, 5].map(n => (
                  <SmallBeanIcon key={n} filled={n <= filledCount} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={styles.divider} />

        {/* Brew notes */}
        <div style={styles.section}>
          <span style={styles.sectionLabel}>Brew Notes</span>
          {loading ? (
            <span style={styles.emptyText}>Loading…</span>
          ) : brewNotes.length === 0 ? (
            <span style={styles.emptyText}>No brew notes for this coffee.</span>
          ) : (
            <div style={styles.notesList}>
              {brewNotes.map(note => (
                <div key={note.id} style={styles.noteItem}>
                  <p style={styles.noteText}>{note.note}</p>
                  <span style={styles.noteTime}>
                    {new Date(note.created_at).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.5) 0%, rgba(100,77,66,0.5) 18.27%, rgba(154,143,134,0.5) 34.13%, rgba(237,235,235,0.5) 100%), rgba(154,143,134,0.5)',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    padding: '20px',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '86svh',
    overflowY: 'auto',
    background: `url(${paperBg}) center / cover, var(--color-silk)`,
    borderRadius: '16px',
    padding: '24px 24px 28px',
    boxShadow: '0 8px 40px rgba(62,50,50,0.25)',
    transformOrigin: 'center center',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
  },
  roaster: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-light-roast)',
    fontWeight: 500,
    marginBottom: '4px',
  },
  beanName: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--color-dark)',
    margin: 0,
    lineHeight: 1.15,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 24px',
    marginBottom: '20px',
  },
  metaCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-light-roast)',
    fontWeight: 400,
  },
  metaValue: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    fontWeight: 400,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-light-roast)',
    fontWeight: 400,
  },
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  ratingNum: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    color: 'var(--color-dark)',
  },
  beanIcons: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  divider: {
    height: '1px',
    background: 'rgba(154,143,134,0.25)',
    margin: '4px 0 16px',
  },
  emptyText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    fontStyle: 'italic',
  },
  notesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noteItem: {
    background: 'rgba(154,143,134,0.1)',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  noteText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-dark)',
    margin: 0,
    lineHeight: 1.5,
  },
  noteTime: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
  },
}
