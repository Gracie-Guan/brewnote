import { useMemo } from 'react'
import beansLight from '../../assets/beans-light.svg'
import beansMid from '../../assets/beans-mid.svg'
import beansDeep from '../../assets/beans-deep.svg'

function deriveRoastLevel(bean) {
  const text = `${bean.name} ${bean.process ?? ''}`.toLowerCase()
  if (text.includes('light') || text.includes('blond') || text.includes('gold')) return 'light'
  if (text.includes('dark') || text.includes('french') || text.includes('italian')) return 'deep'
  return 'mid'
}

// Deterministic rotation per bean so it doesn't shift on re-renders
function beanRotation(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return ((Math.abs(h) % 400) / 100) - 2 // -2 to +2 degrees
}

export default function BeanCard({ bean, onTap }) {
  const fillPercent = Math.max(0, Math.min(1, bean.current_weight_g / bean.total_weight_g))
  const roastLevel = deriveRoastLevel(bean)
  const beanSvg = roastLevel === 'light' ? beansLight : roastLevel === 'deep' ? beansDeep : beansMid
  const rotation = useMemo(() => beanRotation(bean.id), [bean.id])

  const avgRating = useMemo(() => {
    if (!bean.ratings || bean.ratings.length === 0) return null
    const sum = bean.ratings.reduce((s, r) => s + Number(r.score), 0)
    return (sum / bean.ratings.length).toFixed(1)
  }, [bean.ratings])

  const percentRemaining = Math.round(fillPercent * 100)
  const dateAdded = new Date(bean.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const fillHeight = Math.round(fillPercent * 490)

  return (
    <div style={styles.card} onClick={onTap} role="button" tabIndex={0}>

      {/* Layer 1 — bean pattern, fills from bottom */}
      <div style={{ ...styles.beanFill, height: `${fillHeight}px` }}>
        <img
          src={beanSvg}
          alt=""
          aria-hidden="true"
          style={styles.beanPattern}
        />
      </div>

      {/* Layer 2 — glass jar (lid + body) */}
      <div style={styles.lid} />
      <div style={styles.jarBody} />

      {/* Layer 3 — paper label */}
      <div style={{ ...styles.label, transform: `rotate(${rotation}deg)` }}>
        <div style={styles.labelTop}>
          <span style={styles.dateAdded}>{dateAdded}</span>
          {avgRating && (
            <span style={styles.rating}>★ {avgRating}</span>
          )}
        </div>

        <h2 style={styles.coffeeName}>{bean.name}</h2>
        <p style={styles.roaster}>{bean.roaster}</p>
        {bean.process && <p style={styles.process}>{bean.process}</p>}

        {bean.flavor_tags && bean.flavor_tags.length > 0 && (
          <div style={styles.tagsRow}>
            {bean.flavor_tags.slice(0, 3).map(tag => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
            {bean.flavor_tags.length > 3 && (
              <span style={styles.tag}>+{bean.flavor_tags.length - 3}</span>
            )}
          </div>
        )}

        <div style={styles.stockRow}>
          <span style={styles.stockWeight}>
            {bean.current_weight_g}g / {bean.total_weight_g}g
          </span>
          <span style={styles.stockPct}>{percentRemaining}% left</span>
        </div>
      </div>

    </div>
  )
}

const styles = {
  card: {
    position: 'relative',
    width: '320px',
    height: '530px',
    cursor: 'pointer',
    flexShrink: 0,
    outline: 'none',
  },

  // Bean fill — positioned at bottom of jar body, clips to fillHeight
  beanFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '320px',
    overflow: 'hidden',
    zIndex: 1,
    borderRadius: '0 0 32px 32px',
  },
  beanPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '320px',
    height: '490px',
    objectFit: 'cover',
    objectPosition: 'bottom',
    display: 'block',
  },

  // Jar lid
  lid: {
    position: 'absolute',
    width: '300px',
    height: '40px',
    left: '10px',
    top: '0px',
    background: 'rgba(237, 235, 235, 0.1)',
    boxShadow: '6px 18px 16px rgba(154,143,134,0.25), inset 3px -1px 10px 8px rgba(255,255,255,0.8), inset 0px -20px 8px 8px rgba(100,77,66,0.2)',
    borderRadius: '8px',
    zIndex: 2,
  },

  // Jar body
  jarBody: {
    position: 'absolute',
    boxSizing: 'border-box',
    width: '320px',
    height: '490px',
    left: '0px',
    top: '40px',
    background: 'rgba(245, 244, 237, 0.1)',
    boxShadow: '6px 18px 16px rgba(154,143,134,0.25), inset -2px -8px 10px 8px rgba(255,255,255,0.8)',
    borderRadius: '32px',
    zIndex: 2,
  },

  // Paper label — floats above the jar
  label: {
    position: 'absolute',
    left: '34px',
    top: '108px',
    width: '252px',
    padding: '16px',
    background: 'linear-gradient(160deg, #F0EBE0 0%, #E9E4D8 100%)',
    opacity: 0.95,
    border: '1px solid #E9E4D8',
    boxShadow: '2px 5px 6px rgba(62, 50, 50, 0.2)',
    borderRadius: '8px',
    zIndex: 3,
    transformOrigin: 'center center',
  },
  labelTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  dateAdded: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    color: '#9A8F86',
    fontWeight: 400,
  },
  rating: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    color: '#EA6816',
    fontWeight: 500,
  },
  coffeeName: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    color: '#130801',
    margin: '0 0 4px 0',
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  roaster: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13px',
    fontWeight: 400,
    color: '#4A3933',
    margin: '0 0 3px 0',
  },
  process: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 400,
    color: '#9A8F86',
    margin: '0 0 10px 0',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '12px',
  },
  tag: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 400,
    color: '#4A3933',
    background: '#F5F4ED',
    border: '1px solid #FFFFFF',
    borderRadius: '2px',
    padding: '2px 7px',
  },
  stockRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(154,143,134,0.2)',
  },
  stockWeight: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '12px',
    color: '#4A3933',
    fontWeight: 400,
  },
  stockPct: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    color: '#EA6816',
    fontWeight: 500,
  },
}
