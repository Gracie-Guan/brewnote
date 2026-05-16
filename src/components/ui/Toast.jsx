import { useEffect, useState } from 'react'

export default function Toast({ message, onDismiss }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const hideTimer = setTimeout(() => setLeaving(true), 3000)
    return () => clearTimeout(hideTimer)
  }, [])

  useEffect(() => {
    if (!leaving) return
    const removeTimer = setTimeout(onDismiss, 300)
    return () => clearTimeout(removeTimer)
  }, [leaving, onDismiss])

  return (
    <div
      style={{
        ...styles.toast,
        animation: leaving ? 'slide-up 0.3s ease forwards' : 'slide-down 0.35s ease',
      }}
    >
      {message}
    </div>
  )
}

const styles = {
  toast: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(74, 57, 51, 0.9)',
    color: 'var(--color-porcelain)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    padding: '12px 20px',
    borderRadius: '99px',
    boxShadow: '2px 4px 12px rgba(74, 57, 51, 0.3)',
    whiteSpace: 'nowrap',
    zIndex: 200,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
}
