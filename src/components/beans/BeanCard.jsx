import { useMemo, useState, useEffect } from 'react'
import beansLight from '../../assets/beans-light.svg'
import beansMid from '../../assets/beans-mid.svg'
import beansDeep from '../../assets/beans-deep.svg'
import paperBg from '../../assets/paper_bg.webp'
import beanFillIcon from '../../assets/bean_icon_fill.svg'

function beanDisplayName(bean) {
  if (bean.name) return bean.name
  return `${bean.origin ?? ''}${bean.farm ? ` · ${bean.farm}` : ''}`
}

function deriveRoastLevel(bean) {
  const text = `${bean.name ?? ''} ${bean.origin ?? ''} ${bean.process ?? ''}`.toLowerCase()
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
  const noiseId = `jar-noise-${bean.id}`
  const paperEdgeId = `paper-edge-${bean.id}`

  const avgRating = useMemo(() => {
    if (!bean.ratings || bean.ratings.length === 0) return null
    const sum = bean.ratings.reduce((s, r) => s + Number(r.score), 0)
    return (sum / bean.ratings.length).toFixed(1)
  }, [bean.ratings])

  const percentRemaining = Math.round(fillPercent * 100)
  const dateAdded = new Date(bean.created_at).toLocaleDateString('en-GB', {
    month: 'short', day: 'numeric',
  })
  const fillHeight = Math.round(fillPercent * 490)

  const [didMount, setDidMount] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDidMount(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={styles.card} onClick={onTap} role="button" tabIndex={0}>

      {/* Layer 1 — jar clip: hard clips bean fill to jar shape, overflow:hidden here */}
      <div style={styles.jarClip}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${fillHeight}px`,
          transition: didMount ? 'height 0.8s ease' : 'none',
          backgroundImage: `url(${beanSvg})`,
          backgroundSize: '100% 490px',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
        }} />
      </div>

      {/* Layer 2 — glass jar (lid + body): handles frosted effect + shadow, NOT a clip */}
      <div style={styles.lid} />
      <div style={styles.jarGlass} />

      {/* Layer 3 — glass noise grain */}
      <svg style={styles.jarNoise} aria-hidden="true">
        <filter id={noiseId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" rx="32" filter={`url(#${noiseId})`}/>
      </svg>

      {/* Paper edge filter — displaces label border pixels for deckled paper feel */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id={paperEdgeId} x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="4" seed="7" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>

      {/* Layer 4 — paper label */}
      <div style={{ ...styles.label, transform: `rotate(${rotation}deg)`, filter: `url(#${paperEdgeId})` }}>
        <div style={styles.labelTop}>
          <span style={styles.dateAdded}>{dateAdded}</span>
          {avgRating && (
            <span style={styles.rating}>
              <img src={beanFillIcon} alt="" width="11" aria-hidden="true" style={{ transform: 'rotate(30deg)', marginRight: '4px', verticalAlign: '-2px', display: 'inline-block' }} />
              {avgRating}
            </span>
          )}
        </div>

        <h2 style={styles.coffeeName}>{beanDisplayName(bean)}</h2>

        <div style={styles.metaRow}>
          <span style={styles.roaster}>{bean.roaster}</span>
          {bean.process && <span style={styles.process}>{bean.process}</span>}
        </div>

        {bean.flavor_tags && bean.flavor_tags.length > 0 && (
          <div style={styles.tagsRow}>
            {bean.flavor_tags.map((tag, i) => (
              <span key={tag} style={i === 0 ? styles.tagPrimary : i === 1 ? styles.tagSecondary : styles.tagTertiary}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={styles.stockSection}>
          <span style={styles.stockLabel}>Remaining</span>
          <div style={styles.stockRow}>
            <span style={styles.stockWeight}>{bean.current_weight_g}/{bean.total_weight_g}g</span>
            <span style={styles.stockPct}>{percentRemaining}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${percentRemaining}%`, background: fillPercent < 0.2 ? 'var(--color-lychee)' : styles.progressFill.background }} />
          </div>
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

  // jarClip — matches jar body exactly, overflow:hidden clips bean fill to the jar shape cleanly
  jarClip: {
    position: 'absolute',
    left: 0,
    top: '40px',
    width: '320px',
    height: '490px',
    borderRadius: '32px',
    overflow: 'hidden',
    zIndex: 1,
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
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 2,
  },

  // jarGlass — same shape as jarClip, handles frosted effect + shadow WITHOUT overflow:hidden
  jarGlass: {
    position: 'absolute',
    left: 0,
    top: '40px',
    width: '320px',
    height: '490px',
    borderRadius: '32px',
    background: 'rgba(245, 244, 237, 0.1)',
    boxShadow: '6px 18px 16px rgba(154,143,134,0.25), inset -2px -8px 10px 8px rgba(255,255,255,0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 2,
  },

  // Glass noise grain — inline SVG feTurbulence overlay
  jarNoise: {
    position: 'absolute',
    left: 0,
    top: '40px',
    width: '320px',
    height: '490px',
    borderRadius: '32px',
    overflow: 'hidden',
    opacity: 0.5,
    mixBlendMode: 'soft-light',
    pointerEvents: 'none',
    zIndex: 3,
  },

  // Paper label — floats above the jar
  label: {
    position: 'absolute',
    left: '24px',
    top: '100px',
    width: '272px',
    padding: '24px',
    backgroundImage: `url(${paperBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#E9E4D8',
    opacity: 0.95,
    border: '1px solid #E9E4D8',
    boxShadow: '2px 5px 6px rgba(62, 50, 50, 0.2)',
    borderRadius: '8px',
    zIndex: 4,
    transformOrigin: 'center center',
  },
  labelTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  dateAdded: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    color: '#644D42',
    fontWeight: 400,
  },
  rating: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    color: '#EA6816',
    fontWeight: 600,
  },
  coffeeName: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '24px',
    fontWeight: 700,
    color: '#130801',
    margin: '0 0 4px 0',
    lineHeight: 1,
    wordBreak: 'break-word',
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'baseline',
    marginBottom: '24px',
  },
  roaster: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 400,
    color: '#644D42',
  },
  process: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 400,
    color: '#644D42',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  },
  tagPrimary: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    color: '#FFFFFF',
    background: '#B93006',
    borderRadius: '2px',
    padding: '4px 8px',
  },
  tagSecondary: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 400,
    color: '#4A3933',
    background: '#EDEBEB',
    borderRadius: '2px',
    padding: '4px 8px',
  },
  tagTertiary: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 400,
    color: '#EA6816',
    background: '#F5F4ED',
    borderRadius: '2px',
    padding: '4px 8px',
  },
  stockSection: {
    paddingTop: '12px',
  },
  stockLabel: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    color: '#644D42',
    fontWeight: 400,
    display: 'block',
    marginBottom: '4px',
  },
  stockRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '8px',
  },
  stockWeight: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '20px',
    color: '#130801',
    fontWeight: 700,
  },
  stockPct: {
    fontFamily: '"Courier Prime", sans-serif',
    fontSize: '20px',
    color: '#EA6816',
    fontWeight: 600,
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    background: '#F5F4ED',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#4A3933',
    borderRadius: '99px',
  },
}
