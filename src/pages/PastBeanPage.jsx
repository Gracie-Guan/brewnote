import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import paperBg from '../assets/paper_bg.webp'

const BEAN_PATH = 'M9.3916 0C14.5781 0.00020547 18.7822 5.37271 18.7822 12C18.7822 18.6273 14.5781 23.9998 9.3916 24C4.20493 24 0 18.6274 0 12C0 5.37258 4.20493 0 9.3916 0ZM9.30957 2.04395C8.86765 1.71308 8.24126 1.80345 7.91016 2.24512C7.57919 2.68719 7.6683 3.31449 8.11035 3.64551C8.44196 3.89384 8.99752 4.407 9.48828 5.08008C9.98182 5.75709 10.356 6.52201 10.4395 7.2832C10.4853 7.70231 10.4001 8.25746 10.1748 8.96094C9.95269 9.65442 9.62349 10.4076 9.25586 11.208C8.89732 11.9886 8.49528 12.8297 8.17285 13.6201C7.85185 14.407 7.57149 15.2331 7.48535 16.0127C7.34101 17.3204 7.78859 18.5819 8.31738 19.5635C8.85222 20.5562 9.5322 21.3788 10.0176 21.8525C10.4128 22.238 11.046 22.2301 11.4316 21.835C11.8173 21.4397 11.8092 20.8066 11.4141 20.4209C11.0599 20.0751 10.5081 19.4124 10.0781 18.6143C9.64223 17.8051 9.39145 16.9687 9.47266 16.2324C9.52763 15.7348 9.72153 15.1152 10.0234 14.375C10.3242 13.6379 10.6952 12.8682 11.0742 12.043C11.444 11.2378 11.8179 10.389 12.0801 9.57031C12.339 8.76166 12.5184 7.89328 12.4277 7.06543C12.2924 5.83149 11.7137 4.73703 11.1045 3.90137C10.4923 3.06178 9.79479 2.40731 9.30957 2.04395Z'

function BeanIcon({ filled }) {
  return (
    <svg width="14" height="18" viewBox="0 0 19 24" fill="none" aria-hidden="true"
      style={{ transform: 'rotate(30deg)', display: 'block', flexShrink: 0 }}>
      <path d={BEAN_PATH} fill={filled ? 'var(--color-light-roast)' : 'rgba(154,143,134,0.3)'} />
    </svg>
  )
}

// Match each brew note to a rating logged within 5 minutes, then surface unmatched ratings standalone
function buildEntries(notes, ratings) {
  const usedRatingIds = new Set()

  const noteEntries = notes.map(note => {
    const noteTime = new Date(note.created_at).getTime()
    const match = ratings.find(r =>
      !usedRatingIds.has(r.id) &&
      Math.abs(new Date(r.created_at).getTime() - noteTime) < 5 * 60 * 1000
    )
    if (match) usedRatingIds.add(match.id)
    return { type: 'note', data: note, matchedRating: match ?? null, created_at: note.created_at }
  })

  const ratingOnlyEntries = ratings
    .filter(r => !usedRatingIds.has(r.id))
    .map(r => ({ type: 'rating', data: r, matchedRating: null, created_at: r.created_at }))

  return [...noteEntries, ...ratingOnlyEntries]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function groupByDate(entries) {
  const groups = []
  let currentDate = null
  entries.forEach(entry => {
    const dateStr = new Date(entry.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, entries: [] })
    }
    groups[groups.length - 1].entries.push(entry)
  })
  return groups
}

export default function PastBeanPage() {
  const { beanId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [bean, setBean] = useState(state?.bean ?? null)
  const [notes, setNotes] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [beanRes, notesRes, ratingsRes] = await Promise.all([
        bean
          ? Promise.resolve({ data: bean })
          : supabase.from('beans').select('*').eq('id', beanId).single(),
        supabase.from('brew_notes').select('*').eq('bean_id', beanId).order('created_at', { ascending: false }),
        supabase.from('ratings').select('*').eq('bean_id', beanId).order('created_at', { ascending: false }),
      ])
      if (!bean && beanRes.data) setBean(beanRes.data)
      setNotes(notesRes.data ?? [])
      setRatings(ratingsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [beanId])

  const entries = buildEntries(notes, ratings)
  const groups = groupByDate(entries)

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button type="button" style={styles.backBtn} onClick={() => navigate('/past')} aria-label="Back to Past">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="var(--color-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={styles.topBarLabel}>Past</span>
      </div>

      {/* Bean header card */}
      {bean && (
        <div style={styles.headerCard}>
          <span style={styles.roaster}>{bean.roaster}</span>
          <h1 style={styles.beanName}>{bean.name}</h1>
        </div>
      )}

      {/* Notes section */}
      <div style={styles.notesSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Brew Notes</span>
          {notes.length > 0 && (
            <span style={styles.sectionBadge}>{notes.length}</span>
          )}
        </div>

        {loading ? (
          <span style={styles.emptyText}>Loading…</span>
        ) : groups.length === 0 ? (
          <span style={styles.emptyText}>No brew notes for this coffee.</span>
        ) : (
          groups.map(group => (
            <div key={group.date} style={styles.dateGroup}>
              <span style={styles.dateLabel}>{group.date}</span>
              <div style={styles.groupCards}>
                {group.entries.map((entry, i) => {
                  const time = new Date(entry.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit',
                  })
                  const score = entry.type === 'note' ? entry.matchedRating?.score : entry.data.score

                  return (
                    <div key={entry.type + (entry.data?.id ?? i)} style={styles.noteCard}>
                      {entry.type === 'note' && (
                        <p style={styles.noteText}>{entry.data.note}</p>
                      )}
                      <div style={styles.cardFooter}>
                        <span style={styles.noteTime}>{time}</span>
                        {score != null && (
                          <div style={styles.inlineRating}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <BeanIcon key={n} filled={n <= Math.round(score)} />
                            ))}
                            <span style={styles.ratingScore}>{Number(score).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100dvh',
    paddingBottom: '48px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 20px 0',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    marginLeft: '-4px',
  },
  topBarLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-light-roast)',
    fontWeight: 400,
  },
  headerCard: {
    margin: '16px 20px',
    background: `url(${paperBg}) center / cover, var(--color-silk)`,
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '2px 5px 6px rgba(62,50,50,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  roaster: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-light-roast)',
    fontWeight: 500,
    marginBottom: '8px',
  },
  beanName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    fontWeight: 700,
    color: 'var(--color-dark)',
    margin: 0,
    lineHeight: 1.1,
  },
  notesSection: {
    padding: '0 20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectionBadge: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    background: 'rgba(154,143,134,0.15)',
    borderRadius: '99px',
    padding: '2px 8px',
  },
  emptyText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    fontStyle: 'italic',
  },
  dateGroup: {
    marginBottom: '24px',
  },
  dateLabel: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    color: 'var(--color-light-roast)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  },
  groupCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noteCard: {
    background: 'rgba(237, 235, 235, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '2px 4px 8px rgba(154, 143, 134, 0.12)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  noteText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    margin: '0 0 12px',
    lineHeight: 1.55,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTime: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-light-roast)',
  },
  inlineRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  ratingScore: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    color: 'var(--color-accent)',
    marginLeft: '8px',
  },
}
