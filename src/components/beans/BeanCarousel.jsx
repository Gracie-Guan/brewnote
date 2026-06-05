import { useRef, useState, useCallback, useEffect } from 'react'
import BeanCard from './BeanCard'

export default function BeanCarousel({ beans, onCardTap, onFocusChange }) {
  const containerRef = useRef(null)
  const cardRefs = useRef([])
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Report focused bean upward whenever it changes
  useEffect(() => {
    onFocusChange?.(beans[focusedIndex] ?? null)
  }, [focusedIndex, beans, onFocusChange])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const containerCenter = container.scrollLeft + container.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    cardRefs.current.forEach((ref, i) => {
      if (!ref) return
      const cardCenter = ref.offsetLeft + ref.offsetWidth / 2
      const dist = Math.abs(cardCenter - containerCenter)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    if (closest !== focusedIndex) setFocusedIndex(closest)
  }, [focusedIndex])

  return (
    <div style={styles.outer}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={styles.container}
        className="carousel-scroll"
      >
        {beans.map((bean, i) => (
          <div
            key={bean.id}
            ref={el => { cardRefs.current[i] = el }}
            style={styles.cardWrapper}
          >
            <BeanCard
              bean={bean}
              onTap={() => onCardTap?.(bean)}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {beans.length > 1 && (
        <div style={styles.dots}>
          {beans.map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                background: i === focusedIndex ? '#EA6816' : 'rgba(154,143,134,0.4)',
                width: i === focusedIndex ? '16px' : '6px',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  outer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  container: {
    display: 'flex',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    touchAction: 'pan-x',
    gap: '24px',
    padding: '24px 28px 48px',
    alignItems: 'flex-start',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardWrapper: {
    flexShrink: 0,
    scrollSnapAlign: 'center',
  },
  dots: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  dot: {
    height: '6px',
    borderRadius: '99px',
    transition: 'width 0.25s ease, background 0.25s ease',
  },
}
