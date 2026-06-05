import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PillButton from '../ui/PillButton'

export default function AccountSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [editingName, setEditingName] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function saveDisplayName() {
    if (!displayName.trim()) return
    await supabase.auth.updateUser({ data: { full_name: displayName.trim() } })
    setEditingName(false)
  }

  async function handleChangePassword() {
    await supabase.auth.resetPasswordForEmail(user.email)
    setResetSent(true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={styles.section}>
      <span style={styles.sectionTitle}>Account</span>

      <div style={styles.card}>
        <div style={styles.fieldRow}>
          <span style={styles.label}>Display Name</span>
          {!editingName && (
            <button type="button" onClick={() => setEditingName(true)} style={styles.inlineBtn}>Edit</button>
          )}
        </div>
        {editingName ? (
          <div style={styles.inputRow}>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
              style={styles.input}
              placeholder="Your name"
              autoFocus
            />
            <button type="button" onClick={saveDisplayName} style={styles.inlineBtn}>Save</button>
            <button type="button" onClick={() => { setEditingName(false); setDisplayName(user?.user_metadata?.full_name ?? '') }} style={styles.cancelBtn}>✕</button>
          </div>
        ) : (
          <span style={styles.nameValue}>
            {displayName || <span style={styles.placeholder}>Not set</span>}
          </span>
        )}

        <div style={styles.divider} />

        <div style={styles.fieldRow}>
          <span style={styles.label}>Email</span>
          <span style={styles.value}>{user?.email}</span>
        </div>
      </div>

      <div style={styles.card}>
        {resetSent ? (
          <span style={styles.successText}>Reset email sent — check your inbox.</span>
        ) : (
          <button type="button" onClick={handleChangePassword} style={styles.linkBtn}>
            Send password reset email
          </button>
        )}
      </div>

      <PillButton onClick={handleLogout} variant="dark" style={styles.logoutBtn}>
        Log Out
      </PillButton>
    </div>
  )
}

const styles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  card: {
    background: 'rgba(237, 235, 235, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '12px',
    padding: '16px 20px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    color: 'var(--color-taupe)',
  },
  nameValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    color: 'var(--color-dark)',
  },
  placeholder: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
    fontStyle: 'italic',
  },
  value: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    background: 'var(--color-porcelain)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    padding: '8px 12px',
    outline: 'none',
  },
  inlineBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
    color: 'var(--color-accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },
  cancelBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },
  divider: {
    height: '1px',
    background: 'rgba(154, 143, 134, 0.2)',
    margin: '8px 0',
  },
  linkBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },
  successText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    fontStyle: 'italic',
  },
  logoutBtn: {
    width: '100%',
    height: '44px',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
  },
}
