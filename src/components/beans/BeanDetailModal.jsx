import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import PillButton from '../ui/PillButton'
import BeanRating from './BeanRating'
import paperBg from '../../assets/paper_bg.webp'

// Mirrors BeanCard tag style: first=lychee red, second=outlined light, third=orange text
function TagChip({ tag, index }) {
  const style = index === 0 ? tagStyles.primary : index === 1 ? tagStyles.secondary : tagStyles.tertiary
  return (
    <span style={{ ...tagStyles.base, ...style }}>
      {tag}
    </span>
  )
}

export default function BeanDetailModal({ bean, householdId, onClose, onBeanUpdated }) {
  const [flavorTags, setFlavorTags]       = useState(bean.flavor_tags ?? [])
  const [tagInput, setTagInput]           = useState('')
  const [showTagInput, setShowTagInput]   = useState(false)
  const [brewNote, setBrewNote]           = useState('')
  const [pendingRating, setPendingRating] = useState(null)
  const [ratings, setRatings]             = useState(bean.ratings ?? [])
  const [submitting, setSubmitting]       = useState(false)
  const [closing, setClosing]             = useState(false)
  const tagInputRef = useRef(null)
  const skipTagBlur = useRef(false)

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + Number(r.score), 0) / ratings.length).toFixed(1)
    : null

  const roastDate = bean.roast_date
    ? new Date(bean.roast_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 360)
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleAddTag() {
    const val = tagInput.trim()
    if (!val || flavorTags.includes(val)) { setTagInput(''); setShowTagInput(false); return }
    const newTags = [...flavorTags, val]
    setFlavorTags(newTags)
    setTagInput('')
    setShowTagInput(false)
    await supabase.from('beans').update({ flavor_tags: newTags }).eq('id', bean.id)
    onBeanUpdated?.()
  }

  // Save brew note + rating together, then close
  async function handleConfirm() {
    if (submitting) return
    const hasNote   = brewNote.trim().length > 0
    const hasRating = pendingRating !== null

    if (!hasNote && !hasRating) { handleClose(); return }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    const ops = []

    if (hasNote) {
      ops.push(
        supabase.from('brew_notes').insert({
          bean_id:      bean.id,
          household_id: householdId,
          user_id:      user.id,
          note:         brewNote.trim(),
        })
      )
    }

    if (hasRating) {
      ops.push(
        supabase.from('ratings').insert({
          bean_id:      bean.id,
          household_id: householdId,
          user_id:      user.id,
          score:        pendingRating,
        }).select().single()
      )
    }

    const results = await Promise.all(ops)

    // If a rating was saved, update local average immediately
    if (hasRating) {
      const ratingResult = results[hasNote ? 1 : 0]
      if (ratingResult.data) setRatings(prev => [...prev, ratingResult.data])
    }

    if (hasNote || hasRating) onBeanUpdated?.()
    setSubmitting(false)
    handleClose()
  }

  const canConfirm = brewNote.trim().length > 0 || pendingRating !== null

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
        {/* Paper edge SVG filter */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
          <defs>
            <filter id="detail-paper-edge" x="-4%" y="-4%" width="108%" height="108%">
              <feTurbulence type="turbulence" baseFrequency="0.025" numOctaves="3" seed="12" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
          </defs>
        </svg>

        {/* Bean name */}
        <h2 style={styles.beanName}>{bean.name}</h2>

        {/* 2-col metadata grid */}
        <div style={styles.metaGrid}>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Roaster</span>
            <span style={styles.metaValue}>{bean.roaster}</span>
          </div>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Process</span>
            <span style={styles.metaValue}>{bean.process || '—'}</span>
          </div>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Roast Date</span>
            <span style={styles.metaValue}>{roastDate}</span>
          </div>
          <div style={styles.metaCell}>
            <span style={styles.metaLabel}>Stock</span>
            <span style={styles.metaValue}>{bean.current_weight_g}g / {bean.total_weight_g}g</span>
          </div>
        </div>

        {/* Flavour tags */}
        <div style={styles.section}>
          <span style={styles.sectionLabel}>Flavour</span>
          <div style={styles.tagsWrap}>
            {flavorTags.map((tag, i) => (
              <TagChip key={tag} tag={tag} index={i} />
            ))}
            {showTagInput ? (
              <input
                ref={tagInputRef}
                className="field-input"
                style={styles.tagInput}
                placeholder="e.g. Jasmine"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); skipTagBlur.current = true; handleAddTag() }
                  if (e.key === 'Escape') { skipTagBlur.current = true; setTagInput(''); setShowTagInput(false) }
                }}
                onBlur={() => {
                  if (skipTagBlur.current) { skipTagBlur.current = false; return }
                  handleAddTag()
                }}
                autoFocus
              />
            ) : (
              <button type="button" style={styles.addTagBtn} onClick={() => setShowTagInput(true)}>
                + Add note
              </button>
            )}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Brew Note */}
        <div style={styles.section}>
          <span style={styles.sectionLabel}>Brew Note</span>
          <textarea
            className="field-input"
            style={styles.textarea}
            placeholder="e.g. time, temperature, grinding"
            value={brewNote}
            onChange={e => setBrewNote(e.target.value)}
            rows={4}
          />
        </div>

        {/* Rating + confirm button */}
        <div style={styles.ratingRow}>
          <div style={styles.ratingLeft}>
            <span style={styles.sectionLabel}>Log a Rating</span>
            <BeanRating
              avgRating={avgRating ? Number(avgRating) : null}
              ratingCount={ratings.length}
              pendingRating={pendingRating}
              onRate={setPendingRating}
            />
          </div>

          <button
            type="button"
            style={{ ...styles.confirmBtn, ...(submitting ? styles.confirmBtnDisabled : {}) }}
            onClick={handleConfirm}
            aria-label="Save and close"
            disabled={submitting}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 11L9 15L17 7" stroke="var(--color-accent-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const tagStyles = {
  base: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
    borderRadius: '2px',
    padding: '4px 10px',
    border: 'none',
    cursor: 'pointer',
  },
  primary: {
    background: 'var(--color-lychee)',
    color: '#FFFFFF',
  },
  secondary: {
    background: 'var(--color-bg)',
    color: 'var(--color-mid-roast)',
    border: '1px solid rgba(154,143,134,0.3)',
  },
  tertiary: {
    background: 'var(--color-porcelain)',
    color: 'var(--color-accent)',
  },
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
    padding: '20px 20px',
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
  beanName: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--color-dark)',
    margin: '0 0 20px',
    lineHeight: 1.15,
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
  addTagBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    background: 'none',
    border: '1.5px dashed rgba(154,143,134,0.6)',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
  },
  tagInput: {
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    color: 'var(--color-dark)',
    background: 'rgba(154,143,134,0.15)',
    borderRadius: '4px',
    padding: '4px 10px',
    minWidth: '100px',
    width: 'auto',
  },

  divider: {
    height: '1px',
    background: 'rgba(154,143,134,0.25)',
    margin: '4px 0 16px',
  },

  textarea: {
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    color: 'var(--color-dark)',
    background: 'rgba(154,143,134,0.12)',
    borderRadius: '8px',
    padding: '12px 14px',
    resize: 'none',
    lineHeight: 1.5,
    width: '100%',
    boxSizing: 'border-box',
  },

  ratingRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '16px',
    marginTop: '4px',
  },
  ratingLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  confirmBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '99px',
    background: 'var(--color-mid-roast)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '2px 4px 8px rgba(62,50,50,0.25), inset -2px -2px 2px rgba(255,255,255,0.15)',
    transition: 'opacity 0.15s',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}
