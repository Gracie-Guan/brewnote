import { useState } from 'react'
import PillButton from './PillButton'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const [closing, setClosing] = useState(false)

  function dismiss(cb) {
    if (closing) return
    setClosing(true)
    setTimeout(cb, 280)
  }

  return (
    <>
      <div
        onClick={() => dismiss(onCancel)}
        style={{
          ...styles.backdrop,
          animation: closing ? 'fade-out 0.28s ease forwards' : 'fade-in 0.2s ease',
        }}
      />
      <div style={{
        ...styles.drawer,
        animation: closing ? 'slide-down-out 0.28s ease-in forwards' : 'slide-up 0.3s ease-out',
      }}>
        <div style={styles.handle} />
        <h3 style={styles.title}>{title}</h3>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.actions}>
          <PillButton onClick={() => dismiss(onCancel)} variant="glass" style={styles.btn}>Cancel</PillButton>
          <PillButton onClick={() => dismiss(onConfirm)} variant="dark" style={styles.btn}>{confirmLabel}</PillButton>
        </div>
      </div>
    </>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(154, 143, 134, 0.45)',
    zIndex: 190,
  },
  drawer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(237, 235, 235, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px 20px 0 0',
    padding: '16px 24px 48px',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  handle: {
    width: '36px',
    height: '4px',
    borderRadius: '99px',
    background: 'rgba(154, 143, 134, 0.35)',
    alignSelf: 'center',
    marginBottom: '8px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    color: 'var(--color-dark)',
    margin: 0,
  },
  message: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
    margin: 0,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  btn: {
    flex: 1,
    height: '52px',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
  },
}
